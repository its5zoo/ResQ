import Plan from '../models/Plan.js';
import User from '../models/User.js';
import { getCalendarClient } from './googleCalendarService.js';
import { io } from '../socket/socketHandler.js';
import { sendPushToUser } from './pushService.js';

function safeParseGeminiJSON(rawText) {
  // Strip markdown fences
  let cleaned = rawText
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim();
  
  // Find the JSON array/object within the text
  const jsonStart = cleaned.search(/[\[{]/);
  const jsonEnd = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  
  if (jsonStart === -1 || jsonEnd === -1) {
    throw new Error('No JSON found in Gemini response');
  }
  
  cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
  return JSON.parse(cleaned);
}

// ─────────────────────────────────────────────────────────────
//  KNOWN TOPICS (ResQ plans these autonomously without asking
//  the user what to study — Gemini fills the full curriculum)
// ─────────────────────────────────────────────────────────────
export const KNOWN_TOPICS = [
  'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust',
  'react', 'vue', 'angular', 'node', 'django', 'flask', 'spring',
  'data science', 'machine learning', 'deep learning', 'ai', 'artificial intelligence',
  'sql', 'database', 'mongodb', 'postgresql', 'web development', 'frontend', 'backend',
  'devops', 'docker', 'kubernetes', 'aws', 'cloud', 'cybersecurity', 'networking',
  'fitness', 'workout', 'gym', 'running', 'marathon', 'weight loss', 'muscle',
  'upsc', 'ielts', 'toefl', 'gre', 'gmat', 'cat', 'jee', 'neet', 'gate',
  'mba', 'marketing', 'product management', 'ux design', 'ui design',
  'graphic design', 'photography', 'music', 'guitar', 'piano',
  'spanish', 'french', 'german', 'japanese', 'hindi', 'english',
  'book', 'writing', 'blogging', 'content creation', 'youtube',
  'startup', 'entrepreneurship', 'finance', 'investing', 'trading'
];

/**
 * Detect if the topic is a well-known subject ResQ can plan autonomously.
 * Returns true if known, false if it's custom/vague work.
 */
export const isKnownTopic = (topic = '') => {
  const lower = topic.toLowerCase();
  return KNOWN_TOPICS.some(k => lower.includes(k));
};

/**
 * Detect plan type from the topic string
 */
export const detectPlanType = (topic = '', originalRequest = '') => {
  const lower = (topic + ' ' + originalRequest).toLowerCase();
  if (lower.match(/python|javascript|typescript|java|react|vue|node|django|flask|data science|machine learning|deep learning|web dev|frontend|backend|devops|docker|aws|cloud|sql|database|c\+\+|c#|go|rust|cybersecurity|ai |artificial/)) return 'study';
  if (lower.match(/fitness|workout|gym|running|marathon|weight|muscle|yoga|sport|exercise/)) return 'fitness';
  if (lower.match(/upsc|ielts|toefl|gre|gmat|cat|jee|neet|gate|exam|test|certification/)) return 'exam';
  if (lower.match(/career|job|switch|role|interview|portfolio|resume|linkedin|promotion/)) return 'career';
  if (lower.match(/startup|launch|product|mvp|company|business|venture|pitch/)) return 'project';
  if (lower.match(/project|work|complete|finish|deliver|build|create|develop|milestone|deadline/)) return 'project';
  return 'custom';
};
// ─────────────────────────────────────────────────────────────
//  LOCAL FALLBACK PLAN GENERATION
// ─────────────────────────────────────────────────────────────
export const generateLocalFallbackPlan = (topic, planType, durationDays, dailyMinutes, startDate) => {
  const days = [];
  const start = new Date(startDate);
  
  const p1End = Math.floor(durationDays * 0.2) || 1;
  const p2End = Math.floor(durationDays * 0.8) || 2;
  
  for (let i = 0; i < durationDays; i++) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + i);
    
    let phase = 'Execution';
    if (i < p1End) phase = 'Foundations';
    else if (i >= p2End) phase = 'Polish & Launch';
    
    const dayNum = i + 1;
    let title = '';
    let description = '';
    let type = 'work';
    let resourceHint = '';
    
    if (dayNum % 7 === 0) {
      title = `Weekly Review & Rest`;
      description = `Take a break, review the progress made during this week, and prepare for the next phase.`;
      type = 'review';
      resourceHint = 'Review your achievements and adjust calendar blocks.';
    } else {
      if (phase === 'Foundations') {
        title = `Introduction to ${topic}`;
        description = `Understand the basics of ${topic}. Research key definitions and set up your goals.`;
        type = 'learn';
        resourceHint = `Google Search: Introduction to ${topic}`;
      } else if (phase === 'Polish & Launch') {
        title = `Final Polish for ${topic}`;
        description = `Review all materials, refine final output, and ensure everything is completed for ${topic}.`;
        type = 'project';
        resourceHint = `Refine and verify ${topic} checklist.`;
      } else {
        title = `Core Practice - Part ${dayNum}`;
        description = `Engage in deep work and practical exercises to master ${topic} step by step.`;
        type = 'practice';
        resourceHint = `Practical exercise: ${topic} active implementation.`;
      }
    }
    
    days.push({
      day: dayNum,
      date: dayDate,
      phase,
      title,
      description,
      type,
      resourceHint,
      estimatedMinutes: dailyMinutes,
      completed: false,
      completedAt: null,
      googleCalendarEventId: null,
      skipped: false,
      notes: ''
    });
  }
  
  return days;
};

// ─────────────────────────────────────────────────────────────
//  GEMINI PLAN GENERATION
// ─────────────────────────────────────────────────────────────
export const generatePlanWithGemini = async (planConfig) => {
  const {
    topic,
    planType,
    durationDays,
    dailyMinutes,
    startDate,
    interviewAnswers = {}
  } = planConfig;

  const start = new Date(startDate);

  const contextStr = Object.entries(interviewAnswers)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n');

  const contextSection = contextStr ? '\nUSER CONTEXT:\n' + contextStr : '';
  const p1End = Math.floor(durationDays * 0.2);
  const p2Start = p1End + 1;
  const p2End = Math.floor(durationDays * 0.8);
  const p3Start = p2End + 1;
  const startDateStr = start.toISOString().split('T')[0];

  const prompt = 'You are ResQ, a professional planning assistant. Create a complete ' + durationDays + '-day plan.\n\n'
    + 'PLAN DETAILS:\n'
    + '- Topic/Goal: ' + topic + '\n'
    + '- Plan Type: ' + planType + '\n'
    + '- Duration: ' + durationDays + ' days\n'
    + '- Daily time available: ' + dailyMinutes + ' minutes per day\n'
    + '- Start date: ' + startDateStr + '\n'
    + contextSection + '\n\n'
    + 'PHASE STRUCTURE:\n'
    + '- Phase 1 (days 1 to ' + p1End + '): Foundations / Setup / Orientation\n'
    + '- Phase 2 (days ' + p2Start + ' to ' + p2End + '): Core Work / Learning / Execution\n'
    + '- Phase 3 (days ' + p3Start + ' to ' + durationDays + '): Polish / Review / Delivery / Launch\n\n'
    + 'STRICT RULES:\n'
    + '1. Each day has ONE specific, actionable task completable in ' + dailyMinutes + ' minutes\n'
    + '2. Task titles: max 8 words, specific and concrete\n'
    + '3. Include 1 rest/review day every 7 days (type: "review" or "rest")\n'
    + '4. Difficulty MUST escalate progressively across phases\n'
    + '5. resourceHint: ONE specific action (search term, video name, book chapter, or mini-project)\n'
    + '6. For known tech topics: follow the real industry curriculum order\n'
    + '7. For custom projects: tasks must be specific to the described work\n'
    + '8. Description: exactly 2 sentences, actionable\n\n'
    + 'Return ONLY a valid JSON array, no markdown fences, no explanation.\n'
    + 'Example item: {"day":1,"date":"' + startDateStr + '","phase":"Foundations","title":"Set Up Environment","description":"Install Python and VS Code. Run your first Hello World script to confirm setup.","type":"learn","resourceHint":"python.org official download page","estimatedMinutes":' + dailyMinutes + '}';

  const { getResQModel } = await import('../config/gemini.js');
  let model = getResQModel();

  const modelsToTry = [
    { name: 'gemini-2.5-flash', isResQ: true },
    { name: 'gemini-1.5-flash', isResQ: false },       // Reliable free-tier fallback
    { name: 'gemini-2.0-flash', isResQ: false },       // Alternative
    { name: 'gemini-1.5-flash-8b', isResQ: false }    // Lightest model — last resort
  ];

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  let rawText = '';
  let success = false;
  for (const mObj of modelsToTry) {
    try {
      console.log(`[PlanService] Attempting plan generation with model: ${mObj.name}...`);
      let activeModel;
      if (mObj.isResQ) {
        activeModel = model;
      } else {
        activeModel = genAI.getGenerativeModel({
          model: mObj.name,
          generationConfig: { responseMimeType: 'application/json' }
        });
      }

      const result = await Promise.race([
        activeModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 8192 }
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Gemini timeout after 30 seconds')), 30000))
      ]);
      rawText = result.response.text().trim();
      success = true;
      console.log(`[PlanService] Plan generation successful with model: ${mObj.name}`);
      break;
    } catch (err) {
      console.warn(`[PlanService] Model ${mObj.name} failed:`, err.message);
    }
  }

  if (!success) {
    console.warn('[PlanService] Gemini plan generation failed. Using local fallback plan generator!');
    return generateLocalFallbackPlan(topic, planType, durationDays, dailyMinutes, start);
  }

  let days;
  try {
    days = safeParseGeminiJSON(rawText);
  } catch (err) {
    throw new Error('Plan generation returned invalid format. Please try again.');
  }

  if (!Array.isArray(days) || days.length === 0) {
    throw new Error('Plan generation returned empty plan. Please try again.');
  }

  // Normalize dates: recalculate based on startDate in case Gemini made errors
  return days.map((d, idx) => {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + idx);
    return {
      day: idx + 1,
      date: dayDate,
      phase: d.phase || 'Core',
      title: d.title || `Day ${idx + 1}`,
      description: d.description || '',
      type: d.type || 'work',
      resourceHint: d.resourceHint || '',
      estimatedMinutes: d.estimatedMinutes || planConfig.dailyMinutes,
      completed: false,
      completedAt: null,
      googleCalendarEventId: null,
      skipped: false,
      notes: ''
    };
  });
};

