import CalendarEvent from '../models/CalendarEvent.js';
import User from '../models/User.js';
import Task from '../models/Task.js';

/**
 * Query overlap where existing event E overlaps with [startTime, endTime]:
 * E.startTime < endTime AND E.endTime > startTime
 */
export async function detectConflicts(userId, startTime, endTime) {
  const conflicts = await CalendarEvent.find({
    userId,
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) }
  });
  return conflicts;
}

/**
 * Finds the best free slot or generates scored recommendations for a calendar event/task
 */
export async function findBestSlot(userId, requestedTime, durationMinutes, date, slotTypeOrTitle = '') {
  const targetDate = date ? new Date(date) : (requestedTime ? new Date(requestedTime) : new Date());
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all calendar events today
  const dayEvents = await CalendarEvent.find({
    userId,
    startTime: { $lt: endOfDay },
    endTime: { $gt: startOfDay }
  });

  const user = await User.findById(userId);
  const workingHours = user?.workingHours || { start: '09:00', end: '18:00' };

  // 1. If requested time is specified, check availability
  if (requestedTime) {
    const startTime = new Date(requestedTime);
    const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

    const conflicts = await detectConflicts(userId, startTime, endTime);
    if (conflicts.length === 0) {
      return {
        slot: { startTime, endTime },
        isOriginalTime: true,
        conflictInfo: null
      };
    } else {
      // Find nearest free slot within 2 hours either direction
      const step = 5; // 5 minute steps
      const maxOffset = 120; // 2 hours
      let foundSlot = null;

      for (let offset = step; offset <= maxOffset; offset += step) {
        // Later slots first
        const posStart = new Date(startTime.getTime() + offset * 60000);
        const posEnd = new Date(posStart.getTime() + durationMinutes * 60000);
        const posConflicts = await detectConflicts(userId, posStart, posEnd);
        if (posConflicts.length === 0) {
          foundSlot = { startTime: posStart, endTime: posEnd };
          break;
        }

        // Earlier slots second
        const negStart = new Date(startTime.getTime() - offset * 60000);
        const negEnd = new Date(negStart.getTime() + durationMinutes * 60000);
        const negConflicts = await detectConflicts(userId, negStart, negEnd);
        if (negConflicts.length === 0) {
          foundSlot = { startTime: negStart, endTime: negEnd };
          break;
        }
      }

      const conflictNames = conflicts.map(c => c.title).join(', ');
      return {
        slot: foundSlot,
        isOriginalTime: false,
        conflictInfo: `Conflict with event(s): ${conflictNames}`
      };
    }
  }

  // 2. If no time is given: perform smart scheduling scoring
  const candidates = [];
  const baseDate = new Date(targetDate);
  baseDate.setHours(0, 0, 0, 0);

  // Generate slots every 30 mins between 8:00 AM and 8:00 PM
  for (let hour = 8; hour <= 20; hour++) {
    for (let min of [0, 30]) {
      if (hour === 20 && min > 0) continue;
      const startTime = new Date(baseDate);
      startTime.setHours(hour, min, 0, 0);
      const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
      candidates.push({ startTime, endTime });
    }
  }

  const scoredCandidates = [];
  for (const cand of candidates) {
    const conflicts = await detectConflicts(userId, cand.startTime, cand.endTime);
    if (conflicts.length > 0) continue;

    let score = 100;
    const startHour = cand.startTime.getHours();
    const endHour = cand.endTime.getHours();
    const endMin = cand.endTime.getMinutes();

    // 1) Penalty if before start of working hours or after end of working hours (6:00 PM)
    const [wStartHour, wStartMin] = (workingHours.start || '09:00').split(':').map(Number);
    const [wEndHour, wEndMin] = (workingHours.end || '18:00').split(':').map(Number);
    
    const startVal = startHour * 60 + cand.startTime.getMinutes();
    const endVal = endHour * 60 + endMin;
    const wStartVal = wStartHour * 60 + wStartMin;
    const wEndVal = wEndHour * 60 + wEndMin;

    if (startVal < wStartVal || endVal > wEndVal) {
      score -= 20;
    }

    // 2) Penalty if right after another event (< 15min buffer)
    let hasShortBuffer = false;
    for (const event of dayEvents) {
      const eventEnd = new Date(event.endTime).getTime();
      const gap = cand.startTime.getTime() - eventEnd;
      if (gap >= 0 && gap < 15 * 60000) {
        hasShortBuffer = true;
        break;
      }
    }
    if (hasShortBuffer) {
      score -= 15;
    }

    // 3) Bonus for slots in user's historically productive hours (10 AM - 12 PM, 2 PM - 4 PM)
    const productiveHours = [10, 11, 14, 15];
    if (productiveHours.includes(startHour)) {
      score += 10;
    }

    // 4) For "focus work": prefer morning slots (before noon)
    // 5) For "meetings": prefer mid-morning or early afternoon
    const typeStr = slotTypeOrTitle.toLowerCase();
    const isFocus = typeStr.includes('focus') || typeStr.includes('report') || typeStr.includes('study') || typeStr.includes('work');
    const isMeeting = typeStr.includes('meeting') || typeStr.includes('call') || typeStr.includes('sync');

    if (isFocus && startHour < 12) {
      score += 15;
    } else if (isMeeting && ((startHour >= 10 && startHour <= 12) || (startHour >= 13 && startHour <= 15))) {
      score += 15;
    }

    scoredCandidates.push({
      startTime: cand.startTime,
      endTime: cand.endTime,
      score
    });
  }

  // Sort by score descending, return top 3 options
  scoredCandidates.sort((a, b) => b.score - a.score);
  return scoredCandidates.slice(0, 3);
}

