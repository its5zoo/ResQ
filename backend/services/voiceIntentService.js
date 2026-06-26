import Task from '../models/Task.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Habit from '../models/Habit.js';
import Goal from '../models/Goal.js';
import User from '../models/User.js';
import { queryGemini } from './geminiService.js';

// In-memory cache for pending clarifications keyed by userId
const pendingCommands = new Map();

// In-memory cache for continuous conversation context keyed by userId
const conversationHistories = new Map();

// In-memory cache for the last 5 completed actions per user (rolling window for multi-turn memory)
const lastActions = new Map(); // userId -> Array<{intent, title, destination, time, raw}>

/**
 * Helper to get date boundaries for a specific day
 */
const getDayBoundaries = (date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

/**
 * Calculates free slots for a given user on a specific day
 */
export const getFreeSlotsForDay = async (userId, date) => {
  const user = await User.findById(userId);
  const startHourStr = user?.workingHours?.start || '09:00';
  const endHourStr = user?.workingHours?.end || '18:00';

  const [startHour, startMin] = startHourStr.split(':').map(Number);
  const [endHour, endMin] = endHourStr.split(':').map(Number);

  const { start: dayStartBound, end: dayEndBound } = getDayBoundaries(date);

  const workingHoursStart = new Date(dayStartBound);
  workingHoursStart.setHours(startHour, startMin, 0, 0);

  const workingHoursEnd = new Date(dayStartBound);
  workingHoursEnd.setHours(endHour, endMin, 0, 0);

  // Fetch all calendar events today that overlap with the day
  const events = await CalendarEvent.find({
    userId,
    startTime: { $lt: dayEndBound },
    endTime: { $gt: dayStartBound }
  }).sort({ startTime: 1 });

  const freeSlots = [];
  let currentCheckTime = new Date(workingHoursStart);

  for (const event of events) {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    // Only consider overlap within working hours
    const constrainedStart = eventStart < workingHoursStart ? workingHoursStart : eventStart;
    const constrainedEnd = eventEnd > workingHoursEnd ? workingHoursEnd : eventEnd;

    if (constrainedStart > currentCheckTime) {
      const durationMinutes = (constrainedStart - currentCheckTime) / 60000;
      if (durationMinutes > 0) {
        freeSlots.push({
          start: new Date(currentCheckTime),
          end: new Date(constrainedStart),
          durationMinutes
        });
      }
    }

    if (constrainedEnd > currentCheckTime) {
      currentCheckTime = new Date(constrainedEnd);
    }
  }

  if (currentCheckTime < workingHoursEnd) {
    const durationMinutes = (workingHoursEnd - currentCheckTime) / 60000;
    if (durationMinutes > 0) {
      freeSlots.push({
        start: new Date(currentCheckTime),
        end: new Date(workingHoursEnd),
        durationMinutes
      });
    }
  }

  return freeSlots;
};

/**
 * Finds the nearest free slot on the conflict day or subsequent days
 */
const findNearestFreeSlot = async (userId, conflictTime, durationMinutes = 45) => {
  let searchDate = new Date(conflictTime);
  
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const freeSlots = await getFreeSlotsForDay(userId, searchDate);
    
    // Filter free slots by duration and start bounds (only future times if searching on the same day)
    const validSlots = freeSlots.filter(slot => {
      if (slot.durationMinutes < durationMinutes) return false;
      if (dayOffset === 0) {
        return slot.start >= conflictTime;
      }
      return true;
    });

    if (validSlots.length > 0) {
      return validSlots[0].start; // Return the start time of the first available slot
    }

    // Advance to next day
    searchDate.setDate(searchDate.getDate() + 1);
  }

  // Fallback: return conflictTime shifted by 1 day
  const fallback = new Date(conflictTime);
  fallback.setDate(fallback.getDate() + 1);
  return fallback;
};

/**
 * Formats a Date object into a speech-friendly alternative string
 */
