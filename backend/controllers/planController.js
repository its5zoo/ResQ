import Plan from '../models/Plan.js';
import User from '../models/User.js';
import { generatePlanWithGemini, syncPlanToCalendar, detectPlanType } from '../services/planService.js';
import { getCalendarClient } from '../services/googleCalendarService.js';

// ─────────────────────────────────────────────────────────────
//  POST /api/plans/generate
//  Generate, save, and start calendar sync for a new plan
// ─────────────────────────────────────────────────────────────
export const generatePlan = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      topic,
      durationDays,
      dailyMinutes = 60,
      startDate,
      interviewAnswers = {},
      originalRequest = '',
      reminderTime = '09:00'
    } = req.body;

    if (!topic || !durationDays || !startDate) {
      return res.status(400).json({ error: 'topic, durationDays, and startDate are required.' });
    }

    if (durationDays < 1 || durationDays > 365) {
      return res.status(400).json({ error: 'durationDays must be between 1 and 365.' });
    }

    const planType = detectPlanType(topic, originalRequest);
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + durationDays - 1);

    // Generate day-by-day plan via Gemini
    console.log(`[PlanController] Generating ${durationDays}-day plan for: ${topic}`);
    if (req.io) {
      req.io.to(`user_${userId.toString()}`).emit('plan_progress', { stage: 'generating', message: `Building your ${durationDays}-day plan...` });
    }
    
    let days;
    try {
      days = await generatePlanWithGemini({
        topic,
        planType,
        durationDays,
        dailyMinutes,
        startDate: start,
        interviewAnswers
      });
    } catch (geminiError) {
      console.error('[PlanController] Gemini generation failed:', geminiError.message);
      return res.status(500).json({ error: 'generation_failed', message: 'Failed to generate plan content.' });
    }

    if (req.io) {
      req.io.to(`user_${userId.toString()}`).emit('plan_progress', { stage: 'saving', message: 'Saving plan to database...' });
    }

    // Save plan to MongoDB
    let plan;
    try {
      plan = new Plan({
        userId,
        planType,
        originalRequest,
        topic,
        interviewAnswers,
        durationDays,
        dailyMinutes,
        startDate: start,
        endDate: end,
        reminderTime,
        currentDay: 1,
        completedDays: 0,
        streakDays: 0,
        days
      });
      await plan.save();
      console.log(`[PlanController] Plan saved: ${plan._id}`);
    } catch (dbError) {
      console.error('[PlanController] DB save failed after Gemini succeeded:', dbError.message);
      return res.status(500).json({ error: 'save_failed', message: 'Plan generated but could not be saved.' });
    }

    if (req.io) {
      req.io.to(`user_${userId.toString()}`).emit('plan_progress', { stage: 'syncing', message: 'Adding to Google Calendar...' });
    }

    // Respond immediately — calendar sync runs in background
    res.status(201).json({
      success: true,
      plan: {
        _id: plan._id,
        topic: plan.topic,
        planType: plan.planType,
        durationDays: plan.durationDays,
        startDate: plan.startDate,
        endDate: plan.endDate,
        currentDay: plan.currentDay,
        completedDays: plan.completedDays,
        calendarSynced: false,
        days: plan.days
      }
    });

    // Background: sync to Google Calendar
    syncPlanToCalendar(plan, userId).catch(err => {
      console.error('[PlanController] Background calendar sync failed:', err.message);
    });

  } catch (err) {
    console.error('[PlanController] generatePlan error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to generate plan.' });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/plans
