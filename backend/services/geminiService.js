import { getResQModel } from '../config/gemini.js';

// Global throttle tracking to enforce 500ms delay between consecutive calls
let lastCallTime = 0;
const enforceRateLimit = async () => {
  const now = Date.now();
  const timeSinceLastCall = now - lastCallTime;
  if (timeSinceLastCall < 500) {
    const delay = 500 - timeSinceLastCall;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastCallTime = Date.now();
};

/**
 * Strips markdown code-block tags (like ```json ... ```) from strings to ensure clean JSON parsing.
 */
const cleanMarkdownJson = (text) => {
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.substring(7);
  } else if (cleanText.startsWith('```')) {
    cleanText = cleanText.substring(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.slice(0, -3);
  }
  return cleanText.trim();
};

/**
 * Core query helper wrapper for Gemini generateContent with developer token logs and retry fallback.
 */
export const queryGemini = async (prompt, isJson = false) => {
  await enforceRateLimit();

  try {
    const model = getResQModel();

    let contentsPayload;
    if (Array.isArray(prompt)) {
      contentsPayload = prompt;
    } else {
      contentsPayload = [{ role: 'user', parts: [{ text: prompt }] }];
    }

    const result = await model.generateContent(isJson ? {
      contents: contentsPayload,
      generationConfig: { responseMimeType: "application/json" }
    } : { contents: contentsPayload });
    
    // Log token usage in development
    if (process.env.NODE_ENV !== 'production' && result.response.usageMetadata) {
      console.log(`[Gemini Token Log] Usage:`, result.response.usageMetadata);
    }

    const text = result.response.text().trim();
    if (isJson) {
      return JSON.parse(cleanMarkdownJson(text));
    }
    return text;

  } catch (firstError) {
    console.warn(`[Gemini SDK] First attempt failed (${firstError.message}). Retrying once...`);
    
    await enforceRateLimit();

    try {
      const model = getResQModel();

      const retryPrompt = isJson
        ? (Array.isArray(prompt) 
            ? [...prompt, { role: 'user', parts: [{ text: 'Return ONLY valid JSON. Absolutely no conversational text, explanations, or code-block formatting wrappers.' }] }]
            : `${prompt}\n\nReturn ONLY valid JSON. Absolutely no conversational text, explanations, or code-block formatting wrappers.`)
        : prompt;

      let retryContentsPayload;
      if (Array.isArray(retryPrompt)) {
        retryContentsPayload = retryPrompt;
      } else {
        retryContentsPayload = [{ role: 'user', parts: [{ text: retryPrompt }] }];
      }

      const result = await model.generateContent(isJson ? {
        contents: retryContentsPayload,
        generationConfig: { responseMimeType: "application/json" }
      } : { contents: retryContentsPayload });
      const text = result.response.text().trim();
      
      if (isJson) {
        return JSON.parse(cleanMarkdownJson(text));
      }
      return text;
    } catch (retryError) {
      console.error('[Gemini SDK] Second attempt retry failed:', retryError);
      throw retryError;
    }
  }
};

/**
 * 1. Generates a concise daily summary briefing (3 sentences, plain text, no markdown).
 */
export const generateDailySummary = async (user, tasks = [], calendarEvents = [], habits = [], goals = []) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
      return getMockDailySummary(user, tasks, habits);
    }

    const taskList = tasks.map(t => `- ${t.title} (urgency: ${t.urgency}/10, completed: ${t.completed}, due: ${t.dueDate || 'none'})`).join('\n');
    const eventList = calendarEvents.map(e => `- ${e.title} at ${e.timeSlot} on ${e.day} (${e.duration}m)`).join('\n');
    const habitList = habits.map(h => `- ${h.name} (streak: ${h.streak}d, done today: ${h.completions?.some(c => new Date(c.date).setHours(0,0,0,0) === new Date().setHours(0,0,0,0) && c.completed)})`).join('\n');
    const goalList = goals.map(g => `- ${g.title} (progress: ${g.progress}%)`).join('\n');

    const prompt = `
You are ResQ, a smart, proactive AI productivity advisor. The user's name is ${user.name || 'User'}.

DATA FOR TODAY:
Tasks:
${taskList || 'None pending'}

Calendar Events:
${eventList || 'None scheduled'}

Habits:
${habitList || 'None set'}

Long-term Goals:
${goalList || 'None set'}

INSTRUCTIONS:
Analyze the data above and write a very brief, punchy daily briefing (maximum 2-3 short sentences).
CRITICAL RULE: If you see ANY tasks, events, habits, or goals related to "meeting", "exam", or "recharge" (like phone/bill recharge), you MUST explicitly call them out as top priority today across all modules.
1. Look closely at the data. If a deadline (dueDate) or event is near, start by alerting them upfront!
2. If there's an incomplete urgent task or missing daily habit today, remind them.
3. Do NOT talk about Goals if they have pressing tasks or deadlines today. Focus on the immediate priority.
4. HOWEVER, if there are NO pending tasks or deadlines today, but they do have Goals set, casually ask "How are your goals going?" or mention a specific goal to show you are paying attention.
5. CRITICAL LANGUAGE RULE: You MUST write the entire summary in ${user.language === 'hi' ? 'Hindi' : 'English'} language. Do NOT use English if the language is Hindi.
6. Return plain text only. No markdown formatting, no bullet points, no bolding.
`;

    return await queryGemini(prompt, false);
  } catch (err) {
    console.error('Error generating daily summary:', err);
    return getMockDailySummary(user, tasks, habits);
  }
};