const formatSpeechDate = (date) => {
  return date.toLocaleString('en-US', {
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Post-processing rules engine
 */
const postProcessResult = async (resultObj, userId, transcript, userContext) => {
  if (!resultObj) return null;
  const cleanTranscript = transcript.toLowerCase();

  // 1. Conflict Check Post-Processing for schedule_event
  if (resultObj.intent === 'schedule_event' && resultObj.extractedData?.startTime) {
    const requestedStart = new Date(resultObj.extractedData.startTime);
    const duration = parseInt(resultObj.extractedData.durationMinutes) || 60;
    const requestedEnd = new Date(requestedStart.getTime() + duration * 60000);

    const conflict = await CalendarEvent.findOne({
      userId,
      $or: [
        { startTime: { $lt: requestedEnd, $gt: requestedStart } },
        { endTime: { $gt: requestedStart, $lte: requestedEnd } },
        { startTime: { $lte: requestedStart }, endTime: { $gte: requestedEnd } }
      ]
    });

    if (conflict) {
      const nearestFree = await findNearestFreeSlot(userId, requestedStart, duration);
      
      const formatTimeAmPm = (d) => {
        let hrs = d.getHours();
        const displayAmPm = hrs >= 12 ? 'pm' : 'am';
        hrs = hrs % 12;
        hrs = hrs ? hrs : 12;
        const mins = d.getMinutes();
        const minsStr = mins === 0 ? '' : `:${mins < 10 ? '0' + mins : mins}`;
        return `${hrs}${minsStr}${displayAmPm}`;
      };

      const requestedTimeStr = formatTimeAmPm(requestedStart);
      const alternativeTimeStr = formatTimeAmPm(nearestFree);
      
      const isTomorrow = new Date(Date.now() + 86400000).toDateString() === requestedStart.toDateString();
      const dayStr = isTomorrow ? 'Tomorrow' : requestedStart.toLocaleDateString([], { weekday: 'long' });
      const conflictTitle = conflict.title || 'another event';

      resultObj.intent = 'needs_clarification';
      resultObj.suggestAlternative = nearestFree.toISOString();
      resultObj.clarificationQuestion = `${dayStr} at ${requestedTimeStr} is already blocked for your ${conflictTitle}. Would ${alternativeTimeStr} work instead?`;
      resultObj.voiceResponse = resultObj.clarificationQuestion;
      
      // Cache original action context for clarification resolution
      pendingCommands.set(userId, {
        originalTranscript: transcript,
        context: userContext,
        extractedData: resultObj.extractedData,
        originalIntent: 'schedule_event',
        alternativeSlot: nearestFree
      });
      
      return resultObj;
    }
  }

  // 2. Task creation focus suggestion check (Flow 2)
  if (resultObj.intent === 'create_task') {
    const isHighPriority = resultObj.extractedData?.urgency >= 8 || 
                           cleanTranscript.includes('high priority') || 
                           cleanTranscript.includes('priority');
    const hasInvestorDeck = cleanTranscript.includes('investor deck') || 
                            cleanTranscript.includes('finish the investor deck');
                            
    if (isHighPriority || hasInvestorDeck) {
      const taskTitle = resultObj.extractedData?.title || 'finish the investor deck';
      resultObj.extractedData = resultObj.extractedData || {};
      resultObj.extractedData.title = taskTitle;
      if (!resultObj.extractedData.urgency) {
        resultObj.extractedData.urgency = 9;
      }
      
      resultObj.intent = 'needs_clarification';
      resultObj.clarificationQuestion = `Added. I've set '${taskTitle}' as high priority. Want me to block focus time for it today?`;
      resultObj.voiceResponse = resultObj.clarificationQuestion;

      pendingCommands.set(userId, {
        originalTranscript: transcript,
        context: userContext,
        extractedData: resultObj.extractedData,
        originalIntent: 'create_task_focus_suggest'
      });
      
      return resultObj;
    }
  }

  // 3. Default Due Date Post-Processing for create_task (General tasks)
  if (resultObj.intent === 'create_task') {
    if (resultObj.missingFields && resultObj.missingFields.includes('dueDate')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(17, 0, 0, 0); // 5 PM EOD
      
      resultObj.extractedData = resultObj.extractedData || {};
      resultObj.extractedData.dueDate = tomorrow.toISOString();
      resultObj.missingFields = resultObj.missingFields.filter(f => f !== 'dueDate');
      
      const defaultMention = " I have set the due date to tomorrow EOD.";
      if (resultObj.voiceResponse) {
        if (!resultObj.voiceResponse.endsWith('.')) {
          resultObj.voiceResponse += '.';
        }
        resultObj.voiceResponse += defaultMention;
      } else {
        resultObj.voiceResponse = `Done. I've added that task.${defaultMention}`;
      }
    }
  }

  // Intercept Destructive or Modifying Intents
  const modifyingIntents = ['delete_task', 'edit_task', 'cancel_event', 'reschedule_event', 'delete_habit'];
  if (modifyingIntents.includes(resultObj.intent)) {
    const originalIntent = resultObj.intent;
    const titleOrName = resultObj.extractedData?.title || resultObj.extractedData?.name || 'this item';
    let actionWord = 'modify';
    if (originalIntent.includes('delete') || originalIntent.includes('cancel')) actionWord = 'delete';
    else if (originalIntent.includes('reschedule')) actionWord = 'reschedule';
    else if (originalIntent.includes('edit')) actionWord = 'update';

    resultObj.intent = 'needs_clarification';
    resultObj.clarificationQuestion = `Are you sure you want to ${actionWord} '${titleOrName}'?`;
    resultObj.voiceResponse = resultObj.clarificationQuestion;
    
    pendingCommands.set(userId, {
      originalTranscript: transcript,
      context: userContext,
      extractedData: resultObj.extractedData,
      originalIntent: originalIntent
    });

    return resultObj;
  }

  // 4. Needs Clarification Caching
  if (resultObj.intent === 'needs_clarification') {
    pendingCommands.set(userId, {
      originalTranscript: transcript,
      context: userContext,
      extractedData: resultObj.extractedData,
      originalIntent: resultObj.suggestAlternative ? 'schedule_event' : resultObj.intent,
      alternativeSlot: resultObj.suggestAlternative ? new Date(resultObj.suggestAlternative) : null
    });
    if (resultObj.clarificationQuestion) {
      resultObj.voiceResponse = resultObj.clarificationQuestion;
    }
  }

  return resultObj;
};

/**
 * Local helper to compute free slots purely from context events (no DB calls)
 */
const getLocalFreeSlots = (events, workingHours, targetDate) => {
  const startHourStr = workingHours?.start || '09:00';
  const endHourStr = workingHours?.end || '18:00';

  const [startHour, startMin] = startHourStr.split(':').map(Number);
  const [endHour, endMin] = endHourStr.split(':').map(Number);

  const start = new Date(targetDate);
  start.setHours(startHour, startMin, 0, 0);

  const end = new Date(targetDate);
  end.setHours(endHour, endMin, 0, 0);

  const sortedEvents = [...events].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

  const freeSlots = [];
  let currentCheckTime = new Date(start);

  for (const event of sortedEvents) {
    const eventStart = new Date(event.startTime);
    const eventEnd = new Date(event.endTime);

    const constrainedStart = eventStart < start ? start : eventStart;
    const constrainedEnd = eventEnd > end ? end : eventEnd;

    if (constrainedStart > currentCheckTime) {
      const durationMinutes = (constrainedStart - currentCheckTime) / 60000;
      if (durationMinutes > 0) {
        freeSlots.push({
          start: new Date(currentCheckTime),
          end: new Date(constrainedStart),
          durationMinutes
        });
      }
    }

    if (constrainedEnd > currentCheckTime) {
      currentCheckTime = new Date(constrainedEnd);
    }
  }

  if (currentCheckTime < end) {
    const durationMinutes = (end - currentCheckTime) / 60000;
    if (durationMinutes > 0) {
      freeSlots.push({
        start: new Date(currentCheckTime),
        end: new Date(end),
        durationMinutes
      });
    }
  }

  return freeSlots;
};

/**
 * Local backup parser to gracefully handle Gemini outages or quota exceed errors (429)
 */
const getLocalFallbackResult = (transcript, context) => {
  const clean = transcript.toLowerCase();
  const userName = context.name || 'User';

  // 1. Password / Email / Billing Security Block (out of bounds)
  if (
    clean.includes('password') ||
    clean.includes('email') ||
    clean.includes('billing') ||
    clean.includes('subscription') ||
    clean.includes('payment') ||
    clean.includes('delete account') ||
    clean.includes('profile picture') ||
    clean.includes('display name') ||
    clean.includes('change my name')
  ) {
    return {
      intent: 'permission_denied',
      confidence: 1.0,
      extractedData: {},
      missingFields: [],
      clarificationQuestion: null,
      voiceResponse: "I can't access account or billing settings — those need to be changed manually for your security. Is there something else I can help with?",
      uiAction: null,
      navigationTarget: null,
      suggestAlternative: null
    };
  }

  // 2. Theme switcher fallback
  if (clean.includes('theme') || clean.includes('light mode') || clean.includes('matrix') || clean.includes('dark mode')) {
    let theme = 'dark';
    if (clean.includes('light')) theme = 'light';
    else if (clean.includes('matrix')) theme = 'matrix';
    return {
      intent: 'change_theme',
      confidence: 1.0,
      extractedData: {},
      missingFields: [],
      clarificationQuestion: null,
      voiceResponse: `Switched to ${theme} mode. Looks great.`,
      uiAction: { type: 'change_theme', payload: { theme } },
      navigationTarget: 'settings',
      suggestAlternative: null
    };
  }

  // 3. Focus Session fallback
  if (clean.includes('focus') && (clean.includes('start') || clean.includes('begin') || clean.includes('engage'))) {
    // Extract task if specified: "focus on X"
    let taskName = 'Deep Work Session';
    const focusMatch = clean.match(/focus\s+(?:on|for)\s+([^0-9]+)/);
    if (focusMatch && !focusMatch[1].includes('min')) {
      taskName = focusMatch[1].trim();
    }
    
    // Extract duration: "for X minutes"
    let duration = 25;
    const durMatch = clean.match(/(\d+)\s*min/);
    if (durMatch) duration = parseInt(durMatch[1]);

    return {
      intent: 'set_focus_session',
      confidence: 1.0,
      extractedData: { durationMinutes: duration, taskName },
      missingFields: [],
      clarificationQuestion: null,
      voiceResponse: `Absolutely. Engaging focus mode for ${duration} minutes.`,
      uiAction: { type: 'start_focus', payload: { task: taskName, duration } },
      navigationTarget: 'dashboard',
      suggestAlternative: null
    };
  }

  // Stop Focus fallback
  if (clean.includes('focus') && (clean.includes('stop') || clean.includes('exit') || clean.includes('end') || clean.includes('pause'))) {
    return {
      intent: 'stop_focus_session',
      confidence: 1.0,
      extractedData: {},
      missingFields: [],
      clarificationQuestion: null,
      voiceResponse: "Got it. Stopping the focus session.",
      uiAction: { type: 'stop_focus', payload: {} },
      navigationTarget: null,
      suggestAlternative: null
    };
  }

  // 4. Calendar event / Study scheduling fallback
  const timeMatch = clean.match(/(\d+)(?::(\d+))?\s*(a\.m\.|p\.m\.|am|pm)/i) || clean.match(/at\s+(\d+)(?::(\d+))?/i);
  
  if (
    clean.includes('schedule') || 
    clean.includes('meeting') || 
    clean.includes('event') || 
    clean.includes('calendar') || 
    clean.includes('book') || 
    clean.includes('study') || 
    clean.includes('timetable') ||
    clean.includes('time table') ||
    clean.includes('slot') ||
    (timeMatch && !clean.includes('focus'))
  ) {
    const dayTomorrow = clean.includes('tomorrow');
    
    // Title extraction helper
    let title = 'Study Session';
    const commonSubjects = {
      'study': 'Study Session',
      'meeting': 'Meeting',
      'running': 'Running',
      'run': 'Running',
      'gym': 'Workout',
      'workout': 'Workout',
      'class': 'Class',
      'lunch': 'Lunch Break',
      'dinner': 'Dinner',
      'break': 'Break',
      'sync': 'Sync Meeting',
      'work': 'Deep Work',
      'sleep': 'Sleeping Time',
      'sleeping': 'Sleeping Time'
    };
    
    let subjectFound = false;
    for (const [key, val] of Object.entries(commonSubjects)) {
      if (clean.includes(key)) {
        title = val;
        subjectFound = true;
        break;
      }
    }

    if (!subjectFound) {
      const titleMatch = clean.match(/(?:schedule|book|create|set|timetable|time table)\s+(?:a\s+)?([^0-9]+?)(?:\s+at|\s+for|\s+tomorrow|\s+today|\s+6:|\s+1|\s+2|\s+3|\s+4|\s+5|\s+6|\s+7|\s+8|\s+9|\s+0|$)/);
      if (titleMatch && titleMatch[1]) {
        const matchWord = titleMatch[1].trim();
        const cleanedWord = matchWord.replace(/^(a|an|the|my|our)\s+/, '').trim();
        if (cleanedWord && !['study', 'timetable', 'time table', 'meeting', 'event', 'calendar', 'slot'].includes(cleanedWord)) {
          title = cleanedWord.charAt(0).toUpperCase() + cleanedWord.slice(1);
        }
      }
    }

    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      let minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : '';
      
      if ((ampm.includes('pm') || ampm.includes('p.m.')) && hours < 12) {
        hours += 12;
      }
      if ((ampm.includes('am') || ampm.includes('a.m.')) && hours === 12) {
        hours = 0;
      }
      
      let targetDate = new Date();
      if (dayTomorrow) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      const isAllDay = clean.includes('no time') || clean.includes('without time') || clean.includes('all day') || clean.includes('any time');

      if (isAllDay) {
        targetDate.setHours(0, 1, 0, 0); // 00:01
        return {
          intent: 'schedule_event',
          confidence: 0.95,
          extractedData: {
            title,
            startTime: targetDate.toISOString(),
            endTime: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            type: 'ai_block',
            notes: 'Scheduled via local fallback (All Day)',
            isAllDay: true
          },
          missingFields: [],
          clarificationQuestion: null,
          voiceResponse: `Got it. I've added '${title}' to your calendar for ${dayTomorrow ? 'tomorrow' : 'today'} as an all-day event.`,
          uiAction: null,
          navigationTarget: 'calendar',
          suggestAlternative: null
        };
      }

      targetDate.setHours(hours, minutes, 0, 0);
      
      // If the scheduled time is already in the past, shift to tomorrow
      if (targetDate < new Date() && !dayTomorrow) {
        targetDate.setDate(targetDate.getDate() + 1);
      }
      
      const endTime = new Date(targetDate.getTime() + 45 * 60 * 1000); // 45 min default duration
      
      return {
        intent: 'schedule_event',
        confidence: 0.95,
        extractedData: {
          title,
          startTime: targetDate.toISOString(),
          endTime: endTime.toISOString(),
          type: 'ai_block',
          notes: 'Scheduled via local fallback'
        },
        missingFields: [],
        clarificationQuestion: null,
        voiceResponse: `Got it. I've scheduled your slot '${title}' for ${dayTomorrow ? 'tomorrow' : 'today'} at ${timeMatch[1]}${minutes ? ':' + minutes : ''} ${ampm.toUpperCase() || 'PM'}.`,
        uiAction: null,
        navigationTarget: 'calendar',
        suggestAlternative: null
      };
    }

    const relativeTimeMatch = clean.match(/(?:after|in)\s+(\d+)\s*(min|hour|hr|minute|hours|hrs)/i);
    if (relativeTimeMatch) {
      const amount = parseInt(relativeTimeMatch[1]);
      const unit = relativeTimeMatch[2].toLowerCase();
      
      let additionalMs = 0;
      if (unit.startsWith('min')) {
        additionalMs = amount * 60 * 1000;
      } else if (unit.startsWith('h') || unit.startsWith('hr')) {
        additionalMs = amount * 60 * 60 * 1000;
      }
      
      const targetDate = new Date(Date.now() + additionalMs);
      const endTime = new Date(targetDate.getTime() + 45 * 60 * 1000);
      
      const formattedTime = targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        intent: 'schedule_event',
        confidence: 0.95,
        extractedData: {
          title,
          startTime: targetDate.toISOString(),
          endTime: endTime.toISOString(),
          type: 'ai_block',
          notes: 'Scheduled via local fallback (relative time)'
        },
        missingFields: [],
        clarificationQuestion: null,
        voiceResponse: `Got it. I've scheduled '${title}' for ${formattedTime}.`,
        uiAction: null,
        navigationTarget: 'calendar',
        suggestAlternative: null
      };
    }      

    // No time specified — ask the user instead of auto-picking a slot
    const dayWord = dayTomorrow ? 'tomorrow' : 'today';
    const questionText = `What time would you like to schedule '${title}' ${dayWord}? Or if you don't have a set time, just say "no specific time" and I'll add it to the calendar.`;

    return {
      intent: 'needs_clarification',
      confidence: 0.9,
      extractedData: { title, durationMinutes: 45 },
      missingFields: ['startTime'],
      clarificationQuestion: questionText,
      voiceResponse: questionText,
      uiAction: null,
      navigationTarget: 'calendar',
      suggestAlternative: null
    };
  }

  // 4.5 Goal creation fallback
  if ((clean.includes('goal') || clean.includes('god') || clean.includes('goals')) && (clean.includes('add') || clean.includes('create') || clean.includes('set'))) {
    let goalTitle = 'New Goal';
    const goalMatch = clean.match(/(?:add|create|set)\s+(?:a\s+goal\s+called|a\s+goal\s+to|called|to\s+)?([^]+)$/i);
    if (goalMatch && goalMatch[1]) {
      goalTitle = goalMatch[1]
        .replace(/called\s+/, '')
        .replace(/\b(?:to|in|on)\s+my\s+(?:goals?|god)\b/i, '')
        .replace(/\bfor\s+(?:a|the)?\s*full\s+week\b/i, '')
        .trim();
    }
    
    // Only return goal intent if we actually found a title that isn't just "task" etc
    if (goalTitle && goalTitle !== 'task' && goalTitle !== 'todo') {
      return {
        intent: 'create_goal',
        confidence: 0.9,
        extractedData: { title: goalTitle },
        missingFields: [],
        clarificationQuestion: null,
        voiceResponse: `Absolutely. I've added the goal: '${goalTitle}'.`,
        uiAction: null,
        navigationTarget: 'goals',
        suggestAlternative: null
      };
    }
  }

  // 5. Tasks creation fallback
  if (clean.includes('task') || clean.includes('todo') || clean.includes('add') || clean.includes('create')) {
    // Extract task title
    let taskTitle = 'New Task';
    const taskMatch = clean.match(/(?:add|create|task|todo)\s+(?:a\s+task\s+called|a\s+task\s+to|called|to\s+)?([^]+)$/i);
    if (taskMatch && taskMatch[1]) {
      taskTitle = taskMatch[1]
        .replace(/called\s+/, '')
        .replace(/\b(?:to|in|on)\s+my\s+(?:tasks?|list|todo list|todo)\b/i, '')
        .trim();
    }
    
    // Check priority
    const urgency = clean.includes('high priority') || clean.includes('important') || clean.includes('urgent') ? 9 : 5;

    return {
      intent: 'create_task',
      confidence: 0.9,
      extractedData: {
        title: taskTitle,
        urgency,
        category: 'General'
      },
      missingFields: [],
      clarificationQuestion: null,
      voiceResponse: `Absolutely. I've added the task: '${taskTitle}'.`,
      uiAction: null,
      navigationTarget: 'tasks',
      suggestAlternative: null
    };
  }

  // 6. Complete task fallback
  if ((clean.includes('complete') || clean.includes('finish') || clean.includes('done')) && clean.includes('task')) {
    let taskTitle = '';
    const match = clean.match(/(?:complete|finish|done)\s+(?:task\s+)?([^]+)$/i);
    if (match && match[1]) {
      taskTitle = match[1].trim();
    }
    return {
      intent: 'complete_task',
      confidence: 0.9,
      extractedData: {
        title: taskTitle
      },
      missingFields: [],
      clarificationQuestion: null,
      voiceResponse: `Marking task '${taskTitle || 'it'}' as complete.`,
      uiAction: null,
      navigationTarget: 'tasks',
      suggestAlternative: null
    };
  }

  // 7. Today summary / brief fallback
  const hasSummaryKeywords = clean.includes('summarize') || clean.includes('summary') || clean.includes('briefing');
  const hasTodayScheduleKeywords = clean.includes('today') && (clean.includes('what') || clean.includes('schedule') || clean.includes('my'));
  if (hasSummaryKeywords || hasTodayScheduleKeywords) {
    return {
      intent: 'show_summary',
      confidence: 1.0,
      extractedData: { period: 'today' },
      missingFields: [],
      clarificationQuestion: null,
      voiceResponse: `Got it. Here is the summary of your day, ${userName}.`,
      uiAction: null,
      navigationTarget: 'calendar',
      suggestAlternative: null
    };
  }

  // 8. Habit tracking fallback
  if (clean.includes('habit') && (clean.includes('check') || clean.includes('complete') || clean.includes('done'))) {
    return {
      intent: 'complete_habit',
      confidence: 1.0,
      extractedData: { name: 'Gym Workout Routine' },
      missingFields: [],
      clarificationQuestion: null,
      voiceResponse: "Awesome. I've checked off your daily habit.",
      uiAction: null,
      navigationTarget: 'habits',
      suggestAlternative: null
    };
  }

  // 9. General default fallback
  return {
    intent: 'out_of_scope',
    confidence: 0.5,
    extractedData: {},
    missingFields: [],
    clarificationQuestion: null,
    voiceResponse: "I can't do that, but I'm built to help you with tasks, your calendar, habits, goals, and staying focused. What would you like to tackle?",
    uiAction: null,
    navigationTarget: null,
    suggestAlternative: null
  };
};


/**
 * Main Entry Point: Understand user command and decide action.
 */
export const processVoiceCommand = async (transcript, userId, timezoneContext = null) => {
  // 1. Fetch User Context
  const user = await User.findById(userId);
  const userName = user?.name ? user.name.split(' ')[0] : 'User';
  
  const tasks = await Task.find({ userId }).sort({ aiPriorityRank: 1, urgency: -1 });
  
  const today = getDayBoundaries(new Date());
  const tomorrow = getDayBoundaries(new Date(Date.now() + 86400000));
  
  const todayEvents = await CalendarEvent.find({
    userId,
    startTime: { $lt: today.end },
    endTime: { $gt: today.start }
  }).sort({ startTime: 1 });

  const tomorrowEvents = await CalendarEvent.find({
    userId,
    startTime: { $lt: tomorrow.end },
    endTime: { $gt: tomorrow.start }
  }).sort({ startTime: 1 });

  const habits = await Habit.find({ userId });
  const goals = await Goal.find({ userId });

  // 2. Fetch free slots today
  const freeSlots = await getFreeSlotsForDay(userId, new Date());

  // Build timezone-aware time context so Gemini interprets "today", "tonight", "10 PM" correctly
  const nowUtc = new Date();
  
  // Determine timezone offset from client context (if available), otherwise fallback to server's timezone
  let tzOffsetMinutes = -nowUtc.getTimezoneOffset(); // getTimezoneOffset() is inverted
  let localTimeStr = nowUtc.toLocaleString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    timeZoneName: 'longOffset'
  });

  if (timezoneContext && typeof timezoneContext.tzOffsetMinutes === 'number') {
    // The browser's getTimezoneOffset is positive for West (e.g. EST is +300), negative for East (IST is -330)
    // We want the actual UTC offset, so we invert it: IST -> +330
    tzOffsetMinutes = -timezoneContext.tzOffsetMinutes;
    if (timezoneContext.localISOTime) {
      localTimeStr = timezoneContext.localISOTime;
    } else {
      // Manual compute if only offset provided
      const localTimeMs = nowUtc.getTime() + (tzOffsetMinutes * 60000);
      localTimeStr = new Date(localTimeMs).toLocaleString('en-US', { timeZone: 'UTC' }) + ' (Local Computed)';
    }
  }

  const tzOffsetHours = Math.floor(Math.abs(tzOffsetMinutes) / 60);
  const tzOffsetMins = Math.abs(tzOffsetMinutes) % 60;
  const tzSign = tzOffsetMinutes >= 0 ? '+' : '-';
  const tzOffsetStr = `UTC${tzSign}${String(tzOffsetHours).padStart(2, '0')}:${String(tzOffsetMins).padStart(2, '0')}`;

  const userContext = {
    name: userName,
    workingHours: user?.workingHours || { start: '09:00', end: '18:00' },
    tasks,
    todayEvents,
    tomorrowEvents,
    habits,
    goals,
    freeSlots,
    currentTime: nowUtc.toISOString(),
    localTime: localTimeStr,
    timezone: tzOffsetStr
  };
  const recentActions = lastActions.get(userId.toString()) || [];
  const lastAction = recentActions.length > 0 ? recentActions[recentActions.length - 1] : null;

  // Build a rich app snapshot for Gemini context
  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed).slice(-3);
  const urgentTasks = incompleteTasks.filter(t => t.urgency >= 8);
  const upcomingGoals = goals.slice(0, 5);
  const activeHabits = habits.slice(0, 8);
  const todaySummary = {
    events: todayEvents.map(e => ({ title: e.title, time: new Date(e.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }), type: e.type })),
    incompleteTasks: incompleteTasks.slice(0, 6).map(t => ({ _id: t._id, title: t.title, urgency: t.urgency, dueDate: t.dueDate })),
    urgentTasks: urgentTasks.map(t => ({ _id: t._id, title: t.title, urgency: t.urgency })),
    habits: activeHabits.map(h => ({ _id: h._id, name: h.name, targetDays: h.targetDays, streak: h.streak })),
    goals: upcomingGoals.map(g => ({ _id: g._id, title: g.title, progress: g.progress, targetDate: g.targetDate })),
    tomorrowEvents: tomorrowEvents.map(e => ({ title: e.title, time: new Date(e.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }), type: e.type })),
    freeSlots: freeSlots.slice(0, 4).map(s => ({ from: s.start, to: s.end, durationMinutes: s.durationMinutes }))
  };

  const masterSystemPrompt = `
You are ResQ, the embedded AI productivity brain inside a personal productivity web app.
You have FULL read & write access to the user's Tasks, Calendar Events, Habits, and Goals.
You do NOT have access to: external apps, emails, social media, web browsing, payments, or account security settings.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ TIMEZONE — READ THIS FIRST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
User's LOCAL timezone: ${tzOffsetStr}
User's current LOCAL time: ${localTimeStr}
All times the user speaks ("10 PM", "tomorrow 6 AM", "tonight") are in their LOCAL timezone.
Convert to UTC when generating ISO timestamps.
Formula: UTC = Local Time − (${tzSign}${tzOffsetHours}h ${tzOffsetMins}m)
Example: "10 PM today" in UTC+5:30 → 16:30 UTC
NEVER treat spoken times as UTC.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 FULL APPLICATION STATE (USE THIS TO ANSWER ANY QUESTION ABOUT THE USER'S DATA)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Today's calendar events: ${JSON.stringify(todaySummary.events)}
Tomorrow's calendar events: ${JSON.stringify(todaySummary.tomorrowEvents)}
Incomplete tasks (prioritized): ${JSON.stringify(todaySummary.incompleteTasks)}
Urgent tasks (urgency >= 8): ${JSON.stringify(todaySummary.urgentTasks)}
Active habits: ${JSON.stringify(todaySummary.habits)}
Goals: ${JSON.stringify(todaySummary.goals)}
Free time slots today: ${JSON.stringify(todaySummary.freeSlots)}

USE THIS DATA to answer questions like:
- "Do I have anything tomorrow?" → Look at tomorrowEvents and incompleteTasks with tomorrow's due date
- "What's my schedule for today?" → Summarize todayEvents and urgent tasks in a conversational way
- "Do I have any habits today?" → Check activeHabits and their targetDays vs today's day
- "How is my goal going?" → Find the goal in Goals and speak the progress
- "What are my tasks?" or "What do I have to do today?" → CRITICAL: Users use the word "task" to mean anything on their schedule. You MUST look at Today's calendar events, Incomplete tasks, AND Active habits together. If the task list is empty but there are events/habits, tell them about the events/habits instead of saying the day is empty.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗂️ CONVERSATION MEMORY (LAST 5 ACTIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${recentActions.length > 0 ? recentActions.map((a, i) => `${i + 1}. Intent: ${a.intent} | Item: ${a.title || 'N/A'} | Where: ${a.destination || 'N/A'} | Time: ${a.time || 'N/A'}`).join('\n') : 'No recent actions yet.'}

Use this memory to handle follow-up commands:
- "change it", "edit that", "actually make it Friday" → refers to the most recent action
- "where did you add that?", "what time did you set?" → answer from memory
- "haa" / "theek hai" / "yes" / "do it" / "go ahead" → affirmative response to the LAST clarification question, proceed with action
- "nahi" / "nope" / "cancel" / "nevermind" → cancel/decline the last pending action

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎭 PERSONALITY & TONE RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are a smart, witty, and warm human-like assistant. Your personality rules:

1. **Vary your tone naturally** — Sometimes be funny/playful, sometimes calm/supportive, sometimes direct/efficient. NEVER use the same phrase twice in a row.
2. **Be funny when appropriate** — If the user is being casual or joking, match their energy. Light humor is welcome.
3. **Be direct when needed** — If the user gives a clear command, just do it and confirm briefly. No unnecessary praise like "Great choice!" or "Wonderful!".
4. **Keep confirmations SHORT** — Max 2 sentences for action confirmations. Max 3 sentences for briefings/summaries.
5. **Sound human, not robotic** — Avoid: "I have successfully processed your request." Prefer: "Done! Added to your list."
6. **Personality variety** — Rotate between these styles based on context:
   - Casual task creation: "On it!" / "Done, added that." / "Yep, got it." / "Consider it done."
   - Schedule confirmed: "Locked in." / "You're set." / "Booked it."
   - Encouragement: "Nice, you're on a roll." / "That's the spirit!"
   - Funny moment: "Look at you being all productive!" / "Your future self will thank you."
   - Summary: "Here's your day..." / "So here's what you've got..."
7. **NEVER start two consecutive responses the same way.**
8. **Hinglish Support**: If the user speaks in Hinglish (mix of Hindi and English), you MUST respond in the same Hinglish tone — casual, warm, mixed. E.g.: "Ho gaya! Maine add kar diya."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔀 SMART MODULE ROUTING ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When the user says something, FIRST determine WHERE it belongs:

**→ TASK** if it's:
- One-time actionable work ("finish the report", "buy groceries", "call the client")
- Has a deadline ("before Monday", "by 5 PM")
- An assignment ("submit the project", "complete homework")
- A bill or reminder ("pay electricity bill")
- Includes "remind me to", "I need to", "I have to do"

**→ CALENDAR EVENT** if it's:
- Date/time specific ("tomorrow at 3 PM", "on July 10")
- An appointment, meeting, or interview
- A scheduled activity ("gym at 6 AM", "class at 9")
- A deadline that needs time-blocking
- Sleeping time ("set sleep for 11 PM")

**→ HABIT** if it's:
- Recurring ("every day", "5 days a week", "every Monday", "every morning/evening")
- A routine ("I go to gym regularly", "I meditate daily")
- Contains words: "routine", "daily", "weekly", "regularly", "every"

**→ GOAL** if it's:
- Long-term ambition ("I want to learn AI this year", "I want to become a developer")
- Multi-week/month objective
- Career, fitness journey, financial, or learning target
- Contains "I want to become", "my goal is", "I'm working towards"

**→ AMBIGUOUS** (ask clarification) if NONE of the above patterns clearly match.
Ask: "Sure! Should I add '[X]' as a daily habit, a one-time task, or schedule it on your calendar?"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚡ EXECUTION RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. **Direct commands → Execute immediately.** Don't ask "Are you sure?". Just do it.
2. **Time-missing scheduling (CRITICAL)** → If the user asks to schedule/book/add a calendar event but gives NO specific time:
   a. ALWAYS ask: "What time would you like to schedule '[title]'? Or if you don't have a set time, just say 'no specific time' and I'll add it to the calendar."
   b. Set intent to needs_clarification with missingFields: ['startTime'].
   c. If the user replies with "no time", "no specific time", "any time", "doesn't matter", "just add it", or similar → then set intent to schedule_event and pass \`isAllDay: true\` in the extractedData. Set startTime to 00:00 of the requested day, but rely on isAllDay to skip the time slot.
   d. EXCEPTION: If the user DOES provide a time (e.g. "at 6 PM", "9 in the morning") in the SAME sentence → use that exact time, do NOT ask again.
3. **If user says exact time** → Use EXACTLY that time, even if outside working hours.
4. **Rescheduling** → "Move", "switch", "change the time" = reschedule_event (not schedule_event).
5. **Vague tasks** → If task title is missing ("add a task" with no subject), ask: "What should I call the task?"
6. **Sleep command** → "sleep", "stop", "close", "bye" → intent: close_intent, extractedData: { isSleep: true }
7. **Confidence < 0.7** → Return needs_clarification. Don't guess on low-confidence intents.
8. **Rename tasks** → If user says "rename X to Y" or "change the name of X" → use rename_task intent.
9. **Read/query requests** → "what tasks do I have?", "show my habits", "tell me my goals" → use read_tasks / read_habits / read_goals intent. Summarize from the context data above.
10. **Affirmation detection** → Detect: "haa", "theek hai", "han", "yes", "yep", "sure", "ok", "do it", "go ahead", "bilkul", "kar do" → treat as affirmative to last clarification.
11. **Denial detection** → Detect: "nahi", "mat karo", "no", "nope", "cancel", "nevermind", "ruk" → treat as rejection of last clarification.
12. **Mind-change detection** → "actually", "wait", "no instead", "change to" mid-sentence → update the most recent pending action accordingly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 PERMISSION BOUNDARIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CAN do:
  ✅ Create/edit/complete/delete tasks
  ✅ Schedule/reschedule/cancel calendar events
  ✅ Create/complete/delete/update habits
  ✅ Create goals, update goal progress
  ✅ Read/summarize any app data (tasks, habits, goals, calendar)
  ✅ Switch theme (dark/light/matrix)
  ✅ Navigate to any section
  ✅ Start/stop focus sessions
  ✅ Show summaries, deadlines, free time
  ✅ Rename tasks

CANNOT do (return permission_denied):
  ❌ Change name/email/password/profile picture
  ❌ Access billing or subscription details
  ❌ Delete user account
  ❌ Access another user's data
  ❌ Browse the web, send emails, buy things

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 FULL INTENT LIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- create_task: { title, urgency(1-10), dueDate, estimatedMinutes, category }
- complete_task: { taskId OR title }
- rename_task: { title (old name to find), newTitle }
- update_task_priority: { title OR taskId, urgency }
- delete_task: { title OR taskId }
- schedule_event: { title, startTime, endTime, type, notes, isAllDay }
- reschedule_event: { title OR eventId, newStartTime, newEndTime }
- cancel_event: { title OR eventId }
- auto_schedule_tasks: {}
- show_free_time: { date? }
- create_habit: { name, targetDays[] — use short day codes: Mon/Tue/Wed/Thu/Fri/Sat/Sun }
- complete_habit: { name OR habitId }
- delete_habit: { name OR habitId }
- update_habit: { name OR habitId, targetDays[] }
- create_goal: { title, targetDate? }
- update_goal_progress: { title OR goalId, progressPercent }
- read_tasks: {} — speak the incomplete task list
- read_habits: {} — speak the habit list
- read_goals: {} — speak the goals and their progress
- read_calendar: { day?: 'today'|'tomorrow' } — speak today's or tomorrow's schedule
- show_summary: { period: 'today'|'week' }
- set_focus_session: { durationMinutes, taskId? }
- show_deadlines: { timeframe? }
- navigate: { target: 'tasks'|'calendar'|'goals'|'habits'|'dashboard'|'settings' }
- change_theme: { theme: 'dark'|'light'|'matrix' }
- casual_chat: {} — for greetings, jokes, general questions
- out_of_scope: {} — for external actions (buying, emailing, browsing)
- needs_clarification: {} — when critical info is missing or confidence < 0.7
- permission_denied: {} — for blocked security actions
- close_intent: { isSleep: true } — to close/sleep the assistant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 RESPONSE FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Return ONLY valid JSON. No markdown wrappers, no extra text.
{
  "intent": "<intent from list>",
  "confidence": 0.0-1.0,
  "extractedData": { ...fields specific to intent },
  "missingFields": [],
  "clarificationQuestion": null,
  "voiceResponse": "<natural, varied, human-like spoken response — max 2 sentences for actions, max 3 for summaries>",
  "uiAction": { "type": "string", "payload": {} } or null,
  "navigationTarget": "string | null",
  "suggestAlternative": "string | null"
}
`;

  try {
    const userPrompt = `User said: '${transcript}'\n\nToday's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\nToday's calendar: ${JSON.stringify(todaySummary.events)}\nTomorrow's calendar: ${JSON.stringify(todaySummary.tomorrowEvents)}\nMy incomplete tasks: ${JSON.stringify(todaySummary.incompleteTasks)}\nMy habits: ${JSON.stringify(todaySummary.habits)}\nMy goals: ${JSON.stringify(todaySummary.goals)}\nFree time today: ${JSON.stringify(todaySummary.freeSlots)}`;
    
    let history = conversationHistories.get(userId.toString()) || [];
    if (history.length === 0) {
      history.push({ role: 'user', parts: [{ text: masterSystemPrompt }] });
      history.push({ role: 'model', parts: [{ text: "Understood. I am ResQ, ready to help." }] });
    }
    
    history.push({ role: 'user', parts: [{ text: userPrompt }] });
    
    // Keep context window small (system prompt + last 10 messages)
    if (history.length > 12) {
      history = [history[0], history[1], ...history.slice(-10)];
    }

    const rawResponse = await queryGemini(history, true);
    const finalResult = await postProcessResult(rawResponse, userId, transcript, userContext);
    
    if (finalResult) {
      history.push({ role: 'model', parts: [{ text: JSON.stringify(finalResult) }] });
      conversationHistories.set(userId.toString(), history);

      // Store in rolling lastActions window (max 5) for multi-turn memory
      const actionableIntents = ['create_task', 'schedule_event', 'create_habit', 'create_goal', 'complete_task', 'complete_habit', 'update_goal_progress', 'set_focus_session', 'rename_task', 'delete_task', 'cancel_event', 'reschedule_event', 'delete_habit', 'update_habit'];
      if (actionableIntents.includes(finalResult.intent)) {
        const ed = finalResult.extractedData || {};
        const destinationMap = {
          create_task: 'Tasks section',
          rename_task: 'Tasks section (renamed)',
          schedule_event: 'Calendar',
          reschedule_event: 'Calendar (rescheduled)',
          cancel_event: 'Calendar (cancelled)',
          create_habit: 'Habits section',
          delete_habit: 'Habits section (deleted)',
          update_habit: 'Habits section (updated)',
          create_goal: 'Goals section',
          complete_task: 'Tasks section (marked complete)',
          delete_task: 'Tasks section (deleted)',
          complete_habit: 'Habits section (marked complete)',
          update_goal_progress: 'Goals section',
          set_focus_session: 'Calendar (Focus Session)'
        };
        const existingHistory = lastActions.get(userId.toString()) || [];
        const newEntry = {
          intent: finalResult.intent,
          title: ed.title || ed.name || ed.newTitle || null,
          destination: destinationMap[finalResult.intent] || null,
          time: ed.startTime || ed.newStartTime ? new Date(ed.startTime || ed.newStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
          raw: finalResult
        };
        // Keep rolling window of max 5
        const updatedHistory = [...existingHistory, newEntry].slice(-5);
        lastActions.set(userId.toString(), updatedHistory);
      }
    }
    
    return finalResult;
  } catch (err) {
    console.warn('[voiceIntentService] Gemini API fail/throttle. Using local backup rules.', err.message);
    const fallback = getLocalFallbackResult(transcript, userContext);
    return await postProcessResult(fallback, userId, transcript, userContext);
  }
};