// ─────────────────────────────────────────────────────────────
//  GOOGLE CALENDAR BATCH SYNC
// ─────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const addMinutesToTime = (timeStr, minutes) => {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
};

const typeToColorId = (type) => {
  const map = { review: '2', rest: '2', project: '6', work: '6', practice: '9', learn: '9', career: '1', fitness: '4' };
  return map[type] || '9';
};

export const syncPlanToCalendar = async (plan, userId) => {
  const user = await User.findById(userId);
  if (!user || !user.googleAccessToken) {
    console.log('[PlanService] User has no Google Calendar connected — skipping sync.');
    return false;
  }

  let calendar;
  try {
    calendar = await getCalendarClient(user);
  } catch (err) {
    console.error('[PlanService] Google Calendar auth failed:', err.message);
    return false;
  }

  const BATCH_SIZE = 10;
  const days = plan.days;
  const timeZone = 'Asia/Kolkata';
  const reminderTime = plan.reminderTime || '09:00';
  const endTime = addMinutesToTime(reminderTime, plan.dailyMinutes);

  console.log(`[PlanService] Syncing ${days.length} days to Google Calendar in batches of ${BATCH_SIZE}...`);

  for (let i = 0; i < days.length; i += BATCH_SIZE) {
    const batch = days.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async (day) => {
      try {
        const dateStr = new Date(day.date).toISOString().split('T')[0];
        const event = await calendar.events.insert({
          calendarId: 'primary',
          requestBody: {
            summary: `📚 ResQ: Day ${day.day} — ${day.title}`,
            description: `${day.description}\n\n💡 ${day.resourceHint}\n\nPlan: ${plan.topic} | Phase: ${day.phase}`,
            start: { dateTime: `${dateStr}T${reminderTime}:00`, timeZone },
            end: { dateTime: `${dateStr}T${endTime}:00`, timeZone },
            colorId: typeToColorId(day.type),
            reminders: {
              useDefault: false,
              overrides: [{ method: 'popup', minutes: 15 }]
            }
          }
        });

        // Store event ID back on the plan day
        day.googleCalendarEventId = event.data.id;
      } catch (err) {
        console.error(`[PlanService] Failed to create calendar event for day ${day.day}:`, err.message);
      }
    }));

    // Rate limit: wait 500ms between batches
    if (i + BATCH_SIZE < days.length) {
      await sleep(500);
    }
  }

  plan.calendarSynced = true;
  await plan.save();
  console.log('[PlanService] Calendar sync complete.');
  return true;
};

