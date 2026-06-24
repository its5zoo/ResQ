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
  Inbox
} from 'lucide-react';
import { ai, tasks as apiTasks, habits as apiHabits, calendar as apiCalendar } from '../../services/api.js';
import { useSocket } from '../../services/socket.js';

export default function DashboardHome({ setCurrentTab }) {
  const [localTasks, setLocalTasks] = useState([]);
  const [summary, setSummary] = useState('');
  const [localHabits, setLocalHabits] = useState([]);
  const [localEvents, setLocalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const [tasksData, summaryData, habitsData, eventsData] = await Promise.all([
        apiTasks.getAll().catch(() => []),
        ai.getDailySummary().catch(() => ({ summary: 'No summary available today.' })),
        apiHabits.getAll().catch(() => []),
        apiCalendar.getAll().catch(() => [])
      ]);
      
      setLocalTasks(tasksData || []);
      setSummary(summaryData?.summary || 'No summary available today.');
      setLocalHabits(habitsData || []);
      setLocalEvents(eventsData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchDashboardData();
    };
    load();
  }, []);

  // Listen to 'ai:priority-update' to re-render tasks
  useSocket('ai:priority-update', () => {
    console.log('[Socket] ai:priority-update received');
    apiTasks.getAll().then(data => {
      setLocalTasks(data || []);
    });
  });

  // Listen to 'notification:new' to show toast
  useSocket('notification:new', (notification) => {
    console.log('[Socket] notification:new received:', notification);
    setToast(notification);
    setTimeout(() => {
      setToast(null);
    }, 5000);
  });

  const handleToggleTask = async (id) => {
    try {
      const task = localTasks.find(t => t._id === id);
      if (!task) return;
      const updated = await apiTasks.update(id, { completed: !task.completed });
      setLocalTasks(prev => prev.map(t => t._id === id ? updated : t));
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleToggleHabit = async (id) => {
    try {
      const updated = await apiHabits.markComplete(id);
      setLocalHabits(prev => prev.map(h => h._id === id ? updated : h));
    } catch (err) {
      console.error('Error toggling habit:', err);
    }
  };

  const pendingTasks = localTasks.filter(t => !t.completed);
  const completedTasks = localTasks.filter(t => t.completed);
  const completedRate = localTasks.length > 0 ? Math.round((completedTasks.length / localTasks.length) * 100) : 0;


  const hasCritical = pendingTasks.some(t => t.urgency >= 9);
  const riskText = hasCritical ? 'URGENT HAZARD' : pendingTasks.length > 0 ? 'MODERATE' : 'OPTIMIZED';

  // Calculate habit streak summation or average
  const totalStreak = localHabits.reduce((acc, h) => acc + (h.streak || 0), 0);

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

  const priorityStackItems = (() => {
    let items = [];
    const todayStr = new Date().toDateString();

    pendingTasks.forEach(t => {
      const isToday = t.dueDate && new Date(t.dueDate).toDateString() === todayStr;
      if (isToday || t.urgency >= 8) {
        items.push({
          id: t._id,
          type: 'task',
          title: t.title,
          priorityScore: (t.urgency || 5) * 10 + (isToday ? 50 : 0) - (t.aiPriorityRank || 0),
          label: 'Task',
          icon: <Circle className="w-5 h-5" />,
          meta: isToday ? 'Today' : (t.dueDate ? new Date(t.dueDate).toLocaleDateString() : ''),
          rankText: `AI Rank ${t.aiPriorityRank || 'N/A'}`,
          action: () => handleToggleTask(t._id),
          urgency: t.urgency || 5
        });
      }
    });

    localEvents.forEach(e => {
      if (new Date(e.endTime) > now && new Date(e.startTime) <= endOfToday) {
        items.push({
          id: e._id || e.title,
          type: 'event',
          title: e.title,
          priorityScore: 100, // Top priority for today's events
          label: 'Event',
          icon: <Calendar className="w-5 h-5" />,
          meta: new Date(e.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          rankText: `Priority Event`,
          action: () => setCurrentTab('calendar'),
          urgency: 10
        });
      }
    });

    localHabits.forEach(h => {
      const doneToday = h.completions?.some(c => new Date(c.date).toDateString() === todayStr && c.completed);
      if (!doneToday) {
        items.push({
          id: h._id,
          type: 'habit',
          title: h.name,
          priorityScore: 80,
          label: 'Daily Habit',
          icon: <Flame className="w-5 h-5" />,
          meta: `${h.streak || 0} Day Streak`,
          rankText: `Habit`,
          action: () => handleToggleHabit(h._id),
          urgency: 8
        });
      }
    });

    return items.sort((a, b) => b.priorityScore - a.priorityScore).slice(0, 4);
  })();

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
    <div className="space-y-10 animate-fade-in py-6">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm p-5 bg-[#0a0a0a] border border-[#E5B842]/30 rounded-2xl shadow-[0_4px_30px_rgba(229,184,66,0.15)] flex items-start gap-4 animate-slide-in font-sans">
          <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-[#E5B842] animate-pulse" />
          </div>
          <div className="flex-1">
            <h5 className="text-xs font-bold text-white uppercase tracking-wider">{toast.title || 'New System Alert'}</h5>
            <p className="text-xs text-white/60 mt-1 leading-relaxed">{toast.message || ''}</p>
          </div>
          <button onClick={() => setToast(null)} className="text-white/20 hover:text-white/40 text-xs shrink-0 cursor-pointer">✕</button>
        </div>
      )}
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-8 font-sans">
        <div>
          <span className="text-xs font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-2">WORKSPACE HUB</span>
          <h2 className="text-3xl font-display font-black tracking-tight leading-tight">
            <span className="text-white">Welcome back, Faizaan! </span>
            <span className="text-white/40">Here's your status.</span>
          </h2>
        </div>

      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
        {/* Tasks Today */}
        <div className="p-6 bg-[#090909] border border-white/[0.04] rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300 layered-shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Tasks Today</span>
              <span className="text-2xl font-bold text-white">{pendingTasks.length} Pending</span>
            </div>
            <Inbox className="w-6 h-6 text-white/20 group-hover:text-white/40 transition-colors" />
          </div>
          <button 
            onClick={() => setCurrentTab('tasks')}
            className="text-xs font-semibold text-[#E5B842] hover:text-[#FFF2CC] transition-colors flex items-center gap-1 cursor-pointer self-start"
          >
            View all tasks →
          </button>
        </div>

        {/* Completion Rate */}
        <div className="p-6 bg-[#090909] border border-white/[0.04] rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300 layered-shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Completion Rate</span>
              <span className="text-2xl font-bold text-white">{completedRate}%</span>
            </div>
            <TrendingUp className="w-6 h-6 text-white/20 group-hover:text-white/40 transition-colors" />
          </div>
          <span className="text-xs font-semibold text-[#E5B842]">
            Keep going! 💪
          </span>
        </div>

        {/* Deadline Risk */}
        <div className="p-6 bg-[#090909] border border-[#E5B842]/30 rounded-2xl flex flex-col justify-between hover:border-[#E5B842]/50 shadow-[0_0_15px_rgba(229,184,66,0.04)] transition-all duration-300 layered-shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Deadline Risk</span>
              <span className="text-2xl font-bold text-white">{riskText}</span>
            </div>
            <AlertTriangle className="w-6 h-6 text-[#E5B842]" />
          </div>
          <button 
            onClick={() => setCurrentTab('tasks')}
            className="text-xs font-semibold text-[#E5B842] hover:text-[#FFF2CC] transition-colors flex items-center gap-1 cursor-pointer self-start"
          >
            Review now →
          </button>
        </div>

        {/* Habit Streak */}
        <div className="p-6 bg-[#090909] border border-white/[0.04] rounded-2xl flex flex-col justify-between hover:border-white/10 transition-all duration-300 layered-shadow-lg relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 block mb-1">Habit Streak</span>
              <span className="text-2xl font-bold text-white">{totalStreak} Days</span>
            </div>
            <Flame className="w-6 h-6 text-white/20 group-hover:text-white/40 transition-colors" />
          </div>
          <span className="text-xs font-semibold text-[#E5B842]">
            Keep it up! 🔥
          </span>
        </div>
      </div>

      {/* Main content grids */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
        
        {/* Left Column: AI recommend & Priority Tasks */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* AI Advisor Panel */}
          <div className="p-8 bg-white/[0.01] border border-white/10 rounded-3xl relative overflow-hidden layered-shadow-lg card-shine-sweep">
            <div className="absolute top-1/2 -translate-y-1/2 right-12 opacity-15 hidden md:block select-none pointer-events-none">
              <div className="relative flex items-center justify-center">
                <Cpu className="w-24 h-24 text-[#E5B842]" />
                <span className="absolute text-[#E5B842] font-display font-black text-xl tracking-tight">AI</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-5">
              <Sparkles className="w-4 h-4 text-[#E5B842]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-display">AI Priority Advisor</span>
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
                className="px-5 py-3 bg-[#E5B842] hover:bg-[#FFF2CC] text-white hover:text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer font-sans active:scale-[0.98] shadow-md shadow-[#E5B842]/10"
              >
                <Calendar className="w-4 h-4" /> Open Calendar
              </button>
              <button 
                onClick={() => setCurrentTab('voice')}
                className="px-5 py-3 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer font-sans bg-white/5 html-light-btn-white"
              >
                Ask Voice AI Assistant
              </button>
            </div>
          </div>

          {/* Priority Task Stack list */}
          <div className="p-8 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-lg">
            <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white tracking-wider uppercase">High Priority Stack</span>
                <span className="text-[10px] bg-[#E5B842]/5 text-[#E5B842] border border-[#E5B842]/20 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">AI sorted</span>
              </div>
              <button 
                onClick={() => setCurrentTab('tasks')}
                className="text-xs font-semibold text-[#E5B842] hover:text-[#FFF2CC] uppercase tracking-wider flex items-center gap-0.5 cursor-pointer"
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
                    className="p-5 bg-black border border-white/[0.03] rounded-2xl hover:border-white/10 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            item.action();
                          }}
                          className="text-white/30 hover:text-[#E5B842] transition-colors focus:outline-hidden cursor-pointer"
                        >
                          {item.icon}
                        </button>
                        <span className="text-sm font-medium text-white/80 truncate">
                          {item.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${item.type === 'event' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : item.type === 'habit' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-[#E5B842]/5 border border-[#E5B842]/20 text-[#E5B842]'}`}>
                          {item.rankText}
                        </span>
                        <span className="text-xs text-white/45 flex items-center gap-1">
                          {item.type === 'habit' ? <Flame className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />} {item.meta}
                        </span>
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
                  <p className="text-xs text-white/35 font-light">Aaj koi task nahi hai, kal update hoga.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Mini Calendar & Habit check-in */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Mini Calendar agenda */}
          <div className="p-8 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40 flex items-center gap-2">
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
                      <span className="text-[10px] text-white/40 font-bold block mb-0.5">
                        <span className={`${evt.isHabit ? 'text-orange-400' : 'text-[#E5B842]/70'} mr-1.5`}>{evt.date}</span>
                        {evt.time} ({evt.duration})
                      </span>
                      <h5 className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                        {evt.title} {evt.isHabit && <Flame className="w-3.5 h-3.5 text-orange-400" />}
                      </h5>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-white/30 text-center py-6">No scheduled focus blocks or habits for today.</p>
              )}
            </div>
          </div>

          {/* Habits Panel check-in */}
          <div className="p-8 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-lg">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-6 flex items-center justify-between font-display">
              <span>Daily Habits</span>
              <button 
                onClick={() => setCurrentTab('habits')}
                className="text-[10px] font-bold text-[#E5B842] hover:text-[#FFF2CC] tracking-wider uppercase cursor-pointer"
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
                              <Circle className="w-4.5 h-4.5 text-white/20 hover:text-white/40" />
                            )}
                          </button>
                          <span className={`text-xs font-medium truncate ${isCompletedToday ? 'line-through text-white/30' : 'text-white/70'}`}>
                            {habit.name}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#E5B842] font-bold shrink-0">🔥 {habit.streak || 0}d</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-white/30 text-center py-6">No habits configured yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