/**
 * 2. Re-ranks tasks by urgency and importance, returning prioritize array.
 */
export const generateTaskPriority = async (tasks = []) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
      return getMockTaskPriority(tasks);
    }

    const prompt = `
Analyze these tasks and re-rank them by urgency+importance matrix.
CRITICAL RULE 1: Tasks containing keywords like "meeting", "exam", or "recharge" are highly critical to the user. Always rank them at the very top (highest priority).
CRITICAL RULE 2: The "reason" field MUST be written in very simple, easy-to-understand, friendly, and conversational English. DO NOT use complex words, jargon, or formal terms like "Quadrant I", "sustenance", or "necessity". Explain it like you're a helpful friend (e.g., "This is super important so you don't go hungry!" or "Knock this out first since the deadline is today!").

Tasks (JSON format):
${JSON.stringify(tasks, null, 2)}

Return ONLY a JSON array of task IDs in priority order with a short reason field for each. Absolutely no extra conversational text or wrappers.
JSON Output Format:
[
  { "id": "task_id_here", "reason": "Simple, friendly reason here" }
]
`;

    return await queryGemini(prompt, true);
  } catch (err) {
    console.error('Error generating task priority:', err);
    return getMockTaskPriority(tasks);
  }
};

/**
 * 3. Auto-schedules pending tasks into open slots, avoiding conflicts.
 */
export const generateAutoSchedule = async (tasks = [], existingEvents = [], workingHours = { start: '09:00 AM', end: '05:00 PM' }) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
      return getMockAutoSchedule(tasks, existingEvents);
    }

    const prompt = `
You are a smart calendar scheduler. 
Working hours: ${workingHours.start} to ${workingHours.end}.
Existing scheduled events (JSON):
${JSON.stringify(existingEvents, null, 2)}

Unscheduled tasks with estimated durations (JSON):
${JSON.stringify(tasks.filter(t => !t.completed), null, 2)}

Schedule each task into the best available slot on the calendar (choose days like Mon, Tue, etc., and slots like 10:00 AM), avoiding conflicts with existing events.
Return ONLY a JSON array. Absolutely no extra conversational text.
JSON Output Format:
[
  {
    "taskId": "task_id",
    "title": "AI Focus block: task_title",
    "day": "Mon",
    "timeSlot": "09:00 AM",
    "duration": 45,
    "type": "ai_block"
  }
]
`;

    return await queryGemini(prompt, true);
  } catch (err) {
    console.error('Error auto scheduling tasks:', err);
    return getMockAutoSchedule(tasks, existingEvents);
  }
};

/**
 * 4. Generates an encouraging insight and improvement tip for a habit.
 */
export const generateHabitInsight = async (habit, completionHistory = []) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
      return getMockHabitInsight(habit);
    }

    const prompt = `
Analyze this habit: "${habit.name || habit.title || 'Unknown Habit'}".
Completion history last 30 days:
${JSON.stringify(completionHistory, null, 2)}

Current streak: ${habit.streak || 0} days.

Give one encouraging insight based on their history and one specific, actionable improvement tip directly related to the habit topic to ensure they do not miss their goal. The tip MUST be tailored to the actual habit (e.g. if the habit is "React Native", mention coding or mobile dev; if it's "score 90%", mention studying or practice). Do not give generic tips.
Return ONLY JSON:
{
  "insight": "Your encouraging insight text here",
  "tip": "Your improvement tip text here"
}
`;

    return await queryGemini(prompt, true);
  } catch (err) {
    console.error('Error generating habit insight:', err);
    return getMockHabitInsight(habit);
  }
};

