/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, voice, subscription as subscriptionApi } from '../services/api.js';
import { wakeWordEngine } from '../services/WakeWordEngine.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Subscription state
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);
  const [isPremiumActive, setIsPremiumActive] = useState(false);

  /** Fetch and cache the latest subscription status from the backend.
   * Also re-fetches the full user profile so voiceAI limits are updated instantly. */
  const refreshSubscription = useCallback(async () => {
    try {
      const [status, freshUser] = await Promise.all([
        subscriptionApi.getStatus(),
        auth.getMe()
      ]);
      setSubscriptionStatus(status);
      setIsPremiumActive(status.isPremiumActive || false);
      // Update the full user object so voiceAI limits/plan changes take effect immediately
      if (freshUser) {
        setUser(freshUser);
        setIsPremiumActive(freshUser.isPremiumActive || false);
        // Update local plan cache
        if (freshUser.plan) localStorage.setItem('resq-plan', freshUser.plan);
        // Sync the WakeWordEngine with the fresh premium status
        wakeWordEngine.refreshState(freshUser);
      }
    } catch (err) {
      console.warn('[AuthContext] Failed to refresh subscription status:', err);
    }
  }, []);

  // Load user data on mount if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await auth.getMe();
          setUser(userData);
          setIsAuthenticated(true);
          // isPremiumActive comes directly from the /me response (includes virtual)
          setIsPremiumActive(userData.isPremiumActive || false);
        } catch (err) {
          console.error('[AuthContext] Session validation failed:', err);
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
      setIsPremiumActive(fetchedUser.isPremiumActive || false);
    } catch (err) {
      console.warn('[AuthContext] Failed to fetch full profile details on login, using fallback:', err);
      setUser(userData);
      setIsAuthenticated(true);
      setIsPremiumActive(userData?.isPremiumActive || false);
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
    setSubscriptionStatus(null);
    setIsPremiumActive(false);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      loading,
      login,
      logout,
      setUser,
      // Subscription
      subscriptionStatus,
      isPremiumActive,
      refreshSubscription
    }}>
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
