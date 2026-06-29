import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';
import MobileTopBar from '../components/Dashboard/MobileTopBar';
import MobileBottomNav from '../components/Dashboard/MobileBottomNav';
import DashboardHome from '../components/Dashboard/DashboardHome';
import TasksPage from '../components/Dashboard/TasksPage';
import CalendarPage from '../components/Dashboard/CalendarPage';
import GoalsPage from '../components/Dashboard/GoalsPage';
import HabitsPage from '../components/Dashboard/HabitsPage';
import VoiceAIPage from '../components/Dashboard/VoiceAIPage';
import FocusSessionPage from '../components/Dashboard/FocusSessionPage';
import SettingsPage from '../components/Dashboard/SettingsPage';
import NotificationsPage from '../components/Dashboard/NotificationsPage';
import SubscriptionPage from '../components/Dashboard/SubscriptionPage';
import PlansPage from '../components/Dashboard/PlansPage';
import ShieldPage from '../components/Dashboard/ShieldPage';
import voicePersonality from '../services/VoicePersonality.js';
import { tasks as apiTasks, habits as apiHabits } from '../services/api';
import { 
  Mic, 
  Bell, 
  Settings, 
  X, 
  LogOut,
  ChevronRight,
  Zap,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';
import LogoutModal from '../components/Shared/LogoutModal.jsx';
import PriorityResolutionModal from '../components/Shared/PriorityResolutionModal.jsx';

export default function Dashboard({ currentTab: propTab, setCurrentTab: propSetTab }) {
  const [localTab, setLocalTab] = useState('dashboard');
  const currentTab = propTab !== undefined ? propTab : localTab;
  const setCurrentTab = propSetTab || setLocalTab;
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Sync tab with URL search parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setCurrentTab(tab);
    }
  }, [location.search, setCurrentTab]);

  // Listen for CustomEvent('resq:navigate') → switch currentTab
  useEffect(() => {
    const handleNavigate = (e) => {
      const target = e.detail?.target || e.detail;
      if (target) {
        setCurrentTab(target);
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resq:navigate', handleNavigate);
    window.setCurrentTab = setCurrentTab;

    return () => {
      window.removeEventListener('resq:navigate', handleNavigate);
      window.setCurrentTab = null;
    };
  }, [setCurrentTab]);

  // Listen for plan:created → switch to plans tab and navigate to plan page
  useEffect(() => {
    const handlePlanCreated = (e) => {
      const { planId, topic } = e.detail || {};
      
      if (topic) {
        voicePersonality.speak(`Yes, I have completed generating your plan for ${topic}! Redirecting you to the roadmap now.`);
      } else {
        voicePersonality.speak("Yes, I have completed generating your plan! Redirecting you to the roadmap now.");
      }

      setCurrentTab('plans');
      if (planId) {
        // Navigate to the individual plan page after a short delay
        setTimeout(() => navigate(`/plans/${planId}`), 2200);
      }
    };
    window.addEventListener('resq:plan-created', handlePlanCreated);
    return () => window.removeEventListener('resq:plan-created', handlePlanCreated);
  }, [navigate, setCurrentTab]);

  // Listen for plan:error → show an alert
  useEffect(() => {
    const handlePlanError = (e) => {
      const msg = e.detail?.message || 'Plan generation failed. Please try again.';
      voicePersonality.speak("Sorry, plan generation failed. Please check the alert details.");
      alert(msg);
    };
    window.addEventListener('resq:plan-error', handlePlanError);
    return () => window.removeEventListener('resq:plan-error', handlePlanError);
  }, []);

  // Load and apply theme and plan states on mount
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      window.location.href = '/auth';
      return;
    }

    const savedTheme = localStorage.getItem('resq-theme') || 'dark';
    const savedPlan = localStorage.getItem('resq-plan') || 'free';
    
    const root = document.documentElement;
    
    root.classList.remove('light', 'matrix');
    if (savedTheme === 'light') {
      root.classList.add('light');
    } else if (savedTheme === 'matrix') {
      root.classList.add('matrix');
    }
    
    root.classList.remove('premium-active', 'free-active');
    if (savedPlan === 'premium') {
      root.classList.add('premium-active');
    } else {
      root.classList.add('free-active');
    }

    // Request native browser notification permissions
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileDrawerOpen]);

  // Shared Task State
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem('token')) return;

    const fetchData = async () => {
      try {
        const [fetchedTasks, fetchedHabits] = await Promise.all([
          apiTasks.getAll(),
          apiHabits.getAll()
        ]);
        setTasks(fetchedTasks || []);
        setHabits(fetchedHabits || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();

    const handleRefetchTasks = () => {
      apiTasks.getAll().then(data => setTasks(data || [])).catch(console.error);
    };
    
    const handleRefetchHabits = () => {
      apiHabits.getAll().then(data => setHabits(data || [])).catch(console.error);
    };

    const handleRefetchGoals = () => {
      // Goals are managed in GoalsPage.jsx — dispatch a navigation event to trigger refresh
      window.dispatchEvent(new CustomEvent('resq:goals-data-changed'));
    };

    window.addEventListener('resq:refetch-tasks', handleRefetchTasks);
    window.addEventListener('resq:refetch-habits', handleRefetchHabits);
    window.addEventListener('resq:refetch-goals', handleRefetchGoals);

    return () => {
      window.removeEventListener('resq:refetch-tasks', handleRefetchTasks);
      window.removeEventListener('resq:refetch-habits', handleRefetchHabits);
      window.removeEventListener('resq:refetch-goals', handleRefetchGoals);
    };
  }, []);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleHabit = (id) => {
    setHabits(habits.map(h => 
      h.id === id ? { ...h, completedToday: !h.completedToday, streak: !h.completedToday ? h.streak + 1 : Math.max(0, h.streak - 1) } : h
    ));
  };

  const handleTabChange = (tab) => {
    setCurrentTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardHome 
            tasks={tasks} 
            toggleTask={toggleTask} 
            habits={habits} 
            toggleHabit={toggleHabit} 
            setCurrentTab={setCurrentTab}
          />
        );
      case 'shield':
        return <ShieldPage />;
      case 'tasks':
        return (
          <TasksPage 
            tasks={tasks} 
            setTasks={setTasks} 
            toggleTask={toggleTask} 
            deleteTask={deleteTask}
          />
        );
      case 'calendar':
        return <CalendarPage tasks={tasks} />;
      case 'goals':
        return <GoalsPage />;
      case 'habits':
        return <HabitsPage />;
      case 'voice':
        return <VoiceAIPage setCurrentTab={setCurrentTab} />;
      case 'focus':
        return <FocusSessionPage />;
      case 'notifications':
        return <NotificationsPage />;
      case 'plans':
        return <PlansPage />;
      case 'settings':
        return <SettingsPage />;
      case 'subscription':
        return <SubscriptionPage setCurrentTab={setCurrentTab} />;
      default:
        return <DashboardHome tasks={tasks} toggleTask={toggleTask} habits={habits} toggleHabit={toggleHabit} setCurrentTab={setCurrentTab} />;
    }
  };

  const moreMenuItems = [
    { id: 'shield', label: 'ResQ Shield', icon: Shield },
    { id: 'focus', label: 'Focus Session', icon: Zap },
    { id: 'voice', label: 'Command & Ask', icon: Mic },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex bg-black text-white min-h-screen relative overflow-hidden bg-noise">
      {/* Desktop/Tablet Sidebar */}
      <Sidebar currentTab={currentTab} setCurrentTab={handleTabChange} />
      
      {/* Mobile Top Bar */}
      <MobileTopBar 
        currentTab={currentTab} 
        setCurrentTab={handleTabChange}
        onMenuOpen={() => setIsMobileDrawerOpen(true)}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 h-screen overflow-y-auto relative z-10 dashboard-main">
        {/* Top padding on mobile for top bar */}
        <div className="lg:hidden h-14" aria-hidden="true" />
        
        <div className="max-w-[1800px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
          {renderContent()}
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        onMoreOpen={() => setIsMobileDrawerOpen(true)}
      />

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex"
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm drawer-overlay" />
          
          {/* Drawer Panel */}
          <div
            className="relative ml-auto w-72 h-full bg-[#050505] border-l border-white/[0.06] flex flex-col animate-slide-in-right drawer-panel"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <span className="font-display font-black text-2xl tracking-tighter flex items-center">
                <span className="text-silver-gradient text-shine-sweep">Res</span>
                <span className="text-gold-sweep text-glow-gold">Q</span>
              </span>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 text-white/60 hover:text-white transition-colors"
                style={{ minHeight: 'auto' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Navigation — secondary tabs */}
            <nav className="flex-1 p-4 space-y-1">
              {moreMenuItems.map(({ id, label, icon: Icon }) => {
                const active = currentTab === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleTabChange(id)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-[#E5B842]/10 border border-[#E5B842]/20 text-[#E5B842]'
                        : 'border border-transparent text-white/60 hover:text-white hover:bg-white/[0.03]'
                    }`}
                    style={{ minHeight: 'auto' }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${active ? 'text-[#E5B842]' : 'text-white/50'}`} />
                      <span>{label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-white/30" />
                  </button>
                );
              })}
            </nav>

            {/* Drawer Footer — user profile + logout */}
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center gap-3 p-3 mb-3">
                {user?.picture ? (
                  <img src={user.picture} alt="Profile" className="w-9 h-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-b from-white to-neutral-300 text-black flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                    {user?.name ? user.name.substring(0, 2) : 'FK'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{user?.name || 'User'}</p>
                  <p className="text-xs text-white/50 truncate">Developer Account</p>
                </div>
              </div>
              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold uppercase tracking-wider text-white/60 hover:text-red-400 hover:bg-red-500/5 border border-transparent hover:border-red-500/10 transition-all cursor-pointer"
                style={{ minHeight: 'auto' }}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={async () => {
          await logout();
          navigate('/');
        }}
      />
      
      <PriorityResolutionModal />
    </div>
  );
}
