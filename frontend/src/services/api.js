import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// If response status is 401, clear token and redirect to /auth (unless already on auth page)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      if (!window.location.pathname.startsWith('/auth')) {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

const handleRequestError = (error) => {
  console.error('API Request Error:', error.response?.data || error.message);
  throw error.response?.data || error;
};

export const auth = {
  register: async (name, email, password) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
};

export const tasks = {
  getAll: async () => {
    try {
      const response = await api.get('/tasks');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  create: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  update: async (id, taskData) => {
    try {
      const response = await api.patch(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  reprioritize: async () => {
    try {
      const response = await api.post('/tasks/reprioritize');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
};

export const calendar = {
  getAll: async () => {
    try {
      const response = await api.get('/calendar');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  create: async (eventData) => {
    try {
      const response = await api.post('/calendar', eventData);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  update: async (id, eventData) => {
    try {
      const response = await api.patch(`/calendar/${id}`, eventData);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/calendar/${id}`);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  autoSchedule: async () => {
    try {
      const response = await api.post('/calendar/auto-schedule');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
};

export const habits = {
  getAll: async () => {
    try {
      const response = await api.get('/habits');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  create: async (habitData) => {
    try {
      const response = await api.post('/habits', habitData);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  markComplete: async (id) => {
    try {
      const response = await api.patch(`/habits/${id}/complete`);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/habits/${id}`);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
};

export const goals = {
  getAll: async () => {
    try {
      const response = await api.get('/goals');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  create: async (goalData) => {
    try {
      const response = await api.post('/goals', goalData);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  update: async (id, goalData) => {
    try {
      const response = await api.patch(`/goals/${id}`, goalData);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  delete: async (id) => {
    try {
      const response = await api.delete(`/goals/${id}`);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
};

export const notifications = {
  getAll: async () => {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  markRead: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  clearRead: async () => {
    try {
      const response = await api.delete('/notifications/clear');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
};

export const ai = {
  getDailySummary: async () => {
    try {
      const response = await api.get('/ai/daily-summary');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  ask: async (question) => {
    try {
      const response = await api.post('/ai/ask', { question });
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  getGlobalPriority: async () => {
    try {
      const response = await api.get('/ai/global-priority');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
};

export const voice = {
  sendCommand: async (transcript) => {
    try {
      const response = await api.post('/voice/command', { transcript });
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  clearCache: async () => {
    try {
      const response = await api.post('/voice/clear-cache');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  getUsage: async () => {
    try {
      const response = await api.get('/voice/usage');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
};

export const settings = {
  updateTheme: async (theme) => {
    try {
      const response = await api.patch('/settings/theme', { theme });
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  updateFontSize: async (fontSize) => {
    try {
      const response = await api.patch('/settings/font-size', { fontSize });
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  updatePlan: async (plan) => {
    try {
      const response = await api.patch('/settings/plan', { plan });
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  updateWorkingHours: async (start, end) => {
    try {
      const response = await api.patch('/settings/working-hours', { start, end });
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  updateGoogleCalendarDefaultIntegrated: async (googleCalendarDefaultIntegrated) => {
    try {
      const response = await api.patch('/settings/google-default-integrated', { googleCalendarDefaultIntegrated });
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  updateAiVoice: async (aiVoiceEnabled) => {
    try {
      const response = await api.patch('/settings/ai-voice', { aiVoiceEnabled });
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  updateVoiceSettings: async (settingsData) => {
    try {
      const response = await api.patch('/settings/voice-ai', settingsData);
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
};

export const google = {
  getAuthUrl: async () => {
    try {
      const response = await api.get('/google/auth-url');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  getLoginUrl: async () => {
    try {
      const response = await api.get('/google/login-url');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  sync: async () => {
    try {
      const response = await api.post('/google/sync');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  },
  disconnect: async () => {
    try {
      const response = await api.post('/google/disconnect');
      return response.data;
    } catch (error) {
      return handleRequestError(error);
    }
  }
};
