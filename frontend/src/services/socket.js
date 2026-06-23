import { io } from 'socket.io-client';
import { useEffect } from 'react';

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  if (apiUrl.endsWith('/api')) {
    return apiUrl.slice(0, -4);
  }
  return apiUrl;
};

export const socket = io(getSocketUrl(), {
  auth: {
    token: localStorage.getItem('token') || ''
  },
  autoConnect: false
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
