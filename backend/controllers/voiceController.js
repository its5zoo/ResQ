import Task from '../models/Task.js';
import Habit from '../models/Habit.js';
import CalendarEvent from '../models/CalendarEvent.js';
import Goal from '../models/Goal.js';
import User from '../models/User.js';
import { resolveClarification, clearPendingCommands } from '../services/voiceIntentService.js';
import { reprioritizeTasksForUser } from './taskController.js';
import { syncGoogleCalendar, updateEventInGoogleCalendar, deleteEventFromGoogleCalendar } from '../services/googleCalendarService.js';
import { io } from '../socket/socketHandler.js';

export const executeVoiceCommand = async (userId, transcript, timezoneContext = null) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // 1. Settings toggle gate check
  if (user.voiceAI && user.voiceAI.enabled === false) {
    let msg = 'Voice assistant is currently disabled in your settings.';
    if (user.voiceAI.disabledReason === 'limit_reached') {
      msg = 'Monthly voice AI limit reached. Upgrade to Premium for unlimited access.';
    }
    return {
      intent: 'out_of_scope',
      confidence: 1.0,
      extractedData: {},
      missingFields: [],
      clarificationQuestion: null,
      response: msg,
      action: null,
      navigationTarget: null,
      suggestAlternative: null
    };
  }

  // Call voiceIntentService to resolve command/clarification
  const resultObj = await resolveClarification(userId, transcript, timezoneContext);
  
  const intent = resultObj.intent;
  const payload = resultObj.extractedData || {};

  // Fix AI Loop Bug: Clear the pending command cache once we successfully resolve the intent
  if (intent !== 'needs_clarification') {
    clearPendingCommands(userId);
  }

  let taskModified = false;
  let calendarModified = false;
  let habitsModified = false;
  let goalsModified = false;
  let createdEvents = [];

  try {
    if (intent === 'create_task') {
      const newTask = new Task({
        userId,
        title: payload.title || 'New Task from Voice',
        urgency: payload.urgency || 5,
        category: payload.category || 'General',
        completed: false,
        dueDate: payload.dueDate ? new Date(payload.dueDate) : new Date(Date.now() + 86400000), // Default to tomorrow
        estimatedMinutes: payload.estimatedMinutes || payload.durationMinutes || 30
      });
      const savedTask = await newTask.save();
      await reprioritizeTasksForUser(userId);
      taskModified = true;
      resultObj.createdTaskId = savedTask._id;
    }
    else if (intent === 'complete_task') {
      const taskId = payload.taskId;
      if (taskId) {
        await Task.findOneAndUpdate({ _id: taskId, userId }, { completed: true });
      } else if (payload.title) {
        await Task.findOneAndUpdate({ title: new RegExp(payload.title, 'i'), userId }, { completed: true });
      }
      await reprioritizeTasksForUser(userId);
      taskModified = true;
    }
    else if (intent === 'update_task_priority') {
      const taskId = payload.taskId;
      const urgency = payload.urgency;
      if (taskId && urgency) {
        await Task.findOneAndUpdate({ _id: taskId, userId }, { urgency });
      } else if (payload.title && urgency) {
        await Task.findOneAndUpdate({ title: new RegExp(payload.title, 'i'), userId }, { urgency });
      }
      await reprioritizeTasksForUser(userId);
      taskModified = true;
    }
    else if (intent === 'edit_task') {
      const taskId = payload.taskId;
      const titleSearch = payload.title;
      const updateData = {};
      if (payload.newTitle) updateData.title = payload.newTitle;
      if (payload.urgency) updateData.urgency = payload.urgency;
      
      if (taskId) {
        await Task.findOneAndUpdate({ _id: taskId, userId }, updateData);
      } else if (titleSearch) {
        await Task.findOneAndUpdate({ title: new RegExp(titleSearch, 'i'), userId }, updateData);
      }
      await reprioritizeTasksForUser(userId);
      taskModified = true;
    }
    else if (intent === 'delete_task') {
      const taskId = payload.taskId;
      if (taskId) {
        await Task.findOneAndDelete({ _id: taskId, userId });
      } else if (payload.title) {
        await Task.findOneAndDelete({ title: new RegExp(payload.title, 'i'), userId });
      }
      await reprioritizeTasksForUser(userId);
      taskModified = true;
    }
    else if (intent === 'rename_task') {
      const titleSearch = payload.title;
      const newTitle = payload.newTitle;
      if (titleSearch && newTitle) {
        await Task.findOneAndUpdate({ title: new RegExp(titleSearch, 'i'), userId }, { title: newTitle });
      }
      await reprioritizeTasksForUser(userId);
      taskModified = true;
    }
    else if (intent === 'read_tasks') {
      // Read-only: the voice response is already composed by Gemini using the context snapshot
      // No DB writes needed
    }
    else if (intent === 'read_habits') {
      // Read-only
    }
    else if (intent === 'read_goals') {
      // Read-only
    }
    else if (intent === 'read_calendar') {
      // Read-only
    }
    else if (intent === 'schedule_event') {
      const start = payload.startTime ? new Date(payload.startTime) : new Date();
      const duration = payload.durationMinutes || 45;
      const end = payload.endTime ? new Date(payload.endTime) : new Date(start.getTime() + duration * 60000);

      const newEvent = new CalendarEvent({
        userId,
        title: payload.title || 'Scheduled by Voice',
        startTime: start,
        endTime: end,
        type: payload.type || 'ai_block',
        layer: 'default',
        notes: payload.notes || 'Scheduled via ResQ Voice Assistant',
        aiGenerated: true,
        isAllDay: payload.isAllDay || false
      });
      const savedEvent = await newEvent.save();
      createdEvents.push(savedEvent);
      calendarModified = true;
      resultObj.createdEventId = savedEvent._id;
      
      const user = await User.findById(userId);
      if (user && user.googleAccessToken) {
        syncGoogleCalendar(user).catch(err => console.error('[Google Sync] Error syncing voice scheduled event:', err));
      }
    }
    else if (intent === 'reschedule_event') {
      const eventId = payload.eventId;
      const start = payload.newStartTime ? new Date(payload.newStartTime) : null;
      const end = payload.newEndTime ? new Date(payload.newEndTime) : null;
      
      let updatedEvent = null;
      if (eventId && start) {
        const update = { startTime: start };
        if (end) update.endTime = end;
        updatedEvent = await CalendarEvent.findOneAndUpdate({ _id: eventId, userId }, update, { new: true });
        if (updatedEvent) calendarModified = true;
      } else if (payload.title && start) {
        const update = { startTime: start };
        if (end) update.endTime = end;
        updatedEvent = await CalendarEvent.findOneAndUpdate({ title: new RegExp(payload.title, 'i'), userId }, update, { new: true });
        if (updatedEvent) calendarModified = true;
      }

      if (updatedEvent && updatedEvent.googleEventId) {
        const user = await User.findById(userId);
        if (user && user.googleAccessToken) {
          updateEventInGoogleCalendar(user, updatedEvent).catch(err => console.error('[Google Sync] Voice update error:', err));
        }
      }
    }
    else if (intent === 'cancel_event') {
      const eventId = payload.eventId;
      let deletedEvent = null;
      if (eventId) {
        deletedEvent = await CalendarEvent.findOneAndDelete({ _id: eventId, userId });
        if (deletedEvent) calendarModified = true;
      } else if (payload.title) {
        deletedEvent = await CalendarEvent.findOneAndDelete({ title: new RegExp(payload.title, 'i'), userId });
        if (deletedEvent) calendarModified = true;
      }
      
      if (deletedEvent && deletedEvent.googleEventId) {
        const user = await User.findById(userId);
        if (user && user.googleAccessToken) {
          deleteEventFromGoogleCalendar(user, deletedEvent.googleEventId).catch(err => console.error('[Google Sync] Voice delete error:', err));
        }
      }
    }
    else if (intent === 'create_habit') {
      const newHabit = new Habit({
        userId,
        name: payload.name || 'New Habit',
        targetDays: payload.targetDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        completions: [],
        streak: 0
      });
      await newHabit.save();
      habitsModified = true;
    }
    else if (intent === 'complete_habit') {
      const habitId = payload.habitId;
      let habit;
      if (habitId) {
        habit = await Habit.findOne({ _id: habitId, userId });
      } else if (payload.name) {
        habit = await Habit.findOne({ name: new RegExp(payload.name, 'i'), userId });
      }

      if (habit) {
        const todayDate = new Date();
        todayDate.setHours(0, 0, 0, 0);
        const alreadyCompleted = habit.completions.some(c => {
          const d = new Date(c.date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === todayDate.getTime() && c.completed;
        });

        if (!alreadyCompleted) {
          habit.completions.push({ date: new Date(), completed: true });
          habit.streak = (habit.streak || 0) + 1;
          await habit.save();
          habitsModified = true;
        }
      }
    }
    else if (intent === 'delete_habit') {
      const habitId = payload.habitId;
      if (habitId) {
        await Habit.findOneAndDelete({ _id: habitId, userId });
      } else if (payload.name) {
        await Habit.findOneAndDelete({ name: new RegExp(payload.name, 'i'), userId });
      }
      habitsModified = true;
    }
    else if (intent === 'update_habit') {
      const habitId = payload.habitId;
      const updateData = {};
      if (payload.targetDays) updateData.targetDays = payload.targetDays;
      if (payload.name && !habitId) {
        await Habit.findOneAndUpdate({ name: new RegExp(payload.name, 'i'), userId }, updateData);
      } else if (habitId) {
        await Habit.findOneAndUpdate({ _id: habitId, userId }, updateData);
      }
      habitsModified = true;
    }
    else if (intent === 'create_goal') {
      const targetDate = payload.targetDate ? new Date(payload.targetDate) : new Date(Date.now() + 30 * 86400000); // 30 days from now
      const newGoal = new Goal({
        userId,
        title: payload.title || 'New Goal',
        targetDate,
        progress: 0,
        keyResults: []
      });
      await newGoal.save();
      goalsModified = true;
      resultObj.createdGoalId = newGoal._id;

      if (payload.autoPlan) {
        // Auto-generate milestones in the background
        import('../services/geminiService.js').then(({ generateGoalBreakdown }) => {
          generateGoalBreakdown(newGoal, payload.userPreferences || '')
            .then(async (milestones) => {
              if (Array.isArray(milestones) && milestones.length > 0) {
                await Goal.findByIdAndUpdate(newGoal._id, {
                  milestones: milestones.map(m => ({
                    week: m.week,
                    milestone: m.milestone,
                    effort: m.effort || 'medium',
                    done: false
                  }))
                });
                console.log(`[Voice AI] Auto-generated roadmap for goal ${newGoal._id}`);
              }
            }).catch(console.error);
        });

        // Auto-create a daily reminder habit
        const reminderHabit = new Habit({
          userId,
          name: `Goal: ${newGoal.title}`,
          targetDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          aiTip: `Daily reminder to make progress on your goal: ${newGoal.title}`
        });
        reminderHabit.save().catch(console.error);
      }
    }
    else if (intent === 'create_plan') {
      const { topic, dailyMinutes, interviewAnswers, originalRequest, needsMoreInfo } = payload;
      const durationDays = payload.durationDays || 30;
      const startDate = payload.startDate || new Date().toISOString();

      // If Gemini says it still needs more info, return clarification (handled by needs_clarification flow)
      if (needsMoreInfo) {
        // Already handled by the clarification question in voiceResponse — just return
      } else if (topic) {
        // Generate the plan in the background so we don't block the voice response
        import('../services/planService.js').then(async ({ generatePlanWithGemini, syncPlanToCalendar, detectPlanType }) => {
          try {
            if (io) io.to(`user_${userId}`).emit('plan_progress', { stage: 'generating', message: `Building your ${durationDays}-day plan...` });

            const Plan = (await import('../models/Plan.js')).default;
            const planType = detectPlanType(topic, originalRequest || '');
            const start = new Date(startDate);
            const end = new Date(start);
            end.setDate(start.getDate() + parseInt(durationDays) - 1);

            const days = await generatePlanWithGemini({
              topic,
              planType,
              durationDays: parseInt(durationDays),
              dailyMinutes: parseInt(dailyMinutes) || 60,
              startDate: start,
              interviewAnswers: interviewAnswers || {}
            });

            if (io) io.to(`user_${userId}`).emit('plan_progress', { stage: 'saving', message: 'Saving plan to database...' });

            const plan = new Plan({
              userId,
              planType,
              originalRequest: originalRequest || topic,
              topic,
              interviewAnswers: interviewAnswers || {},
              durationDays: parseInt(durationDays),
              dailyMinutes: parseInt(dailyMinutes) || 60,
              startDate: start,
              endDate: end,
              currentDay: 1,
              completedDays: 0,
              streakDays: 0,
              days
            });
            await plan.save();

            // Emit to user's socket so frontend can navigate to the new plan
            if (io) {
              io.to(`user_${userId}`).emit('plan:created', {
                planId: plan._id.toString(),
                topic: plan.topic,
                durationDays: plan.durationDays
              });
            }

            // Sync to Google Calendar in background
            if (io) io.to(`user_${userId}`).emit('plan_progress', { stage: 'syncing', message: 'Adding to Google Calendar...' });
            syncPlanToCalendar(plan, userId).catch(e => console.error('[Voice] Calendar sync error:', e.message));

            console.log(`[Voice] Plan created: ${plan._id} for topic: ${topic}`);
          } catch (planErr) {
            console.error('[Voice] create_plan background error:', planErr.message);
            let errorMessage = 'Plan generation failed. Please try again.';
            if (planErr.message && (planErr.message.includes('429') || planErr.message.includes('Quota exceeded'))) {
              errorMessage = 'Plan generation failed: Google Gemini Free Tier API Quota exceeded. Please try again later or upgrade your API key.';
            }
            if (io) {
              io.to(`user_${userId}`).emit('plan:error', { message: errorMessage });
            }
            if (io) {
              io.to(`user_${userId}`).emit('plan:error', { message: errorMessage });
            }
          }
        });
      }
    }
    else if (intent === 'modify_plan' || intent === 'edit_plan') {
      const { planId, topic, durationDays, dailyMinutes, reminderTime, newTopic } = payload;
      let query = { userId };
      if (planId) query._id = planId;
      else if (topic) query.topic = new RegExp(topic, 'i');

      const Plan = (await import('../models/Plan.js')).default;
      const plan = await Plan.findOne(query).sort({ updatedAt: -1 });

      if (plan) {
        let modified = false;
        let rebuildRoadmap = false;

        if (newTopic && newTopic !== plan.topic) {
          plan.topic = newTopic;
          modified = true;
          rebuildRoadmap = true;
        }
        if (durationDays && parseInt(durationDays) !== plan.durationDays) {
          plan.durationDays = parseInt(durationDays);
          modified = true;
          rebuildRoadmap = true;
        }
        if (dailyMinutes && parseInt(dailyMinutes) !== plan.dailyMinutes) {
          plan.dailyMinutes = parseInt(dailyMinutes);
          modified = true;
          rebuildRoadmap = true;
        }
        if (reminderTime && reminderTime !== plan.reminderTime) {
          plan.reminderTime = reminderTime;
          modified = true;
        }

        if (modified) {
          import('../services/planService.js').then(async ({ generatePlanWithGemini, syncPlanToCalendar }) => {
            try {
              if (rebuildRoadmap) {
                const start = new Date(plan.startDate);
                const end = new Date(start);
                end.setDate(start.getDate() + plan.durationDays - 1);
                plan.endDate = end;

                const days = await generatePlanWithGemini({
                  topic: plan.topic,
                  planType: plan.planType,
                  durationDays: plan.durationDays,
                  dailyMinutes: plan.dailyMinutes,
                  startDate: start,
                  interviewAnswers: plan.interviewAnswers || {}
                });
                plan.days = days;
                plan.completedDays = 0;
                plan.currentDay = 1;
              }
              await plan.save();

              if (plan.calendarSynced) {
                try {
                  const user = await User.findById(userId);
                  if (user && user.googleAccessToken) {
                    const calendar = await getCalendarClient(user);
                    const eventIds = plan.days
                      .filter(d => d.googleCalendarEventId)
                      .map(d => d.googleCalendarEventId);

                    for (const eventId of eventIds) {
                      try {
                        await calendar.events.delete({ calendarId: 'primary', eventId });
                      } catch {}
                    }
                  }
                } catch {}
                syncPlanToCalendar(plan, userId).catch(console.error);
              }

              if (io) {
                io.to(`user_${userId}`).emit('plan:created', {
                  planId: plan._id.toString(),
                  topic: plan.topic,
                  durationDays: plan.durationDays
                });
              }
            } catch (err) {
              console.error('[Voice] Rebuild plan failed:', err.message);
              if (io) {
                io.to(`user_${userId}`).emit('plan:error', { message: 'Plan rebuild failed.' });
              }
            }
          });
        }
      }
    }
    else if (intent === 'update_goal_progress') {
      const goalId = payload.goalId;
      const progress = parseFloat(payload.progressPercent);
      if (goalId && !isNaN(progress)) {
        await Goal.findOneAndUpdate({ _id: goalId, userId }, { progress });
        goalsModified = true;
      } else if (payload.title && !isNaN(progress)) {
        await Goal.findOneAndUpdate({ title: new RegExp(payload.title, 'i'), userId }, { progress });
        goalsModified = true;
      }
    }
    else if (intent === 'set_focus_session') {
      const duration = parseInt(payload.durationMinutes) || 25;
      const title = payload.taskId ? `AI Focus block: Focus on Task` : `AI Focus block: Focus Session`;
      const start = new Date();
      const end = new Date(start.getTime() + duration * 60000);

      const newEvent = new CalendarEvent({
        userId,
        title,
        startTime: start,
        endTime: end,
        type: 'ai_block',
        layer: 'default',
        notes: 'Focus session started via ResQ Voice Assistant',
        aiGenerated: true
      });
      const savedEvent = await newEvent.save();
      createdEvents.push(savedEvent);
      calendarModified = true;
      
      resultObj.uiAction = {
        type: 'start_focus',
        payload: { task: payload.taskId || 'Deep Work Session', duration }
      };
    }
  } catch (dbErr) {
    console.error('[voiceController] DB action failed:', dbErr);
  }

  // Socket notification emits
  if (io) {
    const room = `user_${userId}`;
    if (taskModified) {
      const updatedTasks = await Task.find({ userId }).sort({ aiPriorityRank: 1, urgency: -1 });
      io.to(room).emit('tasks:updated', updatedTasks);
      const incompleteTasks = await Task.find({ userId, completed: false }).sort({ aiPriorityRank: 1, urgency: -1 });
      io.to(room).emit('ai:priority-update', incompleteTasks);
    }
    if (calendarModified) {
      const allEvents = await CalendarEvent.find({ userId });
      io.to(room).emit('calendar:new-events', createdEvents);
      io.to(room).emit('calendar:updated', allEvents);
    }
    if (habitsModified) {
      const updatedHabits = await Habit.find({ userId });
      io.to(room).emit('habits:updated', updatedHabits);
    }
    if (goalsModified) {
      const updatedGoals = await Goal.find({ userId });
      io.to(room).emit('goals:updated', updatedGoals);
    }
  }

  return {
    intent: resultObj.intent,
    confidence: resultObj.confidence,
    extractedData: resultObj.extractedData,
    missingFields: resultObj.missingFields,
    clarificationQuestion: resultObj.clarificationQuestion,
    response: resultObj.voiceResponse || 'Command processed.',
    action: resultObj.uiAction || (resultObj.suggestAlternative ? { type: 'suggest_alternative', payload: { alternative: resultObj.suggestAlternative } } : null),
    navigationTarget: resultObj.navigationTarget,
    suggestAlternative: resultObj.suggestAlternative,
    createdTaskId: resultObj.createdTaskId,
    createdEventId: resultObj.createdEventId
  };
};

