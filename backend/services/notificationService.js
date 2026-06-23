import Notification from '../models/Notification.js';

export const createNotification = async (userId, title, message, type = 'info') => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