//  All plans for current user (summary only, no days array)
// ─────────────────────────────────────────────────────────────
export const getPlans = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const plans = await Plan.find({ userId })
      .select('-days')
      .sort({ createdAt: -1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  GET /api/plans/:planId
//  Full plan with all days
// ─────────────────────────────────────────────────────────────
export const getPlan = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const plan = await Plan.findOne({ _id: req.params.planId, userId });
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/plans/:planId/days/:dayNumber/complete
//  Mark a day as complete
// ─────────────────────────────────────────────────────────────
export const completeDay = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { planId, dayNumber } = req.params;
    const dayNum = parseInt(dayNumber);

    const plan = await Plan.findOne({ _id: planId, userId });
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    const day = plan.days.find(d => d.day === dayNum);
    if (!day) return res.status(404).json({ error: `Day ${dayNum} not found in plan.` });

    if (day.completed) {
      return res.json({ message: 'Day already completed.', plan });
    }

    day.completed = true;
    day.completedAt = new Date();
    plan.completedDays = plan.days.filter(d => d.completed).length;

    // Update streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const wasYesterdayDone = plan.lastCompletedAt
      ? new Date(plan.lastCompletedAt).toDateString() === yesterday.toDateString()
      : false;
    plan.streakDays = wasYesterdayDone ? plan.streakDays + 1 : 1;
    plan.lastCompletedAt = new Date();

    // Advance currentDay to next incomplete day
    const nextIncomplete = plan.days.find(d => !d.completed && d.day > dayNum);
    if (nextIncomplete) {
      plan.currentDay = nextIncomplete.day;
    } else if (plan.completedDays === plan.durationDays) {
      plan.status = 'completed';
    }

    await plan.save();

    // Update Google Calendar event title to show ✅
    if (day.googleCalendarEventId) {
      try {
        const user = await User.findById(userId);
        if (user && user.googleAccessToken) {
          const calendar = await getCalendarClient(user);
          await calendar.events.patch({
            calendarId: 'primary',
            eventId: day.googleCalendarEventId,
            requestBody: {
              summary: `✅ ResQ: Day ${day.day} — ${day.title}`
            }
          });
        }
      } catch (calErr) {
        console.warn('[PlanController] Failed to update calendar event:', calErr.message);
      }
    }

    res.json({ success: true, plan });
  } catch (err) {
    console.error('[PlanController] completeDay error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/plans/:planId/pause
// ─────────────────────────────────────────────────────────────
export const pausePlan = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const plan = await Plan.findOne({ _id: req.params.planId, userId });
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });
    plan.status = plan.status === 'paused' ? 'active' : 'paused';
    await plan.save();
    res.json({ success: true, status: plan.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─────────────────────────────────────────────────────────────
//  PATCH /api/plans/:planId/reminder-time
// ─────────────────────────────────────────────────────────────
export const updateReminderTime = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { reminderTime } = req.body;
    if (!reminderTime || !/^\d{2}:\d{2}$/.test(reminderTime)) {
      return res.status(400).json({ error: 'reminderTime must be in HH:MM format.' });
    }
    const plan = await Plan.findOneAndUpdate(
      { _id: req.params.planId, userId },
      { reminderTime },
      { new: true }
    );
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });
    res.json({ success: true, reminderTime: plan.reminderTime });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updatePlan = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { planId } = req.params;
    const { topic, durationDays, dailyMinutes, reminderTime } = req.body;

    const plan = await Plan.findOne({ _id: planId, userId });
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    let modified = false;
    let rebuildRoadmap = false;

    if (topic && topic !== plan.topic) {
      plan.topic = topic;
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

    if (rebuildRoadmap) {
      const start = new Date(plan.startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + plan.durationDays - 1);
      plan.endDate = end;

      console.log(`[PlanController] Re-generating ${plan.durationDays}-day plan for: ${plan.topic}`);
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

    if (modified) {
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
        } catch (calErr) {
          console.warn('[PlanController] Calendar clean error:', calErr.message);
        }
        syncPlanToCalendar(plan, userId).catch(err => {
          console.error('[PlanController] Background calendar re-sync failed:', err.message);
        });
      }
    }

    res.json({ success: true, plan });
  } catch (err) {
    console.error('[PlanController] updatePlan error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to update plan.' });
  }
};

// ─────────────────────────────────────────────────────────────
//  DELETE /api/plans/:planId
//  Delete plan + remove all Google Calendar events
// ─────────────────────────────────────────────────────────────
export const deletePlan = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const plan = await Plan.findOne({ _id: req.params.planId, userId });
    if (!plan) return res.status(404).json({ error: 'Plan not found.' });

    // Delete Google Calendar events in background
    if (plan.calendarSynced) {
      (async () => {
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
              } catch { /* ignore individual delete failures */ }
            }
            console.log(`[PlanController] Deleted ${eventIds.length} calendar events for plan ${plan._id}`);
          }
        } catch (e) {
          console.warn('[PlanController] Calendar cleanup failed:', e.message);
        }
      })();
    }

    await Plan.deleteOne({ _id: plan._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
