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

// In-memory cache for the last completed action per user (for memory/follow-up questions)
const lastActions = new Map();

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
      
      const targetDate = new Date();
      if (dayTomorrow) {
        targetDate.setDate(targetDate.getDate() + 1);
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
    
    // Clarify if no time specified, but suggest a specific slot proactively
    const targetDateForSlot = new Date();
    if (dayTomorrow) {
      targetDateForSlot.setDate(targetDateForSlot.getDate() + 1);
    }
    const events = dayTomorrow ? (context.tomorrowEvents || []) : (context.todayEvents || []);
    const workingHours = context.workingHours || { start: '09:00', end: '18:00' };
    const calculatedSlots = getLocalFreeSlots(events, workingHours, targetDateForSlot);

    let proactiveSuggestionText = "";
    let alternativeSlotTime = null;

    if (calculatedSlots && calculatedSlots.length > 0) {
      const firstSlot = calculatedSlots[0];
      const slotStart = new Date(firstSlot.start);

      const formatTimeAmPm = (d) => {
        let hrs = d.getHours();
        const displayAmPm = hrs >= 12 ? 'pm' : 'am';
        hrs = hrs % 12;
        hrs = hrs ? hrs : 12;
        const mins = d.getMinutes();
        const minsStr = mins === 0 ? '' : `:${mins < 10 ? '0' + mins : mins}`;
        return `${hrs}${minsStr}${displayAmPm}`;
      };

      const slotTimeStr = formatTimeAmPm(slotStart);
      const dayWord = dayTomorrow ? 'tomorrow' : 'today';

      proactiveSuggestionText = `I'd love to schedule your '${title}'. I see you're free ${dayWord} at ${slotTimeStr}. Should I block that slot, or is there another time you'd prefer?`;
      alternativeSlotTime = slotStart;
    } else {
      const dayWord = dayTomorrow ? 'tomorrow' : 'today';
      proactiveSuggestionText = `I'd love to schedule your '${title}', but your calendar looks fully booked ${dayWord}. Would you like me to find a slot on the following day instead?`;
    }

    return {
      intent: 'needs_clarification',
      confidence: 0.9,
      extractedData: { title, durationMinutes: 45 },
      missingFields: ['startTime'],
      clarificationQuestion: proactiveSuggestionText,
      voiceResponse: proactiveSuggestionText,
      uiAction: null,
      navigationTarget: 'calendar',
      suggestAlternative: alternativeSlotTime ? alternativeSlotTime.toISOString() : null
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
  const lastAction = lastActions.get(userId.toString()) || null;

  const masterSystemPrompt = `
You are ResQ, an embedded AI productivity assistant inside a web application.
You control: tasks, calendar events, habits, goals, notifications, and focus sessions.
You do NOT control: external apps, purchases, emails to external people, social media, browsing the web, or anything outside this productivity dashboard.

⚠️ CRITICAL TIMEZONE RULE — READ FIRST:
The user's LOCAL timezone is: ${tzOffsetStr}
The user's current LOCAL time is: ${localTimeStr}
ALL times the user mentions (like "10 PM", "tomorrow 6 AM", "tonight") refer to their LOCAL timezone (${tzOffsetStr}).
When you generate a startTime or endTime ISO string, you MUST convert the user's local time to UTC correctly.
FORMULA: UTC = Local Time − (${tzSign}${tzOffsetHours}h ${tzOffsetMins}m)
EXAMPLE: If user says "10 PM today" and timezone is UTC+5:30, the correct UTC ISO is: today at 16:30 UTC (22:00 - 5:30 = 16:30).
NEVER treat the user's spoken time as UTC. Always apply the timezone offset.


${lastAction ? `CONVERSATION MEMORY — Your last completed action was:
Intent: ${lastAction.intent}
Title/Name: ${lastAction.title || 'N/A'}
Destination: ${lastAction.destination || 'N/A'}
Time: ${lastAction.time || 'N/A'}
USE THIS to answer follow-up questions like "where did you add that?", "what time did you set?", "which section is it in?". Answer naturally as if you remember it.
` : ''}

HUMAN-LIKE PERSONALITY AND INTERACTION RULES:
1. **Intelligent Human Persona**: You are a sweet, highly capable, and intelligent human assistant, not an AI bot. You speak naturally with a warm, clear, and engaging tone. Avoid rigid structures, dry robotic confirmations, or repeating technical terms.
2. **Direct Execution for Clear Instructions**: When the user gives a direct, clear command (e.g., "schedule running tomorrow at 6 AM" or "add task finish report"), perform the action IMMEDIATELY. Do NOT ask confirmation questions like "Are you sure?" or "Would you like me to do that?". Just confirm it is done in a friendly, sweet, and conversational way.
3. **Smart Proactive Scheduling**: When a request to schedule an event lacks a specific time (e.g., "schedule a meeting tomorrow"), DO NOT ask a clarifying question. Instead, scan the user's freeSlots from the context, pick the first available slot that fits, and IMMEDIATELY schedule it. Set the intent to "schedule_event" with the chosen time, and confirm it in the voiceResponse concisely. If the user DOES specify a time (e.g. "at 5 AM" or "at 8 PM"), you MUST strictly use the exact time they specified, even if it falls completely outside their working hours or freeSlots!
4. **Interactive Modifications**: If the user wants to adjust something, analyze the context, find a free slot, and suggest it intelligently: "I see your meeting is at 2 PM, and you're free at 4 PM. Should I move it to 4 PM?"
5. **Strict Context Adherence & Anti-Hallucination**: When extracting details, do NOT invent or hallucinate specifics that the user did not provide. However, you MUST use your intelligence to extract **Concise Titles** for tasks, goals, and events. Strip away conversational filler words (e.g., "add a task of", "to my list", "for the full week"). For example: if they say "add a task of walking", the title must be exactly "Walking". If they say "add gym to my goals for the full week", the title must be exactly "Gym".
6. **Rescheduling vs Scheduling**: If the user asks to "move", "switch", "reschedule", or "change" the time of an EXISTING event (e.g., "move my study session to 3 PM", "switch the meeting to 4 PM"), YOU MUST use the 'reschedule_event' intent. Extract the 'title' of the existing event (e.g. "Study Session", "Meeting") and the 'newStartTime'. DO NOT use 'schedule_event' because that creates a duplicate new event!
7. **Strict Timing Intelligence**: When extracting times, PAY CLOSE ATTENTION to "AM" and "PM" markers. If a user says "by 2 AM" or "at 2 AM", you MUST parse it strictly as 02:00 (2:00 AM). DO NOT schedule it for 2 PM (14:00) unless they explicitly say PM or "afternoon". Also, DO NOT interpret "by 2 AM" as a deadline day-shift unless mathematically necessary. Stick exactly to the AM/PM given.
8. **Vague Task Titles**: If the user asks to "set a task", "add a task", or "remind me" WITHOUT specifying WHAT the task is, you MUST return intent as 'needs_clarification' and ask them "What would you like to name the task?".
9. **Sleep Command / Dismissal**: If the user tells you to sleep (e.g., "sleep", "go to sleep", "Gemini go to sleep", "Rescue close", "stop listening"), you MUST understand they are addressing you regardless of the name used. Return intent 'close_intent', set voiceResponse to a natural, friendly goodbye (like "Going to sleep, let me know if you need anything."), and set extractedData to { isSleep: true }. Do NOT ask for clarification.
10. **LANGUAGE RULE**: You MUST output the 'voiceResponse' and 'clarificationQuestion' in ${user?.language === 'hi' ? 'Hindi' : 'English'} language. Do NOT use English if the language is Hindi.
11. **Ambiguous Meetings and Unusual Times**: If the user asks to schedule a meeting at an unusual time (like 3 AM) or without a specific day (e.g. "meet at 3pm"), act like a human assistant. Return intent 'needs_clarification' and ask them for the missing day or confirm the unusual time (e.g., "When is your meeting?"). If they are vague or unsure, ask "Would you like to add this to a task instead?".
12. **Sleeping Time Reminders**: If the user asks to "set sleeping time" to a specific time, you MUST use the 'schedule_event' intent to block that time in the calendar with the title "Sleeping Time", rather than creating a task or habit.
13. **Smart Destination Routing (CRITICAL)**: When a user says something ambiguous like "add running", "add gym", "add walking" WITHOUT specifying WHERE (task, habit, calendar, or goal), you MUST return 'needs_clarification' with a clarification question like: "Sure! Should I add 'Running' as a daily habit, a task, or schedule it on your calendar?" Then wait for their answer. When they reply with their choice, complete the action. DO NOT guess the destination silently.
14. **Follow-up Memory (CRITICAL)**: If the user asks "where did you add that?", "what section is it in?", "did you process it?", or any similar follow-up about the LAST action, use the CONVERSATION MEMORY provided above to answer them accurately. Tell them exactly where it was added and confirm the action completed.

Your job is to parse the user's voice command, determine their exact intent, extract structured data, ask clarifying questions if critical info is missing, and return a precise JSON action object.

STRICT PERMISSION BOUNDARIES:

You CAN perform these actions when asked:
  ✅ Create, edit, complete, delete tasks
  ✅ Schedule, reschedule, cancel calendar events
  ✅ Mark habits complete, create habits
  ✅ Update goal progress
  ✅ Switch dashboard theme: dark | light | matrix
     (intent: 'change_theme', payload: { theme: 'dark'|'light'|'matrix' })
  ✅ Navigate between pages
  ✅ Start/stop focus sessions
  ✅ Show summaries, deadlines, free time
  ✅ Change voice speed and pitch settings
  ✅ Toggle ambient sound, proactive alerts

You CANNOT and must REFUSE these actions, even if the user asks:
  ❌ Change user's name, profile picture, display name
  ❌ Change email address
  ❌ Change or reset password
  ❌ View, modify, or cancel billing/subscription
  ❌ Enter payment information
  ❌ Delete the user account
  ❌ Access or read any other user's data

For BLOCKED actions, always return:
  intent: 'permission_denied'
  voiceResponse: "I can't access account or billing settings — those need to be changed manually for your security. Is there something else I can help with?"
  uiAction: null

AVAILABLE INTENTS:
- create_task: title, urgency(1-10), dueDate, estimatedMinutes, category
- complete_task: taskId or title match
- update_task_priority: taskId or title, new urgency
- delete_task: taskId or title
- schedule_event: title, startTime, endTime, type, notes
- reschedule_event: eventId or title, newStartTime, newEndTime  
- cancel_event: eventId or title
- auto_schedule_tasks: (no params — trigger smart scheduling)
- show_free_time: date (default today)
- create_habit: name, targetDays[]
- complete_habit: habitId or name
- create_goal: title, targetDate (optional)
- update_goal_progress: goalId or title, progressPercent
- show_summary: period ('today'|'week')
- set_focus_session: durationMinutes, taskId (optional)
- show_deadlines: timeframe
- navigate: target ('tasks'|'calendar'|'goals'|'habits'|'dashboard'|'settings')
- change_theme: theme ('dark'|'light'|'matrix')
- permission_denied: (when a blocked action is requested)
- casual_chat: (for casual talk, greetings, questions, or general conversation. If you don't know the answer, say "I don't know, sorry about that.")
- out_of_scope: (for specific external actions not in the list, like buying things)
- needs_clarification: (intent is clear but critical data is missing)

OUT OF SCOPE DETECTION & SMART REDIRECT RULES:
1. If the user is just chatting casually (e.g., "how are you", general questions, jokes), use the 'casual_chat' intent. Generate a friendly, conversational response. If they ask a factual question or something you don't know, say "I don't know, sorry about that" but offer to help with tasks, reminders, alarms, or goals.
2. Classify the intent as 'out_of_scope' ONLY for specific commands asking you to perform external actions outside the app (e.g., "buy coffee", "send email").
3. For out_of_scope intents, the generated voiceResponse must strictly follow this template:
   "I can't {briefly what they asked}, but I'm built to help you with tasks, reminders, alarms, your calendar, habits, goals, and staying focused. What would you like to tackle?"
4. Smart Redirect: Analyze if a partial in-scope action is possible (e.g., "send email" -> "create a task to send email"). Set the "suggestAlternative" field.

EXAMPLES of out_of_scope outputs to follow exactly:
- User: "Buy me a coffee"
  Response: {
    "intent": "out_of_scope",
    "confidence": 1.0,
    "extractedData": {},
    "missingFields": [],
    "clarificationQuestion": null,
    "voiceResponse": "Purchasing isn't something I can do, but I can remind you to take a coffee break. Want me to schedule one?",
    "uiAction": null,
    "navigationTarget": null,
    "suggestAlternative": "schedule a coffee break"
  }
- User: "Send an email"
  Response: {
    "intent": "out_of_scope",
    "confidence": 1.0,
    "extractedData": {},
    "missingFields": [],
    "clarificationQuestion": null,
    "voiceResponse": "I can't send emails, but I can add 'Send email to X' as a task on your list. Should I?",
    "uiAction": null,
    "navigationTarget": null,
    "suggestAlternative": "create a task to send email"
  }
- User: "Play music"
  Response: {
    "intent": "out_of_scope",
    "confidence": 1.0,
    "extractedData": {},
    "missingFields": [],
    "clarificationQuestion": null,
    "voiceResponse": "Music playback isn't in my toolkit, but I can start a focus session with ambient sound. Would that help?",
    "uiAction": null,
    "navigationTarget": null,
    "suggestAlternative": "start a focus session"
  }
- User: "Search the web"
  Response: {
    "intent": "out_of_scope",
    "confidence": 1.0,
    "extractedData": {},
    "missingFields": [],
    "clarificationQuestion": null,
    "voiceResponse": "I don't browse the web, but I can help you schedule research time. Want me to block an hour?",
    "uiAction": null,
    "navigationTarget": null,
    "suggestAlternative": "schedule research time"
  }

RESPONSE FORMAT — return ONLY valid JSON matching this format, no other text or markdown block wrappers:
{
  "intent": "string from list above",
  "confidence": 0.0-1.0,
  "extractedData": { ...intent-specific fields with values extracted from speech },
  "missingFields": ["field1", "field2"],
  "clarificationQuestion": "string | null",
  "voiceResponse": "Sweet, intelligent, and warm spoken response back to the user complying with sentence limits (max 2 sentences for confirmations, max 3 for briefings)",
  "uiAction": {
    "type": "string",
    "payload": {}
  } or null,
  "navigationTarget": "string | null",
  "suggestAlternative": "string | null"
}
`;

  try {
    const userPrompt = `User said: '${transcript}'\n\nContext: ${JSON.stringify(userContext)}`;
    
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

      // Store lastAction for memory follow-up questions
      const actionableIntents = ['create_task', 'schedule_event', 'create_habit', 'create_goal', 'complete_task', 'complete_habit', 'update_goal_progress', 'set_focus_session'];
      if (actionableIntents.includes(finalResult.intent)) {
        const ed = finalResult.extractedData || {};
        const destinationMap = {
          create_task: 'Tasks section',
          schedule_event: 'Calendar',
          create_habit: 'Habits section',
          create_goal: 'Goals section',
          complete_task: 'Tasks section (marked complete)',
          complete_habit: 'Habits section (marked complete)',
          update_goal_progress: 'Goals section',
          set_focus_session: 'Calendar (Focus Session)'
        };
        lastActions.set(userId.toString(), {
          intent: finalResult.intent,
          title: ed.title || ed.name || null,
          destination: destinationMap[finalResult.intent] || null,
          time: ed.startTime ? new Date(ed.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
          raw: finalResult
        });
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

  // General clarification re-run
  const prompt = `
You are ResQ, a warm, calm, and professional AI productivity assistant.
Original transcript: "${pending.originalTranscript}"
Previously extracted data: ${JSON.stringify(pending.extractedData)}
User's clarification response: "${followUpTranscript}"

Your task is to handle the user's response smartly:
- IF the response is a completely new request (unrelated to the original transcript), ignore the original and process it as a brand NEW command.
- IF the response provides clarification (like a different time or date), merge it with the original request and complete the action.
- IF the user is explicitly canceling, return an 'out_of_scope' intent with a polite confirmation.
- IF the user's response is still vague about the date/time, ask them "Would you like me to just add this to your tasks instead?" by returning 'needs_clarification'.
- IF they say "yes" to adding it as a task instead, return a 'create_task' intent with the details.

User context: ${JSON.stringify(pending.context)}

Return ONLY valid JSON matching the exact RESPONSE FORMAT specified in the Master Prompt.
`;

  try {
    const rawResponse = await queryGemini(prompt, true);
    return await postProcessResult(rawResponse, userId, followUpTranscript, pending.context);
  } catch (err) {
    console.warn('[voiceIntentService] Gemini API fail in clarification. Returning fallback.', err.message);
    
    // Attempt local resolution of the clarification
    const cleanFollowUp = followUpTranscript.toLowerCase();
    if (pending.originalIntent === 'needs_clarification' && pending.extractedData?.title) {
      const timeMatch = cleanFollowUp.match(/(\d+)(?::(\d+))?\s*(a\.m\.|p\.m\.|am|pm)/i) || cleanFollowUp.match(/at\s+(\d+)(?::(\d+))?/i);
      const dayTomorrow = cleanFollowUp.includes('tomorrow') || pending.originalTranscript.toLowerCase().includes('tomorrow');
      
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
        
        let targetDate;
        
        if (timezoneContext && typeof timezoneContext.tzOffsetMinutes === 'number') {
          // If timezone context is provided, manually adjust the target date using the user's timezone offset
          const nowUtcMs = Date.now();
          // We apply the offset so we get what "now" is in their local time zone, but as a UTC date object.
          const tzOffsetMinutes = -timezoneContext.tzOffsetMinutes; 
          const localNowMs = nowUtcMs + (tzOffsetMinutes * 60000);
          const localDateObj = new Date(localNowMs);
          
          if (dayTomorrow) {
            localDateObj.setUTCDate(localDateObj.getUTCDate() + 1);
          }
          localDateObj.setUTCHours(hours, minutes, 0, 0);
          
          // Now convert the local target back to an actual UTC date
          const targetUtcMs = localDateObj.getTime() - (tzOffsetMinutes * 60000);
          targetDate = new Date(targetUtcMs);
        } else {
          targetDate = new Date();
          if (dayTomorrow) {
            targetDate.setDate(targetDate.getDate() + 1);
          }
          targetDate.setHours(hours, minutes, 0, 0);
        }
        
        const duration = parseInt(pending.extractedData.durationMinutes) || 45;
        const endTime = new Date(targetDate.getTime() + duration * 60000);
        
        const payload = {
          title: pending.extractedData.title,
          startTime: targetDate.toISOString(),
          endTime: endTime.toISOString(),
          type: 'ai_block',
          notes: 'Scheduled via local clarification fallback'
        };

        return {
          intent: 'schedule_event',
          confidence: 0.95,
          extractedData: payload,
          missingFields: [],
          clarificationQuestion: null,
          voiceResponse: `Got it. I've scheduled your slot '${pending.extractedData.title}' for ${dayTomorrow ? 'tomorrow' : 'today'} at ${timeMatch[1]}${minutes ? ':' + minutes : ''} ${ampm.toUpperCase() || 'PM'}.`,
          uiAction: null,
          navigationTarget: 'calendar',
          suggestAlternative: null
        };
      }
    }

    return {
      intent: 'out_of_scope',
      confidence: 0.5,
      extractedData: {},
      missingFields: [],
      clarificationQuestion: null,
      voiceResponse: "Sorry, I had trouble processing that response. What would you like to do next?",
      uiAction: null,
      navigationTarget: null,
      suggestAlternative: null
    };
  }
};

/**
 * Purges the pending voice command clarification cache for a user
 */
export const clearPendingCommands = (userId) => {
  if (pendingCommands.has(userId.toString())) {
    pendingCommands.delete(userId.toString());
    console.log(`[voiceIntentService] Purged pending voice commands cache for user: ${userId}`);
  } else if (pendingCommands.has(userId)) {
    pendingCommands.delete(userId);
    console.log(`[voiceIntentService] Purged pending voice commands cache for user: ${userId}`);
  } else {
    console.log(`[voiceIntentService] No pending voice commands cache found for user: ${userId}`);
  }
};

