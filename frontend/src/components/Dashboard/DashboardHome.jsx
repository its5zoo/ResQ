import { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Circle,
  Calendar,
  ChevronRight,
  TrendingUp,
  Inbox,
  Zap,
  Mic,
  MousePointerClick
} from 'lucide-react';
import { ai, tasks as apiTasks, habits as apiHabits, calendar as apiCalendar } from '../../services/api.js';
import { useSocket } from '../../services/socket.js';

export default function DashboardHome({ setCurrentTab }) {
  const [localTasks, setLocalTasks] = useState([]);
  const [summary, setSummary] = useState('');
  const [localHabits, setLocalHabits] = useState([]);
  const [localEvents, setLocalEvents] = useState([]);
  const [aiPriorityItems, setAiPriorityItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [completingItems, setCompletingItems] = useState([]);
  const [notificationsBlocked, setNotificationsBlocked] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const [tasksData, summaryData, habitsData, eventsData, priorityData] = await Promise.all([
        apiTasks.getAll().catch(() => []),
        ai.getDailySummary().catch(() => ({ summary: 'No summary available today.' })),
        apiHabits.getAll().catch(() => []),
        apiCalendar.getAll().catch(() => []),
        ai.getGlobalPriority().catch(() => [])
      ]);
      
      setLocalTasks(tasksData || []);
      setSummary(summaryData?.summary || 'No summary available today.');
      setLocalHabits(habitsData || []);
      setLocalEvents(eventsData || []);
      setAiPriorityItems(Array.isArray(priorityData) ? priorityData : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshAISummary = async () => {
    try {
      const summaryData = await ai.getDailySummary().catch(() => ({ summary: 'No summary available today.' }));
      setSummary(summaryData?.summary || 'No summary available today.');
    } catch (err) {
      console.error('Error refreshing summary:', err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchDashboardData();
    };
    load();

    // Hourly update for AI summary
    const intervalId = setInterval(() => {
      refreshAISummary();
    }, 60 * 60 * 1000); // 1 hour in ms

    return () => clearInterval(intervalId);
  }, []);

  // Listen to 'ai:priority-update' to re-render tasks
  useSocket('ai:priority-update', () => {
    console.log('[Socket] ai:priority-update received');
    fetchDashboardData();
  });

  // Listen to 'notification:new' to show toast (blocked during focus sessions)
  useSocket('notification:new', (notification) => {
    if (notificationsBlocked) return;
    console.log('[Socket] notification:new received:', notification);
    setToast(notification);
    setTimeout(() => {
      setToast(null);
    }, 5000);
  });

  // Listen for focus session notification block
  useEffect(() => {
    const handleBlock = (e) => setNotificationsBlocked(e.detail?.blocked ?? false);
    window.addEventListener('resq:notifications-block', handleBlock);
    return () => window.removeEventListener('resq:notifications-block', handleBlock);
  }, []);

  const handleToggleTask = async (id) => {
    try {
      const task = localTasks.find(t => t._id === id);
      if (!task) return;
      
      // Animate out of High Priority Stack
      setCompletingItems(prev => [...prev, id]);
      setTimeout(() => {
        setAiPriorityItems(prev => prev.filter(i => i.id !== id));
      }, 300);

      // Optimistic UI Update
      setLocalTasks(prev => prev.map(t => t._id === id ? { ...t, completed: !task.completed } : t));
      
      const updated = await apiTasks.update(id, { completed: !task.completed });
      setLocalTasks(prev => prev.map(t => t._id === id ? updated : t));
      refreshAISummary();
    } catch (err) {
      console.error('Error toggling task:', err);
      // Revert optimistic update
      setLocalTasks(prev => prev.map(t => t._id === id ? { ...t, completed: !t.completed } : t));
      setCompletingItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const handleToggleHabit = async (id) => {
    try {
      // Animate out of High Priority Stack
      setCompletingItems(prev => [...prev, id]);
      setTimeout(() => {
        setAiPriorityItems(prev => prev.filter(i => i.id !== id));
      }, 300);

      const updated = await apiHabits.markComplete(id);
      setLocalHabits(prev => prev.map(h => h._id === id ? updated : h));
      refreshAISummary();
    } catch (err) {
      console.error('Error toggling habit:', err);
      setCompletingItems(prev => prev.filter(itemId => itemId !== id));
    }
  };

  const pendingTasks = localTasks.filter(t => !t.completed);
  
  const pendingTasksToday = pendingTasks.filter(t => {
    if (!t.dueDate) return true;
    const d = new Date(t.dueDate);
    const today = new Date();
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear();
  });
  
  const calculateDailyCompletion = () => {
    const todayStr = new Date().toDateString();
    const now = new Date();
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const currentDayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][now.getDay()];

    let expectedCount = 0;
    let completedCount = 0;

    // Daily Tasks
    localTasks.forEach(t => {
      const tDate = new Date(t.dueDate || t.createdAt || now);
      const isDueTodayOrEarlier = tDate <= endOfToday;
      const isDueExactlyToday = tDate.toDateString() === todayStr;
      
      if (!t.completed && isDueTodayOrEarlier) {
        expectedCount++;
      } else if (t.completed && isDueExactlyToday) {
        expectedCount++;
        completedCount++;
      }
    });

    // Daily Habits
    const todayHabits = localHabits.filter(h => h.targetDays?.includes(currentDayName));
    expectedCount += todayHabits.length;
    completedCount += todayHabits.filter(h => h.completions?.some(c => new Date(c.date).toDateString() === todayStr && c.completed)).length;

    if (expectedCount === 0) return 0; // or 100, but 0 is standard if nothing is scheduled
    return Math.round((completedCount / expectedCount) * 100);
  };

  const completedRate = calculateDailyCompletion();

  const hasCritical = pendingTasks.some(t => t.urgency >= 9);
  const riskText = hasCritical ? 'URGENT HAZARD' : pendingTasks.length > 0 ? 'MODERATE' : 'OPTIMIZED';

  // Calculate habit streak: only increments when ALL scheduled habits for a day are completed
  const calculatePerfectStreak = (habits) => {
    if (!habits || habits.length === 0) return 0;
    
    let streak = 0;
    const now = new Date();
    
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
      const dateString = d.toDateString();
      
      const scheduledHabits = habits.filter(h => h.targetDays?.includes(dayName));
      if (scheduledHabits.length === 0) continue; // No habits scheduled this day
      
      let allCompleted = true;
      for (const habit of scheduledHabits) {
        const completedOnDay = habit.completions?.some(c => new Date(c.date).toDateString() === dateString && c.completed);
        if (!completedOnDay) {
          allCompleted = false;
          break;
        }
      }
      
      if (allCompleted) {
        streak++;
      } else {
        // If it's today (i=0), they still have time, so don't break the streak, just don't increment it.
        // If it's a past day (i>0), the streak is definitively broken.
        if (i > 0) break;
      }
    }
    return streak;
  };

  const totalStreak = calculatePerfectStreak(localHabits);

  const now = new Date();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Format events to display cleanly, filter for upcoming today, and sort chronologically
  const formattedEvents = [...localEvents]
    .filter(e => new Date(e.endTime) > now && new Date(e.startTime) <= endOfToday)
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .map(e => {
      const start = new Date(e.startTime);
      let timeString = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      let dateString = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      let durationMin = Math.round((new Date(e.endTime) - start) / 60000);
      return {
        time: timeString,
        date: dateString,
        title: e.title,
        duration: `${durationMin}m`,
        type: e.type
      };
    }).slice(0, 5);

  const priorityStackItems = aiPriorityItems
    .filter(item => {
      // Filter out events that have passed
      if (item.type === 'event') {
        const localEvent = localEvents.find(e => e._id === item.id);
        if (localEvent) {
          const end = new Date(localEvent.endTime);
          if (end < now) return false;
        }
      }
      
      // Filter out tasks that have passed (as per user request: only upcoming tasks/habits after current time)
      if (item.type === 'task') {
        const localTask = localTasks.find(t => t._id === item.id);
        if (localTask && localTask.dueDate) {
          const due = new Date(localTask.dueDate);
          // Only filter out if it was due TODAY but the time has passed.
          // (If it was due yesterday, maybe they still want to see it? Or filter all past?)
          // User said "jo abi ke time ke baad hai vo aan chaiye" -> strictly upcoming.
          if (due < now) return false;
        }
      }
      return true;
    })
    .map(item => {
      let timeString = null;
      if (item.type === 'event') {
        const localEvent = localEvents.find(e => e._id === item.id);
        if (localEvent) {
          const start = new Date(localEvent.startTime);
          const end = new Date(localEvent.endTime);
          const formatTime = (d) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          timeString = `${formatTime(start)} - ${formatTime(end)}`;
        }
      }

      return {
        id: item.id,
        type: item.type,
        title: item.title,
        priorityScore: item.priorityScore || 0,
        reason: item.reason || 'AI Prioritized',
        label: item.type === 'task' ? 'Task' : item.type === 'event' ? 'Event' : item.type === 'habit' ? 'Habit' : 'Goal',
        icon: item.type === 'event' ? <Calendar className="w-5 h-5" /> : item.type === 'habit' ? <Flame className="w-5 h-5" /> : <Circle className="w-5 h-5" />,
        rankText: `Score ${item.priorityScore || 0}/100`,
        timeString,
        action: () => {
          if (item.type === 'task') handleToggleTask(item.id);
          else if (item.type === 'habit') handleToggleHabit(item.id);
          else setCurrentTab(item.type === 'event' ? 'calendar' : 'goals');
        },
        urgency: (item.priorityScore || 50) / 10
      };
    });

  const todayAgendaItems = (() => {
    let items = [];
    formattedEvents.forEach(evt => items.push({ ...evt, isHabit: false }));
    
    localHabits.forEach(h => {
      const doneToday = h.completions?.some(c => new Date(c.date).toDateString() === new Date().toDateString() && c.completed);
      if (!doneToday) {
        items.push({
          title: h.name,
          time: 'Daily Habit',
          duration: `${h.streak || 0} Day Streak`,
          date: 'Today',
          isHabit: true,
          id: h._id
        });
      }
    });

    return items;
  })();

  return (
    <div className="space-y-6 lg:space-y-10 animate-fade-in py-2 lg:py-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 right-4 lg:left-auto lg:right-6 z-50 max-w-sm lg:max-w-sm mx-auto lg:mx-0 p-4 lg:p-5 bg-[#0a0a0a] border border-[#E5B842]/30 rounded-2xl shadow-[0_4px_30px_rgba(229,184,66,0.15)] flex items-start gap-3 lg:gap-4 animate-slide-in font-sans">
          <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-[#E5B842] animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-sm font-bold text-white uppercase tracking-wider">{toast.title || 'New System Alert'}</h5>
            <p className="text-xs lg:text-sm text-white/60 mt-1 leading-relaxed">{toast.message || ''}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-white/50 hover:text-white/70 text-sm shrink-0 cursor-pointer" style={{ minHeight: 'auto' }}>✕</button>
        </div>
      )}
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5 lg:pb-8 font-sans">
        <div>
          <span className="text-xs lg:text-sm font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-1.5 lg:mb-2">WORKSPACE HUB</span>
          <h2 className="text-2xl lg:text-3xl font-display font-black tracking-tight leading-tight">
            <span className="text-white">Welcome back! </span>
            <span className="text-white/70">Here's your status.</span>
          </h2>
        </div>

      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 font-sans">
        {/* Tasks Today */}
        <div className="p-4 lg:p-6 bg-[#090909] border border-white/[0.04] rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300 layered-shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-white/70 block mb-1">Tasks Today</span>
              <span className="text-2xl font-bold text-white">{pendingTasksToday.length} Pending</span>
            </div>
            <Inbox className="w-6 h-6 text-white/50 group-hover:text-white/70 transition-colors" />
          </div>
          <button 
            onClick={() => setCurrentTab('tasks')}
            className="text-sm font-semibold text-[#E5B842] hover:text-[#FFF2CC] transition-colors flex items-center gap-1 cursor-pointer self-start"
          >
            View all tasks →
          </button>
        </div>

        {/* Completion Rate */}
        <div className="p-4 lg:p-6 bg-[#090909] border border-white/[0.04] rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300 layered-shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-white/70 block mb-1">Completion Rate</span>
              <span className="text-2xl font-bold text-white">{completedRate}%</span>
            </div>
            <TrendingUp className="w-6 h-6 text-white/50 group-hover:text-white/70 transition-colors" />
          </div>
          <span className="text-sm font-semibold text-[#E5B842]">
            Keep going! 💪
          </span>
        </div>

        {/* Deadline Risk */}
        <div className="p-4 lg:p-6 bg-[#090909] border border-[#E5B842]/30 rounded-2xl flex flex-col justify-between hover:border-[#E5B842]/50 shadow-[0_0_15px_rgba(229,184,66,0.04)] transition-all duration-300 layered-shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-white/70 block mb-1">Deadline Risk</span>
              <span className="text-2xl font-bold text-white">{riskText}</span>
            </div>
            <AlertTriangle className="w-6 h-6 text-[#E5B842]" />
          </div>
          <div className="text-xs font-medium text-white/40 tracking-wide">
            Stay focused and keep crushing your goals.
          </div>
        </div>

        {/* Habit Streak */}
        <div className="p-4 lg:p-6 bg-[#090909] border border-white/[0.04] rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300 layered-shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-sm font-bold uppercase tracking-wider text-white/70 block mb-1">Habit Streak</span>
              <span className="text-2xl font-bold text-white">{totalStreak} Days</span>
            </div>
            <Flame className="w-6 h-6 text-white/50 group-hover:text-white/70 transition-colors" />
          </div>
          <span className="text-sm font-semibold text-[#E5B842]">
            Keep it up! 🔥
          </span>
        </div>
      </div>

      {/* Main content grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start font-sans">
        
        {/* Left Column: AI recommend & Priority Tasks */}
        <div className="lg:col-span-8 space-y-5 lg:space-y-8">
          
          {/* AI Advisor Panel */}
          <div className="p-5 lg:p-8 bg-white/[0.01] border border-white/10 rounded-3xl relative overflow-hidden layered-shadow-lg card-shine-sweep">
            <div className="absolute top-1/2 -translate-y-1/2 right-12 opacity-15 hidden md:block select-none pointer-events-none">
              <div className="relative flex items-center justify-center">
                <Cpu className="w-24 h-24 text-[#E5B842]" />
                <span className="absolute text-[#E5B842] font-display font-black text-xl tracking-tight">AI</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-[#E5B842]" />
              <span className="text-sm font-bold text-white uppercase tracking-wider font-display">AI Priority Advisor</span>
            </div>

            <div className="min-h-[80px]">
              {loading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="h-4 bg-white/10 rounded w-5/6"></div>
                </div>
              ) : (
                <p className="text-sm text-white/70 leading-relaxed font-normal mb-6 tracking-normal">
                  {summary ? `"${summary}"` : `"Analyze your tasks and schedule with the Advisor to construct plans."`}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setCurrentTab('calendar')}
                className="px-5 py-3 bg-[#E5B842] hover:bg-[#FFF2CC] text-white hover:text-black text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer font-sans active:scale-[0.98] shadow-md shadow-[#E5B842]/10"
              >
                <Calendar className="w-4 h-4" /> Open Calendar
              </button>
              <button 
                onClick={() => setCurrentTab('voice')}
                className="px-5 py-3 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer font-sans bg-white/5 html-light-btn-white"
              >
                Ask Voice AI Assistant
              </button>
            </div>
          </div>

          {/* Priority Task Stack list */}
          <div className="p-5 lg:p-8 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-lg">
            <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white tracking-wider uppercase">High Priority Stack</span>
                <span className="text-sm bg-[#E5B842]/5 text-[#E5B842] border border-[#E5B842]/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">AI sorted</span>
              </div>
              <button 
                onClick={() => setCurrentTab('tasks')}
                className="text-sm font-semibold text-[#E5B842] hover:text-[#FFF2CC] uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
              >
                Manage Tasks →
              </button>
            </div>

            {/* List */}
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  {[1, 2, 3].map(n => (
                    <div key={n} className="h-16 bg-white/5 rounded-2xl"></div>
                  ))}
                </div>
              ) : priorityStackItems.length > 0 ? (
                priorityStackItems.map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => item.action()}
                    className={`p-5 bg-black border border-white/[0.03] rounded-2xl transition-all duration-300 cursor-pointer select-none ${
                      completingItems.includes(item.id) 
                        ? 'opacity-0 scale-95 translate-x-8 pointer-events-none' 
                        : 'opacity-100 scale-100 translate-x-0 hover:border-white/10 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 min-w-0 pt-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            item.action();
                          }}
                          className="text-white/60 hover:text-[#E5B842] transition-colors focus:outline-hidden cursor-pointer mt-0.5"
                        >
                          {item.icon}
                        </button>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-white/90 truncate">
                            {item.title}
                          </span>
                          <span className="text-xs text-[#E5B842]/80 mt-1 leading-snug">
                            <Sparkles className="w-3 h-3 inline mr-1 -mt-0.5" />
                            {item.reason}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${item.type === 'event' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : item.type === 'habit' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : item.type === 'goal' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-[#E5B842]/5 border border-[#E5B842]/20 text-[#E5B842]'}`}>
                          {item.rankText}
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs font-bold uppercase tracking-widest text-white/40 flex items-center gap-1">
                            {item.type === 'habit' ? <Flame className="w-3 h-3" /> : <Calendar className="w-3 h-3" />} {item.label}
                          </span>
                          {item.timeString && (
                            <span className="text-[10px] font-bold text-white/30 tracking-wider">
                              {item.timeString}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Task Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${item.type === 'event' ? 'bg-gradient-to-r from-blue-500 to-blue-400' : item.type === 'habit' ? 'bg-gradient-to-r from-orange-500 to-orange-400' : 'bg-gradient-to-r from-[#E5B842] to-[#C97D2E]'}`} style={{ width: `${item.urgency * 10}%` }}></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/30 mx-auto mb-3" />
                  <p className="text-sm text-white/35 font-light">Aaj koi task nahi hai, kal update hoga.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Mini Calendar & Habit check-in */}
        <div className="lg:col-span-4 space-y-5 lg:space-y-8">
          
          {/* Mini Calendar agenda */}
          <div className="p-5 lg:p-8 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-sm font-bold uppercase tracking-wider text-white/70 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E5B842]" /> Today's Focus Slots
              </h4>
            </div>
            
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-10 bg-white/5 rounded-xl"></div>
                  <div className="h-10 bg-white/5 rounded-xl"></div>
                </div>
              ) : todayAgendaItems.length > 0 ? (
                todayAgendaItems.map((evt, idx) => (
                  <div key={idx} className={`flex gap-4 items-start relative pl-4 border-l-2 py-1 ${evt.isHabit ? 'border-orange-500/20' : 'border-[#E5B842]/20'}`}>
                    <div className={`absolute top-[10px] -left-[6px] w-2.5 h-2.5 rounded-full border-2 border-black ${evt.isHabit ? 'bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]' : 'bg-[#E5B842] shadow-[0_0_6px_rgba(229,184,66,0.6)]'}`}></div>
                    <div>
                      <span className="text-sm text-white/70 font-bold block mb-0.5">
                        <span className={`${evt.isHabit ? 'text-orange-400' : 'text-[#E5B842]/70'} mr-1.5`}>{evt.date}</span>
                        {evt.time} ({evt.duration})
                      </span>
                      <h5 className="text-sm font-semibold text-white/80 flex items-center gap-1.5">
                        {evt.title} {evt.isHabit && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                      </h5>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-white/60 text-center py-6">No scheduled focus blocks or habits for today.</p>
              )}
            </div>
          </div>

          {/* Habits Panel check-in */}
          <div className="p-5 lg:p-8 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-lg">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white/70 mb-6 flex items-center justify-between font-display">
              <span>Daily Habits</span>
              <button 
                onClick={() => setCurrentTab('habits')}
                className="text-sm font-bold text-[#E5B842] hover:text-[#FFF2CC] tracking-wider uppercase cursor-pointer"
              >
                Configure
              </button>
            </h4>

            <div className="space-y-5">
              {loading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-14 bg-white/5 rounded-2xl"></div>
                  <div className="h-14 bg-white/5 rounded-2xl"></div>
                </div>
              ) : localHabits.length > 0 ? (
                localHabits.slice(0, 3).map((habit) => {
                  const today = new Date().setHours(0, 0, 0, 0);
                  const isCompletedToday = habit.completions?.some(c => {
                    const compDate = new Date(c.date).setHours(0, 0, 0, 0);
                    return compDate === today && c.completed;
                  });

                  return (
                    <div key={habit._id} className="space-y-2.5">
                      <div className="flex items-center justify-between p-4 bg-black border border-white/[0.03] rounded-2xl">
                        <div className="flex items-center gap-3 min-w-0">
                          <button 
                            onClick={() => handleToggleHabit(habit._id)}
                            className="focus:outline-hidden cursor-pointer"
                          >
                            {isCompletedToday ? (
                              <CheckCircle2 className="w-4.5 h-4.5 text-[#E5B842]" />
                            ) : (
                              <Circle className="w-4.5 h-4.5 text-white/50 hover:text-white/70" />
                            )}
                          </button>
                          <span className={`text-sm font-medium truncate ${isCompletedToday ? 'line-through text-white/60' : 'text-white/70'}`}>
                            {habit.name}
                          </span>
                        </div>
                        <span className="text-sm text-[#E5B842] font-bold shrink-0">🔥 {habit.streak || 0}d</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-white/60 text-center py-6">No habits configured yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
