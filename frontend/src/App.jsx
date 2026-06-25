import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import PricingPage from './pages/PricingPage';
import GlobalVoiceAssistant from './components/Shared/GlobalVoiceAssistant';
import { wakeWordEngine } from './services/WakeWordEngine';
import { useAuthContext } from './context/AuthContext';
import { initPushNotifications } from './services/pushNotificationService';

function AppContent() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading } = useAuthContext();
  const [currentTab, setCurrentTab] = useState(() => {
    return localStorage.getItem('resq-current-tab') || 'dashboard';
  });

  useEffect(() => {
    localStorage.setItem('resq-current-tab', currentTab);
  }, [currentTab]);

  useEffect(() => {
    if (isAuthenticated && user) {
      wakeWordEngine.initialize(user);
      // Initialize web push notifications for native OS alerts
      initPushNotifications();
    } else {
      wakeWordEngine.destroy()
    }
  }, [isAuthenticated, user])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center font-sans text-white/50 text-xs font-bold uppercase tracking-widest">
        Loading Cognition Shield...
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route 
          path="/dashboard" 
          element={isAuthenticated ? <Dashboard currentTab={currentTab} setCurrentTab={setCurrentTab} /> : <Navigate to="/auth" replace />} 
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Routes>
      {isAuthenticated && user && (
        <GlobalVoiceAssistant 
          navigate={navigate} 
          setCurrentTab={setCurrentTab} 
        />
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

