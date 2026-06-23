import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, voice } from '../services/api.js';
import { wakeWordEngine } from '../services/WakeWordEngine.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user data on mount if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await auth.getMe();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (err) {
          console.error('[AuthContext] Session validation failed:', err);
          // Token is invalid/expired
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (token, userData) => {
    localStorage.setItem('token', token);
    if (userData?.theme) localStorage.setItem('resq-theme', userData.theme);
    if (userData?.plan) localStorage.setItem('resq-plan', userData.plan);

    try {
      const fetchedUser = await auth.getMe();
      setUser(fetchedUser);
      setIsAuthenticated(true);
    } catch (err) {
      console.warn('[AuthContext] Failed to fetch full profile details on login, using fallback:', err);
      setUser(userData);
      setIsAuthenticated(true);
    }
  };

  const logout = async () => {
    try {
      // Clear pending commands cache on backend while token is still in localStorage
      await voice.clearCache();
    } catch (err) {
      console.warn('[AuthContext] Failed to clear backend voice cache on logout:', err);
    }

    // Stop wake word engine, speech recognition, and speech synthesis
    wakeWordEngine.destroy();

    // Clear session storage
    localStorage.removeItem('token');
    localStorage.removeItem('resq-theme');
    localStorage.removeItem('resq-plan');

    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
