import { queryGemini } from './geminiService.js';

/**
 * Generates an empathetic procrastination interception strategy for a task.
 * Falls back to static template if Gemini fails.
 */
export async function getProcrastinationInterception(task) {
  const dismissCount = task.dismissCount || 3;
  
  // Choose fallback strategy based on dismiss count to rotate them
  const fallbackStrategies = [
    {
      strategy: 'A',
      message: 'Let’s lower the bar. Starting is the hardest part.',
      action: `Open the workspace for "${task.title}" and spend just 5 minutes on it. No pressure to finish, just start.`,
      timer: '05:00'
    },
    {
      strategy: 'B',
      message: 'Let’s check in. What’s keeping you from starting this?',
      action: `Is it clarity, energy, motivation, or lack of tools? Let's identify the blocker.`,
      timer: null
    },
    {
      strategy: 'C',
      message: 'Let’s look at the bigger picture.',
      action: `Completing "${task.title}" helps clear your mind and maintains your momentum. Think about how good it will feel to cross it off.`,
      timer: null
    }
  ];

  const strategyType = dismissCount % 3 === 0 ? 'A' : dismissCount % 3 === 1 ? 'B' : 'C';
  const fallback = fallbackStrategies.find(s => s.strategy === strategyType) || fallbackStrategies[0];

  const prompt = `
You are an empathetic productivity coach assisting a user who is procrastinating on this task:
Task Title: "${task.title}"
Task Description: "${task.description || 'None'}"

They have rescheduled/postponed this task ${dismissCount} times.
You must select ONE of the following three strategies to intercept their procrastination:
- Strategy A: Micro Action (A concrete, extremely easy action they can do in under 5 minutes to break the friction. Return timer "05:00".)
- Strategy B: Blocker Probe (Ask what is blocking them, e.g. lack of clarity, energy, motivation, or tools.)
- Strategy C: Emotional Anchor (Remind them of the larger purpose, output value, or goal connection.)

Return ONLY a valid JSON object matching this schema:
{
  "strategy": "A" | "B" | "C",
  "message": "A short, empathetic coaching prompt (1-2 sentences).",
  "action": "A specific, concrete suggestion or probe tailored to this task. For Strategy A, this must be a 5-minute task. For Strategy B, it must ask about blockers. For Strategy C, it must highlight the value of doing it.",
  "timer": "05:00" | null
}
`;

  try {
    const result = await queryGemini(prompt, true);
    if (result && ['A', 'B', 'C'].includes(result.strategy) && result.message && result.action) {
      return result;
    }
    return fallback;
  } catch (err) {
    console.warn('[ProcrastinationService] Gemini strategy generation failed, using fallback:', err.message);
    return fallback;
  }
}
