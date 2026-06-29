import { io } from 'socket.io-client';
import { useEffect } from 'react';
import voicePersonality from './VoicePersonality.js';

import { SOCKET_URL } from '../config/apiConfig.js';


export const socket = io(SOCKET_URL, {
  auth: {
    token: localStorage.getItem('token') || ''
  },
  autoConnect: false
});

socket.on('connect', () => console.log('Socket connected:', socket.id));
socket.on('connect_error', (err) => console.error('Socket error:', err));

let notificationsBlocked = false;

window.addEventListener('resq:notifications-block', (e) => {
  notificationsBlocked = e.detail?.blocked ?? false;
});

socket.on('notification:new', (notification) => {
  if (notificationsBlocked) return; // Block during focus session
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('ResQ AI Alert', {
      body: typeof notification === 'string' ? notification : notification.message,
      icon: '/favicon.ico'
    });
  }
});

// ── Voice Plan Reminder ──────────────────────────────────────────────
// Fired by cron when it's time for a daily plan reminder
socket.on('voice_reminder', ({ audio, mimeType, message, planId }) => {
  if (notificationsBlocked) return;

  if (audio) {
    voicePersonality.playAudioBuffer(audio, mimeType, message).catch(() => {
      voicePersonality.speakFallback(message);
    });
  } else {
    voicePersonality.speakFallback(message);
  }

  // Show visual banner
  window.dispatchEvent(new CustomEvent('resq:plan-reminder', { detail: { message, planId } }));
});

// ── Plan Created (background generation complete) ────────────────────
socket.on('plan:created', ({ planId, topic, durationDays }) => {
  window.dispatchEvent(new CustomEvent('resq:plan-created', { detail: { planId, topic, durationDays } }));
});

// ── Plan Progress ────────────────────────────────────────────────────────
socket.on('plan_progress', ({ stage, message }) => {
  window.dispatchEvent(new CustomEvent('resq:plan-progress', { detail: { stage, message } }));
});

// ── Plan Error ────────────────────────────────────────────────────────
socket.on('plan:error', ({ message }) => {
  window.dispatchEvent(new CustomEvent('resq:plan-error', { detail: { message } }));
});

export const connectSocket = (token) => {
  if (socket) {
    socket.auth.token = token;
    if (!socket.connected) {
      socket.connect();
    }
  }
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect();
  }
};

export const useSocket = (eventName, callback) => {
  useEffect(() => {
    if (!socket) return;

    const token = localStorage.getItem('token');
    if (token && !socket.connected) {
      socket.auth.token = token;
      socket.connect();
    }

    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  }, [eventName, callback]);
};