/**
 * 5. Breaks down a target goal into 4-6 weekly milestones.
 */
export const generateGoalBreakdown = async (goal, userPreferences = '') => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
      return getMockGoalBreakdown(goal);
    }

    const prompt = `
Break down this goal into 4-6 weekly milestones with estimated effort.
Use very simple, everyday language that anyone can easily understand. Do not use technical jargon, complicated diet/fitness terms, or confusing acronyms. Keep it extremely easy to read.
Goal: ${goal.title}
Target Date: ${goal.targetDate || 'Flexible'}
Current Progress: ${goal.progress || 0}%
${userPreferences ? `User Specific Preferences & Focus Areas: "${userPreferences}"` : ''}

Return ONLY JSON. No explanations.
JSON Output Format:
[
  { "week": 1, "milestone": "Milestone details here", "effort": "low" }
]
Effort values must be exactly: "low" | "medium" | "high".
`;

    return await queryGemini(prompt, true);
  } catch (err) {
    console.error('Error generating goal breakdown:', err);
    return getMockGoalBreakdown(goal);
  }
};

/**
 * 5.5. Cleans up manual milestones into simple professional English.
 */
export const cleanManualMilestones = async (manualMilestones, goalTitle) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
      return manualMilestones.map(m => ({ week: m.week, milestone: m.text, effort: m.effort }));
    }

    const prompt = `
I have a goal titled "${goalTitle}".
The user provided the following raw milestone inputs for each week:
${JSON.stringify(manualMilestones, null, 2)}

Clean up the "text" field of each milestone to be in clear, simple, and professional English.
Make it easy to understand. Keep the "week" and "effort" exactly the same.
CRITICAL: If the "text" field for any week is empty or blank, DO NOT leave it blank! Smartly generate a logical milestone for that week based on the overall goal title and the previous weeks' progress (e.g., generate a "Revision", "Practice", or "Review" week).
Return ONLY JSON. No explanations.

JSON Output Format:
[
  { "week": 1, "milestone": "Cleaned up or smartly generated milestone details here", "effort": "medium" }
]
`;

    return await queryGemini(prompt, true);
  } catch (err) {
    console.error('Error cleaning manual milestones:', err);
    return manualMilestones.map(m => ({ week: m.week, milestone: m.text, effort: m.effort }));
  }
};

/**
 * 6. Handles vocal queries in userContext and outputs response text + actions.
 */
