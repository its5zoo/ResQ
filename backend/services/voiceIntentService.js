import Task from '../models/Task.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Habit from '../models/Habit.js';
import Goal from '../models/Goal.js';
import User from '../models/User.js';
import { queryGemini } from './geminiService.js';

// In-memory cache for pending clarifications keyed by userId
const pendingCommands = new Map();

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
        const ampm = hrs >= 12 ? 'am' : 'am'; // User requested lower case am/pm without space
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
      originalIntent: resultObj.intent
    });
    if (resultObj.clarificationQuestion) {
      resultObj.voiceResponse = resultObj.clarificationQuestion;
    }
  }

  return resultObj;
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
  if (
    clean.includes('schedule') || 
    clean.includes('meeting') || 
    clean.includes('event') || 
    clean.includes('calendar') || 
    clean.includes('book') || 
    clean.includes('study') || 
    clean.includes('timetable')
  ) {
    // Try to extract time (e.g. 6:00 p.m. or 6 pm or at 6)
    const timeMatch = clean.match(/(\d+)(?::(\d+))?\s*(a\.m\.|p\.m\.|am|pm)/i) || clean.match(/at\s+(\d+)(?::(\d+))?/i);
    const dayTomorrow = clean.includes('tomorrow');
    
    // Title extraction helper
    let title = 'Study Session';
    if (clean.includes('meeting')) title = 'Meeting';
    else if (clean.includes('event')) title = 'Calendar Event';
    
    const titleMatch = clean.match(/(?:schedule|book|create)\s+(?:a\s+)?([^0-9]+?)(?:\s+at|\s+for|\s+tomorrow|\s+today|$)/);
    if (titleMatch && titleMatch[1]) {
      const matchWord = titleMatch[1].trim();
      if (!['study', 'timetable', 'meeting', 'event', 'calendar', 'slot'].includes(matchWord)) {
        title = matchWord;
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
    
    // Clarify if no time specified
    return {
      intent: 'needs_clarification',
      confidence: 0.9,
      extractedData: { title, durationMinutes: 45 },
      missingFields: ['startTime'],
      clarificationQuestion: `I'd love to schedule your '${title}'. Do you have a particular time in mind?`,
      voiceResponse: `I'd love to schedule your '${title}'. Do you have a particular time in mind?`,
      uiAction: null,
      navigationTarget: 'calendar',
      suggestAlternative: null
    };
  }

  // 5. Tasks creation fallback
  if (clean.includes('task') || clean.includes('todo') || clean.includes('add') || clean.includes('create')) {
    // Extract task title
    let taskTitle = 'New Task';
    const taskMatch = clean.match(/(?:add|create|task|todo)\s+(?:called|to\s+)?([^]+)$/i);
    if (taskMatch && taskMatch[1]) {
      taskTitle = taskMatch[1].replace(/called\s+/, '').trim();
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
  if (clean.includes('today') || clean.includes('summarize') || clean.includes('summary') || clean.includes('briefing')) {
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
export const processVoiceCommand = async (transcript, userId) => {
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

  const userContext = {
    name: userName,
    workingHours: user?.workingHours || { start: '09:00', end: '18:00' },
    tasks,
    todayEvents,
    tomorrowEvents,
    habits,
    goals,
    freeSlots,
    currentTime: new Date().toISOString()
  };

  const masterSystemPrompt = `
You are ResQ, an embedded AI productivity assistant inside a web application.
You control: tasks, calendar events, habits, goals, notifications, and focus sessions.
You do NOT control: external apps, purchases, emails to external people, social media, browsing the web, or anything outside this productivity dashboard.

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
- update_goal_progress: goalId or title, progressPercent
- show_summary: period ('today'|'week')
- set_focus_session: durationMinutes, taskId (optional)
- show_deadlines: timeframe
- navigate: target ('tasks'|'calendar'|'goals'|'habits'|'dashboard'|'settings')
- change_theme: theme ('dark'|'light'|'matrix')
- permission_denied: (when a blocked action is requested)
- out_of_scope: (anything not in above list)
- needs_clarification: (intent is clear but critical data is missing)

OUT OF SCOPE DETECTION & SMART REDIRECT RULES:
1. Classify the intent as 'out_of_scope' for any user request that falls outside the defined list of controls.
2. For out_of_scope intents, the generated voiceResponse must strictly follow this template:
   "I can't {briefly what they asked}, but I'm built to help you with tasks, your calendar, habits, goals, and staying focused. What would you like to tackle?"
3. Smart Redirect: Analyze if a partial in-scope action is possible (e.g., "send email" can be partially fulfilled by creating a task like "create a task to send email"). If so, set the "suggestAlternative" field to a specific actionable offer the user can confirm, and tailor the voiceResponse accordingly to suggest it.

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
  "voiceResponse": "Warm, friendly spoken response back to user complying with sentence limits (max 2 sentences for confirmations, max 3 for briefings)",
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
    const prompt = `${masterSystemPrompt}\n\n${userPrompt}`;

    const rawResponse = await queryGemini(prompt, true);
    return await postProcessResult(rawResponse, userId, transcript, userContext);
  } catch (err) {
    console.warn('[voiceIntentService] Gemini API fail/throttle. Using local backup rules.', err.message);
    const fallback = getLocalFallbackResult(transcript, userContext);
    return await postProcessResult(fallback, userId, transcript, userContext);
  }
};

/**
 * Resolves a clarification turn when the user responds to a clarification prompt
 */
export const resolveClarification = async (userId, followUpTranscript) => {
  const pending = pendingCommands.get(userId);
  if (!pending) {
    return processVoiceCommand(followUpTranscript, userId);
  }

  // Clear pendingCommand cache
  pendingCommands.delete(userId);

  const cleanFollowUp = followUpTranscript.toLowerCase();

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
    } else {
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
  }

  // General clarification re-run
  const prompt = `
You are ResQ, a warm, calm, and professional AI productivity assistant.
Original transcript: "${pending.originalTranscript}"
Previously extracted data: ${JSON.stringify(pending.extractedData)}
User's clarification response: "${followUpTranscript}"

Your task is to merge the user's clarification into the original request and complete the action.
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
        
        const targetDate = new Date();
        if (dayTomorrow) {
          targetDate.setDate(targetDate.getDate() + 1);
        }
        targetDate.setHours(hours, minutes, 0, 0);
        
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