export const processVoiceCommand = async (req, res) => {
  const { transcript, commandText } = req.body;
  const command = transcript || commandText;

  if (!command) {
    return res.status(400).json({ message: 'Transcript or command text is required' });
  }

  try {
    console.log(`[VoiceController] Processing command for user ${req.user._id}: "${command}"`);
    const result = await executeVoiceCommand(req.user._id, command);
    console.log(`[VoiceController] Command executed successfully. Intent: ${result.intent}`);
    res.json(result);
  } catch (error) {
    console.error('[VoiceController] Fatal Error processing voice command:', error);
    res.status(500).json({ message: error.message });
  }
};

export const clearVoiceCache = async (req, res) => {
  try {
    clearPendingCommands(req.user._id);
    res.status(200).json({ message: 'Voice AI pending clarification cache cleared.' });
  } catch (error) {
    console.error('Error clearing voice cache:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getVoiceUsage = async (req, res) => {
  try {
    const user = await User.findById(req.user._id || req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const enabled = user.voiceAI?.enabled ?? true;
    const used = user.voiceAI?.monthlyCommandsUsed ?? 0;
    const limit = user.voiceAI?.monthlyLimit ?? 30;
    const remaining = Math.max(0, limit - used);
    const plan = user.plan || 'free';
    const disabledReason = user.voiceAI?.disabledReason ?? null;

    res.json({
      enabled,
      used,
      limit,
      remaining,
      plan,
      disabledReason
    });
  } catch (error) {
    console.error('Error fetching voice usage:', error);
    res.status(500).json({ message: error.message });
  }
};

export const synthesizeSpeech = async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ message: 'Text is required for synthesis' });
  }

  try {
    // We use Sarah (EXAVITQu4vr4xnSDxMaL), a calm and sweet free-tier compatible voice
    const voiceId = 'EXAVITQu4vr4xnSDxMaL'; 
    const apiKey = process.env.ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ message: 'ELEVENLABS_API_KEY is not configured' });
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_turbo_v2' 
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[ElevenLabs] API Error:', response.status, errText);
      return res.status(response.status).json({ message: 'ElevenLabs API Error', error: errText });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Transfer-Encoding': 'chunked'
    });

    const { Readable } = await import('stream');
    Readable.fromWeb(response.body).pipe(res);

  } catch (error) {
    console.error('Error synthesizing speech:', error);
    res.status(500).json({ message: error.message });
  }
};