export const handleVoiceCommand = async (transcript, userContext = {}) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
      return getMockVoiceResponse(transcript, userContext);
    }

    const prompt = `
You are ResQ, a warm, calm, and professional AI productivity assistant.
User spoke: "${transcript}"
User's current dashboard context (JSON):
${JSON.stringify(userContext, null, 2)}

Determine user intent from this set:
[summarize_day, schedule_task, show_deadlines, add_task, complete_task, show_habits, motivate, general_query, change_theme, start_focus, stop_focus, complete_habit, navigate_tab]

Personality and Voice Response Rules (strictly enforce in the "response" field):
1. **Tone**: Calm, warm, friendly, and professional (like a brilliant personal assistant). Never robotic or stiff.
2. **Light Affirmations**: Integrate natural light affirmations like "Of course", "Absolutely", "Got it", "Sure thing".
3. **Address User**: Address the user by their first name when available in userContext (e.g. from context.user.name or user.name).
4. **Natural Pauses**: Use natural pauses via commas so the Speech Synthesis engine speaks naturally.
5. **Length Constraints**: 
   - Maximum 2 sentences when confirming actions.
   - Maximum 3 sentences for information summaries or briefings.
6. **AI Identity**: Never say "I am an AI", "As a language model", or similar robotic disclaimers.
7. **Declining Requests**: If user asks for something outside of tasks, calendar, habits, goals, or focus session coaching, politely decline and redirect to what you CAN do for them (help with tasks, calendar, habits, goals, focus).

Guidelines:
1. **Theme Controls**: If the user wants to switch themes (light, dark, matrix), set intent to "change_theme", action to { "type": "change_theme", "payload": { "theme": "light" or "dark" or "matrix" } }, navigationTarget to null.
2. **Focus Sessions**: If they want to start a focus session, set intent to "start_focus", action to { "type": "start_focus", "payload": { "task": "task description", "duration": minutes (number) } }. Default duration to 25 if unspecified. Set navigationTarget to "dashboard".
3. **Stop Focus**: If they want to pause, stop, or exit focus session, set intent to "stop_focus", action to { "type": "stop_focus", "payload": {} }, navigationTarget to null.
4. **Complete Habit**: If they want to complete/check-off a habit, look at the habits in the userContext, find the matching habit, and set intent to "complete_habit", action to { "type": "complete_habit", "payload": { "habitId": "matching_habit_id", "name": "matching_habit_name" } }.
5. **Dashboard Navigation**: If they say "go to/show/open [tab name]", set intent to "navigate_tab", action to null, and navigationTarget to the exact tab from: ["dashboard", "tasks", "calendar", "goals", "habits", "voice", "notifications", "settings"].
6. **Task Scheduling**: If they request scheduling, identify the title, startTime/day/timeSlot, duration, and type ("ai_block", "user_block", "deadline"). Set intent to "schedule_task", action to { "type": "schedule_task", "payload": { "title": "...", "startTime": "...", "day": "...", "timeSlot": "...", "duration": number, "type": "..." } }.
7. **Task Completion**: If completing a task, look for the task in the context and set intent to "complete_task", action to { "type": "complete_task", "payload": { "taskId": "...", "title": "..." } }.

If they want to study or schedule study, ask them if they have a specific time in mind to study (e.g. "Do you have a particular time in mind to study? If you choose a specific time, I will fix it on your calendar. Otherwise, we can keep the time flexible and only fix the day.").

Return ONLY valid JSON. No conversational wrappers, no markdown block wrappers.
JSON Output Format:
{
  "intent": "intent_type_here",
  "response": "Warm, friendly spoken response complying with the personality and sentence limit rules",
  "action": { "type": "action_type", "payload": {} } or null,
  "navigationTarget": "tab_name" or null
}
`;

    return await queryGemini(prompt, true);
  } catch (err) {
    console.error('Error handling voice command:', err);
    return getMockVoiceResponse(transcript, userContext);
  }
};

/**
 * 7. Generates a personalized notification message.
 */
export const generateNotificationMessage = async (type, data = {}) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
      return getMockNotification(type, data);
    }

    const prompt = `
You are ResQ, an AI productivity assistant. 
Write a short, highly personalized push notification message for type: "${type}" with context data:
${JSON.stringify(data, null, 2)}

Keep it brief and punchy (under 15 words). Return only the message text.
`;

    return await queryGemini(prompt, false);
  } catch (err) {
    console.error('Error generating notification message:', err);
    return getMockNotification(type, data);
  }
};


/**
 * 8. Generates a unified global priority list across tasks, events, habits, and goals.
 */
export const generateGlobalPriority = async (user, tasks = [], events = [], habits = [], goals = []) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
      return getMockGlobalPriority(tasks, events, habits, goals);
    }

    const prompt = `
You are ResQ's core Priority Engine. Your job is to analyze all of the user's pending items across all modules and determine the TOP 4 most important things the user needs to focus on right now.

Here is the data for today:
Pending Tasks: ${JSON.stringify(tasks, null, 2)}
Today's Calendar Events: ${JSON.stringify(events, null, 2)}
Incomplete Daily Habits: ${JSON.stringify(habits, null, 2)}
Active Goals: ${JSON.stringify(goals, null, 2)}

Instructions:
1. Compare all items across these 4 categories.
2. Select exactly the top 4 highest priority items overall.
3. For each selected item, assign a 'priorityScore' from 1 to 100 (100 being most critical).
4. Provide a very short, specific 'reason' explaining exactly WHY this item is prioritized. The reason MUST be in simple, friendly, easy-to-understand conversational language (e.g., "You have a deadline in 2 hours!", "Let's knock out this meeting!", "You need to keep your streak going!"). Do NOT use robotic jargon or complex words.
5. The 'type' field must be one of: "task", "event", "habit", "goal".
6. CRITICAL LANGUAGE RULE: You MUST write the 'reason' in ${user?.language === 'hi' ? 'Hindi' : 'English'} language. Do NOT use English if the language is Hindi.
7. Return ONLY a JSON array. No explanations, no markdown block formatting.

JSON Output Format:
[
  {
    "id": "item_id_here",
    "type": "task",
    "title": "Item title or name",
    "priorityScore": 95,
    "reason": "Deadline is approaching fast"
  }
]
`;

    return await queryGemini(prompt, true);
  } catch (err) {
    console.error('Error generating global priority:', err);
    return getMockGlobalPriority(tasks, events, habits, goals);
  }
};

