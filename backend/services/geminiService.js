import genAI from '../config/gemini.js';

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
const queryGemini = async (prompt, isJson = false) => {
  const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  
  await enforceRateLimit();

  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      ...(isJson ? { generationConfig: { responseMimeType: "application/json" } } : {})
    });

    const result = await model.generateContent(prompt);
    
    // Log token usage in development
    if (process.env.NODE_ENV !== 'production' && result.response.usageMetadata) {
      console.log(`[Gemini Token Log] Model: ${modelName} | Usage:`, result.response.usageMetadata);
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
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        ...(isJson ? { generationConfig: { responseMimeType: "application/json" } } : {})
      });

      const retryPrompt = isJson
        ? `${prompt}\n\nReturn ONLY valid JSON. Absolutely no conversational text, explanations, or code-block formatting wrappers.`
        : prompt;

      const result = await model.generateContent(retryPrompt);
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
export const generateDailySummary = async (user, tasks = [], calendarEvents = [], habits = []) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
      return getMockDailySummary(user, tasks, habits);
    }

    const taskList = tasks.map(t => `- ${t.title} (urgency: ${t.urgency}/10, completed: ${t.completed})`).join('\n');
    const eventList = calendarEvents.map(e => `- ${e.title} at ${e.timeSlot} on ${e.day} (${e.duration}m)`).join('\n');
    const habitList = habits.map(h => `- ${h.title} (streak: ${h.streak}d, done: ${h.completedToday})`).join('\n');

    const prompt = `
You are ResQ, an AI productivity assistant. The user's name is ${user.name || 'User'}.
Today's tasks:
${taskList || 'None'}

Calendar Events:
${eventList || 'None'}

Habit Streaks:
${habitList || 'None'}

Generate a very brief, punchy daily briefing (maximum 2 short sentences, under 30 words total). Include one quick actionable tip. Return plain text, no markdown bolding or styling.
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
Tasks (JSON format):
${JSON.stringify(tasks, null, 2)}

Return ONLY a JSON array of task IDs in priority order with a short reason field for each. Absolutely no extra conversational text or wrappers.
JSON Output Format:
[
  { "id": "task_id_here", "reason": "Short reason explaining its matrix rank" }
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
Analyze this habit: ${habit.title}.
Completion history last 30 days:
${JSON.stringify(completionHistory, null, 2)}

Current streak: ${habit.streak || 0} days.

Give one encouraging insight based on their history and one improvement tip to ensure they do not miss their goal.
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
 * 6. Handles vocal queries in userContext and outputs response text + actions.
 */
export const handleVoiceCommand = async (transcript, userContext = {}) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.includes('your_google_gemini_api_key') || apiKey.includes('your_gemini_api_key_here')) {
      return getMockVoiceResponse(transcript);
    }

    const prompt = `
You are the ResQ voice assistant. 
User said: "${transcript}"
User current dashboard context (JSON):
${JSON.stringify(userContext, null, 2)}

Determine user intent from this set: [summarize_day, schedule_task, show_deadlines, add_task, complete_task, show_habits, motivate, general_query].
If they want to study or schedule study, ask them if they have a specific time in mind to study (e.g. "Do you have a particular time in mind to study? If you choose a specific time, I will fix it on your calendar. Otherwise, we can keep the time flexible and only fix the day.").
Return ONLY JSON. No descriptions.
JSON Output Format:
{
  "intent": "intent_type_here",
  "response": "Brief friendly spoken response back to user under 30 words",
  "action": { "type": "action_type", "payload": {} } or null,
  "navigationTarget": "calendar" or "tasks" or "goals" or "habits" or null
}
`;

    return await queryGemini(prompt, true);
  } catch (err) {
    console.error('Error handling voice command:', err);
    return getMockVoiceResponse(transcript);
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
    insight: `You have successfully completed ${habit.title} streaks in the last week!`,
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

const getMockVoiceResponse = (transcript) => {
  const command = transcript.toLowerCase();
  if (command.includes('study') || command.includes('timetable') || command.includes('schedule study')) {
    return {
      intent: 'schedule_study',
      response: "I'd love to schedule a study block for you. Do you have a particular time in mind to study? If you choose a specific time, I will fix it on your calendar. Otherwise, we can keep the time flexible and only fix the day.",
      action: null,
      navigationTarget: 'calendar'
    };
  } else if (command.includes('today') || command.includes('summarize')) {
    return {
      intent: 'summarize_day',
      response: "Here is your plan for today: You have a team sync scheduled for 10:00 AM and a React Focus block at 04:00 PM.",
      action: null,
      navigationTarget: 'calendar'
    };
  } else if (command.includes('deadline')) {
    return {
      intent: 'show_deadlines',
      response: "Warning: Your project deadline is at 06:00 PM today. Let's work smart and avoid distractions.",
      action: null,
      navigationTarget: 'tasks'
    };
  } else {
    return {
      intent: 'general_query',
      response: `I heard you say: "${transcript}". ResQ AI is ready to execute your command.`,
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