// ─────────────────────────────────────────────────────────────
//  DAILY VOICE REMINDER
// ─────────────────────────────────────────────────────────────
export const sendPlanReminder = async (plan) => {
  const user = await User.findById(plan.userId);
  if (!user) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find today's day entry
  const todayEntry = plan.days.find(d => {
    const dayDate = new Date(d.date);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate.getTime() === today.getTime();
  });

  if (!todayEntry) return; // No entry for today
  if (todayEntry.completed) return; // Already done, no reminder needed

  // Calculate how many days behind (incomplete days before today)
  const daysBehind = plan.days.filter(d => {
    const dayDate = new Date(d.date);
    dayDate.setHours(0, 0, 0, 0);
    return dayDate.getTime() < today.getTime() && !d.completed && !d.skipped;
  }).length;

  const daysRemaining = Math.ceil((new Date(plan.endDate) - today) / (1000 * 60 * 60 * 24));
  const endDateFormatted = new Date(plan.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const name = user.name.split(' ')[0]; // First name only
  const isLastDay = todayEntry.day === plan.durationDays;

  let message;
  if (isLastDay) {
    message = `${name}, this is it — Day ${plan.durationDays}, the final day of your ${plan.topic} plan. Complete "${todayEntry.title}" and you're done. Don't stop now.`;
  } else if (daysBehind >= 3) {
    message = `${name}, your ${plan.topic} plan needs attention. You're ${daysBehind} days behind. Today's task is "${todayEntry.title}". Your deadline is ${endDateFormatted}. Open your plan right now and get back on track.`;
  } else if (daysBehind >= 1) {
    message = `Hey ${name}, you're a little behind on your ${plan.topic} plan. Today is Day ${todayEntry.day} — "${todayEntry.title}". You have ${daysRemaining} days left to finish. Catch up today — you've got this.`;
  } else {
    message = `${name}, it's time for Day ${todayEntry.day} of your ${plan.topic} plan — "${todayEntry.title}". You're right on schedule with ${daysRemaining} days left. Let's keep the streak going!`;
  }

  const userId = plan.userId.toString();
  const roomName = `user_${userId}`;

  // 1. Try ElevenLabs TTS first
  let audioSent = false;
  try {
    const voiceId = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: message,
        model_id: 'eleven_monolingual_v1',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (response.ok) {
      const audioBuffer = await response.arrayBuffer();
      const base64Audio = Buffer.from(audioBuffer).toString('base64');
      if (io) {
        io.to(roomName).emit('voice_reminder', { audio: base64Audio, mimeType: 'audio/mpeg', message, planId: plan._id.toString() });
        audioSent = true;
        console.log(`[PlanService] ElevenLabs voice reminder sent to ${userId}`);
      }
    }
  } catch (err) {
    console.warn('[PlanService] ElevenLabs failed, falling back to browser TTS:', err.message);
  }

  // 2. Fallback: send text via Socket.IO → frontend uses SpeechSynthesis
  if (!audioSent && io) {
    io.to(roomName).emit('voice_reminder', { audio: null, mimeType: null, message, planId: plan._id.toString() });
    console.log(`[PlanService] Text fallback reminder sent to ${userId}`);
  }

  // 3. Web Push notification
  await sendPushToUser(
    userId,
    `📚 ResQ Plan Reminder — Day ${todayEntry.day}`,
    message,
    { tag: `plan-reminder-${plan._id}`, url: `/plans/${plan._id}` }
  );
};