// ==========================================
// LOCAL MOCK FALLBACKS (For Robust Recovery)
// ==========================================

const getMockDailySummary = (user, tasks, habits) => {
  const name = user.name || 'User';
  const pendingTasks = tasks.filter(t => !t.completed).length;
  return `Good morning, ${name}! You have ${pendingTasks} pending tasks today. Focus on your top priority task first.`;
};

const getMockTaskPriority = (tasks) => {
  return tasks
    .sort((a, b) => (b.urgency || 5) - (a.urgency || 5))
    .map(t => ({
      id: t._id || t.id,
      reason: `Ranked first due to urgency score of ${t.urgency || 5}/10.`
    }));
};

const getMockAutoSchedule = (tasks, existingEvents) => {
  const pending = tasks.filter(t => !t.completed);
  const scheduled = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const slots = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM'];

  pending.forEach((task, idx) => {
    const day = days[idx % days.length];
    const timeSlot = slots[idx % slots.length];
    scheduled.push({
      taskId: task._id || task.id,
      title: `AI Focus block: ${task.title}`,
      day,
      timeSlot,
      duration: task.duration || 45,
      type: 'ai_block'
    });
  });
  return scheduled;
};

const getMockHabitInsight = (habit) => {
  return {
    insight: `You have successfully completed ${habit.name || habit.title || 'this habit'} streaks in the last week!`,
    tip: "Try scheduling this habit at the exact same hour every day to build stronger muscle memory."
  };
};

const getMockGoalBreakdown = (goal) => {
  return [
    { week: 1, milestone: `Deconstruct requirements and outline core files for ${goal.title}`, effort: "medium" },
    { week: 2, milestone: `Integrate styling modules and layouts for ${goal.title}`, effort: "high" },
    { week: 3, milestone: `Connect API logic and database schema mappings for ${goal.title}`, effort: "medium" },
    { week: 4, milestone: `Run deployment audits and final check validation audits for ${goal.title}`, effort: "low" }
  ];
};

const getMockVoiceResponse = (transcript, userContext = {}) => {
  const command = transcript.toLowerCase();
  
  // Extract user's first name if available
  const fullName = userContext.user?.name || userContext.name || '';
  const firstName = fullName ? fullName.split(' ')[0] : '';
  const greeting = firstName ? `Of course, ${firstName}. ` : 'Sure thing. ';

  if (command.includes('study') || command.includes('timetable') || command.includes('schedule study')) {
    return {
      intent: 'schedule_study',
      response: "I'd love to schedule a study block for you, do you have a particular time in mind? Otherwise, we can keep the time flexible and only fix the day.",
      action: null,
      navigationTarget: 'calendar'
    };
  } else if (command.includes('today') || command.includes('summarize')) {
    return {
      intent: 'summarize_day',
      response: `${greeting}Here is your plan for today: You have a team sync scheduled for 10:00 AM, and a React Focus block at 04:00 PM.`,
      action: null,
      navigationTarget: 'calendar'
    };
  } else if (command.includes('deadline')) {
    return {
      intent: 'show_deadlines',
      response: `${greeting}Your project deadline is at 06:00 PM today. Let's work smart, and avoid distractions.`,
      action: null,
      navigationTarget: 'tasks'
    };
  } else if (command.includes('theme') || command.includes('light mode') || command.includes('matrix') || command.includes('dark mode')) {
    let selectedTheme = 'dark';
    if (command.includes('light')) selectedTheme = 'light';
    else if (command.includes('matrix')) selectedTheme = 'matrix';
    return {
      intent: 'change_theme',
      response: `${greeting}Switching your workspace theme to ${selectedTheme}.`,
      action: { type: 'change_theme', payload: { theme: selectedTheme } },
      navigationTarget: null
    };
  } else if (command.includes('focus') && (command.includes('start') || command.includes('begin') || command.includes('guide'))) {
    // Detect focus task name and duration
    let duration = 25;
    const durMatch = command.match(/(\d+)\s*min/);
    if (durMatch) duration = parseInt(durMatch[1]);
    
    return {
      intent: 'start_focus',
      response: `${greeting}Engaging Focus Mode for ${duration} minutes. Stay locked in.`,
      action: { type: 'start_focus', payload: { task: 'Deep Work Session', duration } },
      navigationTarget: 'dashboard'
    };
  } else if (command.includes('focus') && (command.includes('stop') || command.includes('exit') || command.includes('end') || command.includes('pause'))) {
    return {
      intent: 'stop_focus',
      response: "Got it. Exiting Focus Mode, and restoring your dashboard.",
      action: { type: 'stop_focus', payload: {} },
      navigationTarget: null
    };
  } else if (command.includes('habit') && (command.includes('gym') || command.includes('workout') || command.includes('check') || command.includes('complete'))) {
    return {
      intent: 'complete_habit',
      response: `${greeting}I've checked off your daily habit. Great consistency!`,
      action: { type: 'complete_habit', payload: { name: 'Gym Workout Routine' } },
      navigationTarget: 'habits'
    };
  } else if (command.includes('go to') || command.includes('open') || command.includes('show')) {
    let target = 'dashboard';
    if (command.includes('task')) target = 'tasks';
    else if (command.includes('calendar')) target = 'calendar';
    else if (command.includes('goal')) target = 'goals';
    else if (command.includes('habit')) target = 'habits';
    else if (command.includes('setting')) target = 'settings';
    else if (command.includes('notification')) target = 'notifications';
    else if (command.includes('voice')) target = 'voice';
    
    return {
      intent: 'navigate_tab',
      response: `${greeting}Navigating you to the ${target} tab.`,
      action: null,
      navigationTarget: target
    };
  } else {
    return {
      intent: 'out_of_scope',
      response: "That's outside what I can do for you here. I can help with tasks, your calendar, habits, goals, and focus sessions. What would you like?",
      action: null,
      navigationTarget: null
    };
  }
};