/**
 * Resolves a clarification turn when the user responds to a clarification prompt
 */
export const resolveClarification = async (userId, followUpTranscript, timezoneContext = null) => {
  const pending = pendingCommands.get(userId);
  if (!pending) {
    return processVoiceCommand(followUpTranscript, userId, timezoneContext);
  }

  // Clear pendingCommand cache
  pendingCommands.delete(userId);

  const cleanFollowUp = followUpTranscript.toLowerCase();

  // Handle sleep/close clarification
  if (pending.extractedData?.isSleep) {
    const isAffirmative = cleanFollowUp.includes('yes') || cleanFollowUp.includes('yeah') || cleanFollowUp.includes('yep') || cleanFollowUp.includes('sure');
    const isNegative = cleanFollowUp.includes('no') || cleanFollowUp.includes('nah') || cleanFollowUp.includes('nope') || cleanFollowUp.includes('nothing') || cleanFollowUp === 'none';

    if (isNegative) {
       return {
         intent: 'close_intent',
         voiceResponse: "Going to sleep.",
         extractedData: {}
       };
    } else if (isAffirmative) {
       return {
         intent: 'casual_chat',
         voiceResponse: "I'm listening.",
         extractedData: {}
       };
    }
    // If they said something else (e.g. "yes, schedule a meeting"), we just fall through and process it as a new command!
  }

  // Handle proactive alert response
  if (pending.originalIntent === 'proactive_alert_response') {
    const isAffirmative = cleanFollowUp.includes('yes') || cleanFollowUp.includes('yeah') || cleanFollowUp.includes('yep') || cleanFollowUp.includes('sure') || cleanFollowUp.includes('do it') || cleanFollowUp.includes('mark it');
    
    if (isAffirmative) {
      if (pending.proactiveType === 'deadline') {
        return {
          intent: 'complete_task',
          extractedData: { taskId: pending.extractedData.taskId, title: pending.extractedData.title },
          voiceResponse: `Got it. I've marked "${pending.extractedData.title}" as complete.`
        };
      } else if (pending.proactiveType === 'habit') {
        return {
          intent: 'complete_habit',
          extractedData: { habitId: pending.extractedData.habitId, name: pending.extractedData.title },
          voiceResponse: `Awesome. I've checked off your ${pending.extractedData.title} habit.`
        };
      }
    } else {
      return {
        intent: 'casual_chat',
        voiceResponse: "Okay, I'll leave it as pending for now.",
        extractedData: {}
      };
    }
  }

  // Handle destructive/modifying intent confirmation
  const modifyingIntents = ['delete_task', 'edit_task', 'cancel_event', 'reschedule_event', 'delete_habit'];
  if (modifyingIntents.includes(pending.originalIntent)) {
    const isAffirmative = cleanFollowUp.includes('yes') || cleanFollowUp.includes('yeah') || cleanFollowUp.includes('yep') || cleanFollowUp.includes('sure') || cleanFollowUp.includes('do it');
    
    if (isAffirmative) {
      let actionDone = 'modified';
      if (pending.originalIntent.includes('delete') || pending.originalIntent.includes('cancel')) actionDone = 'deleted';
      else if (pending.originalIntent.includes('reschedule')) actionDone = 'rescheduled';
      else if (pending.originalIntent.includes('edit')) actionDone = 'updated';

      return {
        intent: pending.originalIntent,
        confidence: 1.0,
        extractedData: pending.extractedData,
        missingFields: [],
        clarificationQuestion: null,
        voiceResponse: `Got it. I've ${actionDone} that for you.`,
        uiAction: null, // Note: The controller handles emitting socket updates
        navigationTarget: null,
        suggestAlternative: null
      };
    } else if (cleanFollowUp === 'no' || cleanFollowUp === 'nah' || cleanFollowUp.includes('cancel') || cleanFollowUp.includes('nevermind') || cleanFollowUp === 'no thanks') {
      return {
        intent: 'out_of_scope',
        confidence: 1.0,
        extractedData: {},
        missingFields: [],
        clarificationQuestion: null,
        voiceResponse: "Okay, I've left it unchanged.",
        uiAction: null,
        navigationTarget: null,
        suggestAlternative: null
      };
    }
  }

  // Handle task focus slot creation turn (Flow 2)
  if (pending.originalIntent === 'create_task_focus_suggest') {
    const isAffirmative = cleanFollowUp.includes('yes') || 
                          cleanFollowUp.includes('yeah') || 
                          cleanFollowUp.includes('sure') || 
                          cleanFollowUp.includes('ok') || 
                          cleanFollowUp.includes('do it');

    // Always create the task first
    const taskTitle = pending.extractedData?.title || 'Finish investor deck';
    const newTask = new Task({
      userId,
      title: taskTitle,
      urgency: pending.extractedData?.urgency || 9,
      category: pending.extractedData?.category || 'General',
      completed: false,
      dueDate: pending.extractedData?.dueDate || new Date(Date.now() + 86400000)
    });
    await newTask.save();
    
    if (isAffirmative) {
      let durationMinutes = 120; // Default 2 hours
      const numMatch = cleanFollowUp.match(/(\d+)\s*(hour|hr|min)/);
      if (numMatch) {
        const val = parseInt(numMatch[1]);
        if (cleanFollowUp.includes('min')) {
          durationMinutes = val;
        } else {
          durationMinutes = val * 60;
        }
      }
      
      const freeSlots = await getFreeSlotsForDay(userId, new Date());
      let chosenSlot = null;
      for (const slot of freeSlots) {
        if (slot.durationMinutes >= durationMinutes) {
          chosenSlot = slot;
          break;
        }
      }
      
      if (!chosenSlot && freeSlots.length > 0) {
        chosenSlot = freeSlots[0];
      }

      if (chosenSlot) {
        const startTime = chosenSlot.start;
        const finalDuration = Math.min(durationMinutes, chosenSlot.durationMinutes);
        const endTime = new Date(startTime.getTime() + finalDuration * 60000);

        const payload = {
          title: `Focus: ${taskTitle}`,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          type: 'focus',
          notes: `Focus block for task: ${taskTitle}`
        };

        const newEvent = new CalendarEvent({
          userId,
          title: payload.title,
          startTime,
          endTime,
          type: payload.type,
          layer: 'default',
          notes: payload.notes,
          aiGenerated: true
        });
        await newEvent.save();

        const formatTimeAmPm = (d) => {
          let hrs = d.getHours();
          const displayAmPm = hrs >= 12 ? 'pm' : 'am';
          hrs = hrs % 12;
          hrs = hrs ? hrs : 12;
          const mins = d.getMinutes();
          const minsStr = mins === 0 ? '' : `:${mins < 10 ? '0' + mins : mins}`;
          return `${hrs}${minsStr}${displayAmPm}`;
        };

        const startStr = formatTimeAmPm(startTime);
        const endStr = formatTimeAmPm(endTime);
        const hoursText = finalDuration >= 60 ? `${finalDuration / 60}-hour` : `${finalDuration}-minute`;

        // Notify client
        if (io) {
          const room = `user_${userId}`;
          const updatedTasks = await Task.find({ userId }).sort({ aiPriorityRank: 1, urgency: -1 });
          io.to(room).emit('tasks:updated', updatedTasks);
          const allEvents = await CalendarEvent.find({ userId });
          io.to(room).emit('calendar:updated', allEvents);
        }

        return {
          intent: 'schedule_event',
          confidence: 1.0,
          extractedData: payload,
          missingFields: [],
          clarificationQuestion: null,
          voiceResponse: `Your next free ${hoursText} slot is ${startStr} to ${endStr}. Blocking it now.`,
          uiAction: { type: 'schedule_task', payload },
          navigationTarget: 'calendar',
          suggestAlternative: null
        };
      }
    }

    return {
      intent: 'create_task',
      confidence: 1.0,
      extractedData: pending.extractedData,
      missingFields: [],
      clarificationQuestion: null,
      voiceResponse: `Added. I've set '${taskTitle}' as high priority.`,
      uiAction: null,
      navigationTarget: 'tasks',
      suggestAlternative: null
    };
  }

  // If we had a suggested alternative event slot, and user said "yes"/"confirm"/"do it"
  if (pending.originalIntent === 'schedule_event' && pending.alternativeSlot) {
    const isAffirmative = cleanFollowUp.includes('yes') || 
                          cleanFollowUp.includes('yeah') || 
                          cleanFollowUp.includes('sure') || 
                          cleanFollowUp.includes('ok') || 
                          cleanFollowUp.includes('confirm') || 
                          cleanFollowUp.includes('do it') || 
                          cleanFollowUp.includes('book');

    if (isAffirmative) {
      // Reconstruct intent to schedule event at alternative slot
      const startTime = pending.alternativeSlot;
      const duration = parseInt(pending.extractedData?.durationMinutes) || 45;
      const endTime = new Date(startTime.getTime() + duration * 60000);
      
      const payload = {
        title: pending.extractedData?.title || 'Scheduled by Voice',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        type: pending.extractedData?.type || 'ai_block',
        notes: pending.extractedData?.notes || 'Scheduled via ResQ Voice Assistant'
      };

      const formatTimeAmPm = (d) => {
        let hrs = d.getHours();
        const displayAmPm = hrs >= 12 ? 'pm' : 'am';
        hrs = hrs % 12;
        hrs = hrs ? hrs : 12;
        const mins = d.getMinutes();
        const minsStr = mins === 0 ? '' : `:${mins < 10 ? '0' + mins : mins}`;
        return `${hrs}${minsStr}${displayAmPm}`;
      };

      const isTomorrow = new Date(Date.now() + 86400000).toDateString() === startTime.toDateString();
      const dayWord = isTomorrow ? 'tomorrow' : 'on ' + startTime.toLocaleDateString([], { weekday: 'long' });
      const timeStr = formatTimeAmPm(startTime);
      const eventTitle = pending.extractedData?.title || 'Team meeting';

      return {
        intent: 'schedule_event',
        confidence: 1.0,
        extractedData: payload,
        missingFields: [],
        clarificationQuestion: null,
        voiceResponse: `Done. ${eventTitle} is set for ${dayWord} at ${timeStr}.`,
        uiAction: { type: 'schedule_task', payload },
        navigationTarget: 'calendar',
        suggestAlternative: null
      };
    } else if (cleanFollowUp === 'no' || cleanFollowUp === 'nah' || cleanFollowUp.includes('cancel') || cleanFollowUp.includes('nevermind') || cleanFollowUp === 'no thanks') {
      return {
        intent: 'out_of_scope',
        confidence: 1.0,
        extractedData: {},
        missingFields: [],
        clarificationQuestion: null,
        voiceResponse: "No problem. I will not book that slot. What would you like me to do instead?",
        uiAction: null,
        navigationTarget: null,
        suggestAlternative: null
      };
    }
    // Otherwise, fall through to Gemini to interpret if they suggested a new time or a new request entirely.
  }

  // General clarification re-run using the full master prompt context
  const mergedTranscript = `Regarding my previous request "${pending.originalTranscript}", my answer/clarification is: "${followUpTranscript}"`;
  console.log('[voiceIntentService] Falling back to processVoiceCommand with merged transcript:', mergedTranscript);
  return processVoiceCommand(mergedTranscript, userId, timezoneContext);
};

/**
 * Purges the pending voice command clarification cache for a user
 */
export const clearPendingCommands = (userId) => {
  if (pendingCommands.has(userId.toString())) {
    pendingCommands.delete(userId.toString());
    return true;
  } else if (pendingCommands.has(userId)) {
    pendingCommands.delete(userId);
    return true;
  }
  return false;
};

export const setPendingProactiveCommand = (userId, type, payload) => {
  pendingCommands.set(userId.toString(), {
    originalIntent: 'proactive_alert_response',
    extractedData: payload,
    proactiveType: type
  });
};
