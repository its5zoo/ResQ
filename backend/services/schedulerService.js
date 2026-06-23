import CalendarEvent from '../models/CalendarEvent.js';

/**
 * Automatically schedules focus blocks ('ai-block') for pending tasks in open slots.
 */
export const autoScheduleTasks = async (userId, tasks) => {
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const timeSlots = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

  const pendingTasks = tasks.filter(t => !t.completed);
  const scheduledEvents = [];

  for (const task of pendingTasks) {
    // Check if task is already scheduled
    const existingEvent = await CalendarEvent.findOne({ user: userId, title: `AI Focus block: ${task.title}` });
    if (existingEvent) continue;

    // Find an empty slot
    let slotFound = false;
    for (const day of daysOfWeek) {
      if (slotFound) break;
      for (const slot of timeSlots) {
        const conflict = await CalendarEvent.findOne({ user: userId, day, timeSlot: slot });
        if (!conflict) {
          // Schedule the block!
          const newEvent = new CalendarEvent({
            user: userId,
            title: `AI Focus block: ${task.title}`,
            layerType: 'ai-block',
            day,
            timeSlot: slot,
            duration: task.duration || 45,
            description: `Automated focus session scheduled by ResQ AI for: ${task.title}.`
          });
          await newEvent.save();
          scheduledEvents.push(newEvent);
          slotFound = true;
          break;
        }
      }
    }
  }

  return scheduledEvents;
};