const getMockNotification = (type, data) => {
  if (type === 'deadline_warning') {
    return `Warning: Milestone "${data.title || 'Project'}" is due soon. No schedule buffer remaining!`;
  } else if (type === 'habit_miss') {
    return `Don't lose your streak! Remember to check in for "${data.title || 'Habit'}" today.`;
  } else if (type === 'goal_behind') {
    return `Goal "${data.title || 'Goal'}" is pacing behind. Let's schedule a focus session.`;
  }
  return "ResQ Focus alert: Safeguard your calendar for deep work block.";
};

/**
 * 2.5 Infers task urgency automatically if left blank.
 */
export const inferTaskUrgency = async (title, dueDate) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key')) {
      return 5;
    }

    const prompt = `
Analyze the task: "${title}" due on ${dueDate}.
Estimate the urgency level on a scale from 1 to 10, where 1 is extremely low urgency and 10 is critically urgent.
CRITICAL RULE: If the task involves a "meeting", "exam", or "recharge" (e.g. phone/mobile recharge, electricity bill), it is extremely important to the user. You MUST assign it an urgency of 9 or 10.
Consider typical real-world priorities for other tasks (e.g. "submit taxes today" = 10, "buy milk tomorrow" = 5, "watch movie" = 2).
Return ONLY a valid integer between 1 and 10. No text, no markdown.
`;
    const responseText = await queryGemini(prompt, false);
    const inferred = parseInt(responseText.replace(/\D/g, ''));
    if (inferred >= 1 && inferred <= 10) return inferred;
    return 5;
  } catch (error) {
    console.error('Failed to infer task urgency:', error);
    return 5;
  }
};

const getMockGlobalPriority = (tasks, events, habits, goals) => {
  const items = [];
  tasks.slice(0, 2).forEach(t => items.push({ id: t._id, type: 'task', title: t.title, priorityScore: 90, reason: "Urgent task deadline" }));
  events.slice(0, 1).forEach(e => items.push({ id: e._id, type: 'event', title: e.title, priorityScore: 95, reason: "Meeting starting soon" }));
  habits.slice(0, 1).forEach(h => items.push({ id: h._id, type: 'habit', title: h.name, priorityScore: 80, reason: "Maintain your streak" }));
  goals.slice(0, 1).forEach(g => items.push({ id: g._id, type: 'goal', title: g.title, priorityScore: 85, reason: "Progress needed for milestone" }));
  
  return items.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4);
};