/**
 * Greedily assigns all pending tasks with estimated time slots for the next 5 days
 */
export async function autoScheduleAllPendingTasks(userId) {
  // Fetch incomplete tasks
  const tasks = await Task.find({ userId, completed: false });

  // Calculate priority score for each task:
  // score = (urgency * 0.5) + (deadlineProximityScore * 0.3) + (estimatedTimeScore * 0.2)
  const scoredTasks = tasks.map(task => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / (24 * 60 * 60000));

    let deadlineProximityScore = 2;
    if (diffDays <= 0) {
      deadlineProximityScore = 10; // today
    } else if (diffDays === 1) {
      deadlineProximityScore = 8;  // tomorrow
    } else if (diffDays <= 7) {
      deadlineProximityScore = 6;  // this week
    }

    const est = task.estimatedMinutes || 30;
    let estimatedTimeScore = 5;
    if (est < 30) {
      estimatedTimeScore = 10;
    } else if (est >= 30 && est < 60) {
      estimatedTimeScore = 8;
    } else if (est >= 60 && est <= 120) {
      estimatedTimeScore = 5;
    } else if (est > 120 && est <= 180) {
      estimatedTimeScore = 3;
    } else {
      estimatedTimeScore = 2;
    }

    const priorityScore = (task.urgency * 0.5) + (deadlineProximityScore * 0.3) + (estimatedTimeScore * 0.2);

    return {
      task,
      priorityScore,
      aiPriorityRank: task.aiPriorityRank !== undefined && task.aiPriorityRank !== null ? task.aiPriorityRank : 999
    };
  });

  // Sort by rank ascending (lower rank is more important), then score descending (higher score is more important)
  scoredTasks.sort((a, b) => {
    if (a.aiPriorityRank !== b.aiPriorityRank) {
      return a.aiPriorityRank - b.aiPriorityRank;
    }
    return b.priorityScore - a.priorityScore;
  });

  const user = await User.findById(userId);
  const workingHours = user?.workingHours || { start: '09:00', end: '18:00' };

  const createdEvents = [];
  const searchStartDate = new Date();

  for (const { task } of scoredTasks) {
    // Check if task is already scheduled
    const existing = await CalendarEvent.findOne({ userId, taskId: task._id });
    if (existing) continue;

    const duration = task.estimatedMinutes || 30;
    const slot = await findFreeSlotForTask(userId, duration, workingHours, searchStartDate);

    if (slot) {
      const newEvent = new CalendarEvent({
        userId,
        title: `AI Focus block: ${task.title}`,
        startTime: slot.startTime,
        endTime: slot.endTime,
        type: 'ai_block',
        taskId: task._id,
        aiGenerated: true,
        notes: `Automated focus session scheduled by ResQ AI for: ${task.title}.`
      });
      await newEvent.save();
      createdEvents.push(newEvent);
    }
  }

  return createdEvents;
}

/**
 * Scan day offsets to find conflict-free intervals
 */
export async function findFreeSlotForTask(userId, durationMinutes, workingHours, searchStartDate) {
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const currentDate = new Date(searchStartDate);
    currentDate.setDate(searchStartDate.getDate() + dayOffset);

    const [startHour, startMin] = (workingHours.start || '09:00').split(':').map(Number);
    const [endHour, endMin] = (workingHours.end || '18:00').split(':').map(Number);

    const dayStart = new Date(currentDate);
    dayStart.setHours(startHour, startMin, 0, 0);

    const dayEnd = new Date(currentDate);
    dayEnd.setHours(endHour, endMin, 0, 0);

    let candidateStart = new Date(dayStart);

    // If candidate start is today and before current time, fast forward it to present time (rounded to next 5 minutes)
    if (candidateStart.getTime() < Date.now()) {
      candidateStart = new Date();
      const ms = 5 * 60000;
      candidateStart = new Date(Math.ceil(candidateStart.getTime() / ms) * ms);
    }

    while (candidateStart.getTime() + durationMinutes * 60000 <= dayEnd.getTime()) {
      const candidateEnd = new Date(candidateStart.getTime() + durationMinutes * 60000);

      const conflicts = await detectConflicts(userId, candidateStart, candidateEnd);
      if (conflicts.length === 0) {
        return { startTime: candidateStart, endTime: candidateEnd };
      } else {
        // Advance past all conflicting events
        let maxConflictEnd = candidateStart.getTime() + 15 * 60000;
        for (const conflict of conflicts) {
          const conflictEnd = new Date(conflict.endTime).getTime();
          if (conflictEnd > maxConflictEnd) {
            maxConflictEnd = conflictEnd;
          }
        }
        candidateStart = new Date(maxConflictEnd);
      }
    }
  }
  return null;
}

/**
 * Auto-creates a single focus block for a specific task
 */
export async function scheduleFocusBlockForTask(userId, taskId) {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) return null;

  const existing = await CalendarEvent.findOne({ userId, taskId: task._id });
  if (existing) return existing;

  const user = await User.findById(userId);
  const workingHours = user?.workingHours || { start: '09:00', end: '18:00' };

  const duration = task.estimatedMinutes || 30;
  const searchStartDate = new Date();

  const slot = await findFreeSlotForTask(userId, duration, workingHours, searchStartDate);
  if (slot) {
    const newEvent = new CalendarEvent({
      userId,
      title: `AI Focus block: ${task.title}`,
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: 'ai_block',
      taskId: task._id,
      aiGenerated: true,
      notes: `Automated focus session scheduled by ResQ AI for: ${task.title}.`
    });
    await newEvent.save();
    return newEvent;
  }
  return null;
}

