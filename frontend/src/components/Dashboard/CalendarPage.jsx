import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Disc, 
  Clock, 
  Check, 
  Trash2, 
  X, 
  AlertCircle, 
  RefreshCw, 
  Layers,
  User,
  AlertTriangle,
  Bot,
  Activity
} from 'lucide-react';
import { calendar as apiCalendar, tasks as apiTasks, habits as apiHabits } from '../../services/api.js';
import { useSocket } from '../../services/socket.js';

export default function CalendarPage({ tasks }) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [localTasks, setLocalTasks] = useState(tasks || []);
  const [localHabits, setLocalHabits] = useState([]);
  const [toast, setToast] = useState(null);
  
  // Voice AI highlighting states
  const [highlightedEventId, setHighlightedEventId] = useState(null);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = [
    '12:00 AM', '01:00 AM', '02:00 AM', '03:00 AM', '04:00 AM', '05:00 AM',
    '06:00 AM', '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
    '08:00 PM', '09:00 PM', '10:00 PM', '11:00 PM'
  ];

  // Layer filters
  const [layerFilters, setLayerFilters] = useState({
    ai_block: true,
    user_block: true,
    deadline: true,
    study: true,
    meeting: true,
    habit: true
  });

  // Sync settings
  const [syncSettings, setSyncSettings] = useState({
    google: true,
    outlook: false,
    autopilot: true
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    _id: null,
    title: '',
    type: 'user_block',
    startTime: new Date(),
    duration: 45,
    notes: '',
    notificationsEnabled: true
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fetchTasks = async () => {
    try {
      const data = await apiTasks.getAll();
      setLocalTasks(data || []);
    } catch (err) {
      console.error('Error fetching tasks for calendar:', err);
    }
  };

  const fetchHabits = async () => {
    try {
      const data = await apiHabits.getAll();
      setLocalHabits(data || []);
    } catch (err) {
      console.error('Error fetching habits for calendar:', err);
    }
  };

  const isSameDay = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isTaskDateOnly = (task) => {
    if (!task.dueDate) return true;
    const d = new Date(task.dueDate);
    const hours = d.getHours();
    const minutes = d.getMinutes();
    return (hours === 0 && minutes === 0) || (hours === 23 && minutes === 59);
  };

  const findTasksForCell = (tasksList, dayDate, hourStr) => {
    const { slotStart, slotEnd } = getSlotDates(dayDate, hourStr);
    return tasksList.filter(t => {
      if (t.completed) return false;
      if (!t.dueDate) return false;
      
      const due = new Date(t.dueDate);
      const hours = due.getHours();
      const minutes = due.getMinutes();
      const isDateOnly = (hours === 0 && minutes === 0) || (hours === 23 && minutes === 59);
      if (isDateOnly) return false;
      
      return due >= slotStart && due < slotEnd;
    });
  };

  const fetchEvents = async () => {
    try {
      const data = await apiCalendar.getAll();
      setCalendarEvents(data || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    }
  };

  useEffect(() => {
    if (tasks) {
      const timer = setTimeout(() => {
        setLocalTasks(tasks);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [tasks]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchEvents(), fetchTasks(), fetchHabits()]);
    };
    init();

    const handleRefetch = () => {
      fetchEvents();
    };

    const handleHighlightEvent = (e) => {
      const eventId = e.detail?.eventId;
      if (eventId) {
        setHighlightedEventId(eventId);
        setTimeout(() => {
          setHighlightedEventId(null);
        }, 4000);
      }
    };

    window.addEventListener('resq:refetch-calendar', handleRefetch);
    window.addEventListener('resq:highlight-event', handleHighlightEvent);

    return () => {
      window.removeEventListener('resq:refetch-calendar', handleRefetch);
      window.removeEventListener('resq:highlight-event', handleHighlightEvent);
    };
  }, []);

  // Listen to socket 'calendar:new-events' to refresh the calendar
  useSocket('calendar:new-events', () => {
    console.log('[Socket] calendar:new-events received');
    fetchEvents();
    showToast('AI Focus blocks updated in real-time!');
  });

  // Calculate dates of the active week based on offset to center the current day
  const getWeekDates = (offset) => {
    const now = new Date();
    
    // The center day of the view
    const centerDate = new Date(now);
    centerDate.setDate(now.getDate() + offset * 7);
    centerDate.setHours(0, 0, 0, 0);
    
    // The start date is 3 days BEFORE the center date
    const startDate = new Date(centerDate);
    startDate.setDate(centerDate.getDate() - 3);
    
    const dates = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const daysOfWeekList = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      dates.push({
        dayOfWeek: daysOfWeekList[d.getDay()],
        dateNum: d.getDate(),
        monthLabel: months[d.getMonth()],
        year: d.getFullYear(),
        fullDate: d
      });
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeekOffset);
  const weekStartLabel = `${weekDates[0].monthLabel} ${weekDates[0].dateNum}`;
  const weekEndLabel = `${weekDates[6].monthLabel} ${weekDates[6].dateNum}, ${weekDates[6].year}`;
  const displayWeekRange = `${weekStartLabel} - ${weekEndLabel}`;

  const parseHourStr = (hourStr) => {
    let hours = 9;
    let minutes = 0;
    const ampmMatch = hourStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (ampmMatch) {
      hours = parseInt(ampmMatch[1]);
      minutes = parseInt(ampmMatch[2]);
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
    }
    return { hours, minutes };
  };

  const getSlotDates = (dayDate, hourStr) => {
    const { hours, minutes } = parseHourStr(hourStr);
    const slotStart = new Date(dayDate);
    slotStart.setHours(hours, minutes, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 60 * 60000); // 1 hour slot
    return { slotStart, slotEnd };
  };

  const findEventForCell = (events, dayDate, hourStr) => {
    const { slotStart, slotEnd } = getSlotDates(dayDate, hourStr);
    return events.find(e => {
      const start = new Date(e.startTime);
      const end = new Date(e.endTime);
      return start < slotEnd && end > slotStart;
    });
  };

  // Filter events for the display grid
  const filteredEvents = calendarEvents.filter(e => {
    const start = new Date(e.startTime);
    const inActiveWeek = weekDates.some(d => {
      const dCopy = new Date(d.fullDate);
      dCopy.setHours(0, 0, 0, 0);
      const startCopy = new Date(start);
      startCopy.setHours(0, 0, 0, 0);
      return dCopy.getTime() === startCopy.getTime();
    });
    if (!inActiveWeek) return false;
    return layerFilters[e.type] || layerFilters[e.type === 'ai_block' ? 'ai_block' : 'user_block'];
  });

  const handleOpenCreateModal = () => {
    const now = new Date();
    setModalData({
      _id: null,
      title: '',
      type: 'user_block',
      startTime: now,
      duration: 45,
      notes: '',
      notificationsEnabled: true
    });
    setIsModalOpen(true);
  };

  const handleCellClick = (dayDate, hourStr) => {
    const existing = findEventForCell(calendarEvents, dayDate, hourStr);
    if (existing) {
      const start = new Date(existing.startTime);
      const end = new Date(existing.endTime);
      const durationMin = Math.round((end - start) / 60000);
      setModalData({
        _id: existing._id,
        title: existing.title,
        type: existing.type,
        startTime: start,
        duration: durationMin,
        notes: existing.notes || '',
        notificationsEnabled: existing.notificationsEnabled !== undefined ? existing.notificationsEnabled : true
      });
    } else {
      const { slotStart } = getSlotDates(dayDate, hourStr);
      setModalData({
        _id: null,
        title: '',
        type: 'user_block',
        startTime: slotStart,
        duration: 45,
        notes: '',
        notificationsEnabled: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e) => {
    e.preventDefault();
    if (!modalData.title.trim()) {
      showToast("Please enter a title for the slot", "error");
      return;
    }

    const start = new Date(modalData.startTime);
    const end = new Date(start.getTime() + modalData.duration * 60000);

    try {
      if (modalData._id === null) {
        // Create manual event
        const created = await apiCalendar.create({
          title: modalData.title,
          startTime: start,
          endTime: end,
          type: modalData.type,
          notes: modalData.notes,
          aiGenerated: modalData.type === 'ai_block',
          notificationsEnabled: modalData.notificationsEnabled
        });
        setCalendarEvents(prev => [...prev, created]);
        showToast(`Successfully booked: "${modalData.title}"`);
      } else {
        // Edit manual event
        const updated = await apiCalendar.update(modalData._id, {
          title: modalData.title,
          startTime: start,
          endTime: end,
          type: modalData.type,
          notes: modalData.notes,
          notificationsEnabled: modalData.notificationsEnabled
        });
        setCalendarEvents(prev => prev.map(evt => evt._id === modalData._id ? updated : evt));
        showToast(`Successfully updated: "${modalData.title}"`);
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Error saving event slot', 'error');
    }
  };

  const handleDeleteEvent = async () => {
    if (!modalData._id) return;
    try {
      await apiCalendar.delete(modalData._id);
      setCalendarEvents(prev => prev.filter(evt => evt._id !== modalData._id));
      showToast(`Removed slot: "${modalData.title}"`);
      setIsModalOpen(false);
    } catch {
      showToast('Error removing event', 'error');
    }
  };

  const handleTriggerAutoSchedule = async () => {
    try {
      showToast('Running AI scheduler engine...', 'info');
      const response = await apiCalendar.autoSchedule();
      if (Array.isArray(response) && response.length > 0) {
        fetchEvents();
        showToast(`AI scheduler complete: ${response.length} blocks inserted!`);
      } else {
        showToast('No new scheduling blocks required.', 'info');
      }
    } catch (err) {
      showToast(err.message || 'Auto Schedule failed', 'error');
    }
  };

  const handleSeedDemoEvents = async () => {
    try {
      showToast('Generating demo slots...', 'info');
      
      const demoSlots = [
        {
          title: "Roadmap Alignment Meeting",
          type: "user_block",
          dayIndex: 0, // Mon
          hour: 11,
          duration: 60,
          notes: "Sync with stakeholders on new roadmap priorities."
        },
        {
          title: "AI Focus: DB Index Tuning",
          type: "ai_block",
          dayIndex: 1, // Tue
          hour: 9,
          duration: 60,
          notes: "Optimize MongoDB query performance. Scheduled by ResQ Autopilot."
        },
        {
          title: "AI Focus: Draft Landing Page",
          type: "ai_block",
          dayIndex: 2, // Wed
          hour: 10,
          duration: 60,
          notes: "Focus block for marketing content copywriting."
        },
        {
          title: "Architecture Design Review",
          type: "user_block",
          dayIndex: 3, // Thu
          hour: 14, // 2:00 PM
          duration: 60,
          notes: "Discussion on backend boundaries and data flow design."
        },
        {
          title: "⚠️ Deadline: QA Audit Checklist",
          type: "deadline",
          dayIndex: 4, // Fri
          hour: 16, // 4:00 PM
          duration: 60,
          notes: "Critical path deadline for deployment checkoff."
        }
      ];

      const createdList = [];
      for (const slot of demoSlots) {
        const targetDay = weekDates[slot.dayIndex].fullDate;
        const start = new Date(targetDay);
        start.setHours(slot.hour, 0, 0, 0);
        const end = new Date(start.getTime() + slot.duration * 60000);

        // Check if there is already an event overlapping
        const isOverlapping = calendarEvents.some(e => {
          const eStart = new Date(e.startTime);
          const eEnd = new Date(e.endTime);
          return eStart < end && eEnd > start;
        });

        if (!isOverlapping) {
          const created = await apiCalendar.create({
            title: slot.title,
            startTime: start,
            endTime: end,
            type: slot.type,
            notes: slot.notes,
            aiGenerated: slot.type === 'ai_block',
            notificationsEnabled: true
          });
          createdList.push(created);
        }
      }

      if (createdList.length > 0) {
        setCalendarEvents(prev => [...prev, ...createdList]);
        showToast(`Loaded ${createdList.length} demo schedule slots!`);
      } else {
        showToast("Demo slots already loaded or time conflict detected.", "info");
      }
    } catch (err) {
      showToast(err.message || "Failed to load demo schedule", "error");
    }
  };

  // Count active focus slots in active week
  const focusSlotsCount = filteredEvents.filter(e => e.type === 'ai_block' || e.aiGenerated).length;

  // Unscheduled tasks
  const scheduledTaskIds = calendarEvents.map(e => e.taskId).filter(Boolean);
  const unscheduledTasks = (tasks || []).filter(t => !t.completed && !scheduledTaskIds.includes(t._id));

  return (
    <div className="space-y-5 lg:space-y-8 animate-fade-in font-sans relative">
      
      {/* Header */}
      <div className="sticky -top-6 bg-[#080808] z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4 lg:pb-6 pt-4 lg:pt-6 -mt-2 lg:-mt-6">
        <div>
          <span className="text-xs lg:text-sm font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-1.5 lg:mb-2 uppercase flex items-center gap-2">
            <Disc className="w-3.5 h-3.5" /> AI Time Management
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-display font-black tracking-tight text-white leading-none">
            Chronos Auto-Pilot
          </h2>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-1.5 bg-[#0B0B0B] border border-white/[0.06] rounded-xl p-1">
            <button 
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors text-white/70 hover:text-white cursor-pointer"
              style={{ minHeight: 'auto' }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm font-bold uppercase px-1 sm:px-2 text-white/80 min-w-[90px] sm:min-w-[130px] text-center">
              {displayWeekRange}
            </span>
            <button 
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors text-white/70 hover:text-white cursor-pointer"
              style={{ minHeight: 'auto' }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          {currentWeekOffset !== 0 && (
            <button
              onClick={() => setCurrentWeekOffset(0)}
              className="px-3 sm:px-4 py-2 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 animate-fade-in cursor-pointer active:scale-[0.98]"
              style={{ minHeight: 'auto' }}
            >
              Today
            </button>
          )}

          <button 
            onClick={handleOpenCreateModal}
            className="px-3 sm:px-4 py-2 bg-transparent text-[#E5B842] border border-[#E5B842]/40 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1 cursor-pointer active:scale-[0.98]"
            style={{ minHeight: 'auto' }}
          >
            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Book Slot</span>
          </button>
        </div>
      </div>

      {/* Main Grid View and list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-stretch">
        
        {/* Calendar Core Grid */}
        <div className="lg:col-span-9 bg-[#090909] border border-white/[0.04] rounded-3xl p-3 lg:p-6 layered-shadow-lg overflow-x-auto">
          <div className="min-w-[600px] lg:min-w-[650px] overflow-y-auto pr-1 flex flex-col">
            
            {/* Main Grid: Days Columns */}
            <div className="grid grid-cols-7 divide-x divide-white/[0.06] bg-[#090909] border border-white/[0.06] rounded-2xl overflow-hidden shadow-inner">
              {weekDates.map((dayObj, idx) => {
                const isToday = new Date(dayObj.fullDate).toDateString() === new Date().toDateString();
                
                // 2. Scheduled Items (Events only)
                const scheduledEvents = (filteredEvents || []).filter(e => isSameDay(e.startTime, dayObj.fullDate));
                
                // 3. Habits for this day
                const dayHabits = (localHabits || []).filter(h => h.targetDays && h.targetDays.includes(dayObj.dayOfWeek));
                
                // Sort combined scheduled items chronologically
                const combinedScheduled = [
                  ...scheduledEvents.map(e => ({ ...e, sortTime: new Date(e.startTime).getTime() }))
                ].sort((a, b) => a.sortTime - b.sortTime);

                return (
                  <div key={dayObj.dayOfWeek} className={`flex flex-col min-h-[600px] transition-all duration-300 relative group/col ${isToday ? 'bg-[#E5B842]/[0.02]' : 'hover:bg-white/[0.01]'}`}>
                    
                    {/* Day Header */}
                    <div className="p-4 border-b border-white/[0.06] flex flex-col items-center justify-center sticky top-0 bg-[#090909]/95 backdrop-blur-md z-10 transition-colors">
                      <span className={`text-sm font-tech font-bold uppercase tracking-wider ${isToday ? 'text-[#E5B842]' : 'text-white/70'}`}>
                        {dayObj.dayOfWeek}
                      </span>
                      <span className={`text-sm font-black mt-1 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
                        isToday 
                          ? 'bg-[#E5B842] text-black shadow-[0_0_15px_rgba(229,184,66,0.4)]' 
                          : 'text-white/80 group-hover/col:text-white'
                      }`}>
                        {dayObj.dateNum}
                      </span>
                    </div>

                    {/* Column Body */}
                    <div className="flex-1 p-2.5 flex flex-col gap-4">

                      {/* Daily Habits (All-Day equivalent) */}
                      {layerFilters.habit && localHabits && localHabits.length > 0 && (
                        <div className="flex flex-col gap-2 mb-1">
                           {localHabits.map(habit => {
                             const isForDay = habit.targetDays && habit.targetDays.includes(dayObj.dayOfWeek);
                             
                             if (!isForDay) {
                               // Placeholder for missing habit on this day to maintain grid alignment
                               return <div key={`empty-${habit._id}`} className="h-[60px] w-full invisible"></div>;
                             }

                             return (
                               <div 
                                 key={habit._id} 
                                 className="relative w-full group"
                                 onContextMenu={(e) => { if ('ontouchstart' in window) e.preventDefault(); }}
                               >
                                 <div className="h-[60px] w-full rounded-xl border border-purple-500/30 bg-purple-500/10 group-hover:border-purple-500/50 text-purple-400 p-2.5 shadow-[0_0_12px_rgba(168,85,247,0.15)] transition-all duration-300 relative overflow-hidden flex flex-col justify-center select-none group-hover:scale-[1.02]">
                                   <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div>
                                   <div className="pl-1.5 flex flex-col">
                                      <div className="flex items-center gap-1.5 mb-1 opacity-70">
                                        <Activity className="w-3 h-3 shrink-0" />
                                        <span className="text-[9px] font-bold tracking-widest uppercase">HABIT</span>
                                      </div>
                                      <h5 className="text-[10px] font-bold uppercase leading-tight tracking-wide break-words text-white line-clamp-1">
                                        {habit.name}
                                      </h5>
                                   </div>
                                 </div>
                                 
                                 {/* Custom Premium Tooltip */}
                                 <div className="absolute z-[200] left-1/2 -translate-x-1/2 bottom-[110%] mb-1 w-max max-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-active:opacity-100 group-active:visible transition-all duration-300 pointer-events-none scale-95 group-hover:scale-100 group-active:scale-100">
                                   <div className="bg-[#0f0f13]/95 backdrop-blur-xl border border-purple-500/30 rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(168,85,247,0.15)] relative">
                                      <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/10">
                                         <Activity className="w-3.5 h-3.5 text-purple-400" />
                                         <span className="text-[9px] font-bold tracking-widest uppercase text-purple-400">Habit Details</span>
                                      </div>
                                      <div className="text-[11px] font-bold text-white/90 leading-relaxed whitespace-pre-wrap break-words">
                                         {habit.name}
                                      </div>
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-2.5 h-2.5 bg-[#0f0f13] border-b border-r border-purple-500/30 rotate-45"></div>
                                   </div>
                                 </div>
                               </div>
                             );
                           })}
                        </div>
                      )}

                      {combinedScheduled.length > 0 && (
                        <div className="flex flex-col gap-2">
                           {combinedScheduled.map(item => {
                               const isAiBlock = item.type === 'ai_block' || item.aiGenerated;
                               
                               // If this layer is filtered out, don't show
                               if (isAiBlock && !layerFilters.ai_block) return null;
                               if (!isAiBlock && item.type === 'deadline' && !layerFilters.deadline) return null;
                               if (!isAiBlock && item.type !== 'deadline' && !layerFilters.user_block) return null;

                               const tc = isAiBlock ? "text-[#E5B842]" : item.type === 'deadline' ? "text-[#FF5F5F]" : "text-[#4A9EFF]";
                               const bc = isAiBlock ? "border-[#E5B842]/30" : item.type === 'deadline' ? "border-[#FF5F5F]/30" : "border-[#4A9EFF]/30";
                               const eventLabel = isAiBlock ? 'AI Scheduled' : item.type === 'deadline' ? 'Deadline' : 'Synced Event';

                               return (
                                 <div 
                                    key={item._id} 
                                    className="relative w-full group"
                                    onContextMenu={(e) => { if ('ontouchstart' in window) e.preventDefault(); }}
                                 >
                                   <div 
                                      onClick={() => {
                                        setModalData({
                                          _id: item._id,
                                          title: item.title,
                                          type: item.type,
                                          startTime: new Date(item.startTime),
                                          duration: (new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / 60000,
                                          notes: item.notes || '',
                                          notificationsEnabled: item.notificationsEnabled !== false
                                        });
                                        setIsModalOpen(true);
                                      }} 
                                      className={`w-full rounded-xl border transition-all duration-300 flex flex-col p-3 relative overflow-hidden select-none hover:shadow-xl hover:scale-[1.02] cursor-pointer ${
                                      isAiBlock
                                        ? 'bg-[#E5B842]/10 border-[#E5B842]/25 group-hover:border-[#E5B842]/45 text-[#E5B842] shadow-[0_0_12px_rgba(229,184,66,0.06)]'
                                        : item.type === 'deadline'
                                          ? 'bg-[#FF5F5F]/10 border-[#FF5F5F]/20 group-hover:border-[#FF5F5F]/40 text-[#FF5F5F] shadow-[0_4px_12px_rgba(255,95,95,0.06)]'
                                          : 'bg-[#4A9EFF]/10 border-[#4A9EFF]/20 group-hover:border-[#4A9EFF]/40 text-[#4A9EFF] shadow-[0_4px_12px_rgba(74,158,255,0.06)]'
                                    } ${item._id === highlightedEventId ? 'animate-event-pulse' : ''}`}>
                                      <div className={`absolute left-0 top-0 bottom-0 w-[4px] ${isAiBlock ? 'bg-gradient-to-b from-[#E5B842] to-[#FFF2CC]' : item.type === 'deadline' ? 'bg-[#FF5F5F]' : 'bg-[#4A9EFF]'}`}></div>
                                      <div className="pl-1">
                                        <div className="flex items-center gap-1.5 mb-1.5 opacity-70">
                                          <Clock className="w-3 h-3" />
                                          <span className="text-[10px] font-bold tracking-wider">{item.isAllDay ? 'ALL DAY' : new Date(item.startTime).toLocaleTimeString('en-US', {hour: 'numeric', minute:'2-digit', hour12: true})}</span>
                                        </div>
                                        <h5 className="text-[10px] font-bold uppercase leading-tight tracking-wide mb-1 break-words">{item.title}</h5>
                                        <span className="text-[10px] opacity-60 font-semibold uppercase tracking-wider block">
                                          {isAiBlock ? (item.taskId && (localTasks.find(t => t._id === item.taskId)?.urgency >= 8) ? '🔥 Priority Focus' : '') : item.type === 'deadline' ? '⚠️ Deadline' : '👤 Synced Event'}
                                        </span>
                                      </div>
                                   </div>

                                   {/* Custom Premium Tooltip */}
                                   <div className="absolute z-[200] left-1/2 -translate-x-1/2 bottom-[110%] mb-1 w-max max-w-[220px] opacity-0 invisible group-hover:opacity-100 group-hover:visible group-active:opacity-100 group-active:visible transition-all duration-300 pointer-events-none scale-95 group-hover:scale-100 group-active:scale-100">
                                     <div className={`bg-[#0f0f13]/95 backdrop-blur-xl border ${bc} rounded-xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.9),0_0_20px_rgba(0,0,0,0.3)] relative`}>
                                        <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-white/10">
                                           <Clock className={`w-3.5 h-3.5 ${tc}`} />
                                           <span className={`text-[9px] font-bold tracking-widest uppercase ${tc}`}>{eventLabel}</span>
                                        </div>
                                        <div className="text-[11px] font-bold text-white/90 leading-relaxed whitespace-pre-wrap break-words">
                                           {item.title}
                                        </div>
                                        {item.notes && (
                                          <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-white/60 leading-relaxed">
                                            {item.notes}
                                          </div>
                                        )}
                                        <div className={`absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] w-2.5 h-2.5 bg-[#0f0f13] border-b border-r ${bc} rotate-45`}></div>
                                     </div>
                                   </div>
                                 </div>
                               );
                           })}
                        </div>
                      )}

                      {/* Empty State / Add Button */}
                      {combinedScheduled.length === 0 && (
                        <button onClick={() => {
                          setModalData(prev => ({
                            ...prev,
                            _id: null,
                            title: '',
                            type: 'user_block',
                            startTime: dayObj.fullDate,
                            duration: 45
                          }));
                          setIsModalOpen(true);
                        }} className="flex-1 w-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl text-white/50 hover:text-white/60 hover:border-white/20 transition-all duration-300 font-tech font-bold uppercase tracking-widest text-sm cursor-pointer group hover:bg-white/[0.02] min-h-[100px]">
                          <Plus className="w-4 h-4 mb-2 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110" /> 
                          <span className="opacity-50 group-hover:opacity-100 transition-opacity">Book Slot</span>
                        </button>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>

        {/* Side Panel: Scheduled Lists & Filters */}
        <div className="lg:col-span-3 space-y-5 lg:space-y-6 lg:sticky lg:top-32 h-fit">
          
          {/* Chronos Layers Filter */}
          <div className="p-6 bg-[#090909] border border-white/[0.04] rounded-3xl space-y-4 layered-shadow-lg">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Layers className="w-4 h-4 text-white/50" />
              <h4 className="text-sm font-tech font-bold uppercase tracking-wider text-white/80">Chronos Layers</h4>
            </div>
            
            {/* Custom Control Chips */}
            <div className="flex flex-col gap-3">
              {[
                { key: 'ai_block', label: 'AI Scheduled', icon: Bot, textColor: 'text-[#E5B842]', bgColor: 'bg-[#E5B842]/10', borderColor: 'border-[#E5B842]/30', shadowColor: 'shadow-[0_0_15px_rgba(229,184,66,0.3)]' },
                { key: 'user_block', label: 'My Events', icon: User, textColor: 'text-[#4A9EFF]', bgColor: 'bg-[#4A9EFF]/10', borderColor: 'border-[#4A9EFF]/30', shadowColor: 'shadow-[0_0_15px_rgba(74,158,255,0.3)]' },
                { key: 'deadline', label: 'Deadlines', icon: AlertTriangle, textColor: 'text-[#FF5F5F]', bgColor: 'bg-[#FF5F5F]/10', borderColor: 'border-[#FF5F5F]/30', shadowColor: 'shadow-[0_0_15px_rgba(255,95,95,0.3)]' },
                { key: 'habit', label: 'Daily Habits', icon: Activity, textColor: 'text-purple-400', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30', shadowColor: 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' },
              ].map(filter => {
                const checked = filter.key === 'ai_block' ? layerFilters.ai_block : filter.key === 'user_block' ? layerFilters.user_block : filter.key === 'habit' ? layerFilters.habit : layerFilters.deadline;
                const toggle = () => {
                  if (filter.key === 'ai_block') {
                    setLayerFilters(prev => ({ ...prev, ai_block: !prev.ai_block }));
                  } else if (filter.key === 'user_block') {
                    setLayerFilters(prev => ({ ...prev, user_block: !prev.user_block, meeting: !prev.user_block }));
                  } else if (filter.key === 'habit') {
                    setLayerFilters(prev => ({ ...prev, habit: !prev.habit }));
                  } else {
                    setLayerFilters(prev => ({ ...prev, deadline: !prev.deadline }));
                  }
                };
                
                const Icon = filter.icon;

                return (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={toggle}
                    className={`w-full flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer hover:scale-[1.02] ${
                      checked 
                        ? `bg-white/[0.02] ${filter.borderColor} text-white shadow-lg` 
                        : 'bg-white/[0.01] border-white/5 text-white/70 hover:text-white/80 hover:bg-white/[0.02]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <div className={`p-2.5 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 border ${checked ? `${filter.bgColor} ${filter.borderColor} ${filter.shadowColor}` : 'bg-white/5 border-transparent'}`}>
                         <Icon className={`w-4 h-4 ${checked ? filter.textColor : 'text-white/70'}`} />
                      </div>
                      <span className={`text-[12px] sm:text-[13px] text-left leading-tight font-bold uppercase tracking-wide font-tech transition-opacity ${checked ? 'opacity-100 text-white' : 'opacity-60'}`}>
                        {filter.label}
                      </span>
                    </span>
                    <span className={`text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg font-bold tracking-widest shrink-0 transition-all ml-auto ${checked ? `${filter.bgColor} ${filter.textColor} ${filter.borderColor} border` : 'bg-transparent border border-white/10 text-white/70'}`}>
                      {checked ? 'SHOW' : 'HIDE'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>




        </div>

      </div>

      {/* Booking / Edit Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div 
            className="bg-[#050505] border border-white/10 rounded-[2rem] p-8 w-full max-w-md shadow-[0_0_60px_rgba(0,0,0,0.9)] relative space-y-7 animate-scale-up overflow-hidden group"
            onClick={e => e.stopPropagation()}
          >
            {/* Subtle glow effect behind modal */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-[#E5B842]/5 blur-[100px] pointer-events-none rounded-full" />
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-5 relative z-10">
              <h3 className="text-xl font-display font-black tracking-tight bg-gradient-to-br from-white to-white/40 bg-clip-text text-transparent leading-none">
                {modalData._id ? 'Manage Schedule Slot' : 'Book Schedule Slot'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-2xl transition-colors text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="space-y-5">
              <div>
                <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Slot Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Focus Block: Coding task"
                  value={modalData.title}
                  onChange={e => setModalData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-300"
                />
              </div>

              <div>
                <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-2.5">Layer Type</label>
                <div className={`grid ${modalData._id && modalData.type === 'ai_block' ? 'grid-cols-3' : 'grid-cols-2'} gap-3`}>
                  {[
                    ...(modalData._id && modalData.type === 'ai_block' ? [{
                      key: 'ai_block', 
                      icon: <Bot className="w-5 h-5 mb-0.5" />,
                      label: 'AI Scheduled', 
                      activeClass: 'border-[#E5B842]/50 bg-gradient-to-br from-[#E5B842]/20 to-[#E5B842]/5 text-[#E5B842] shadow-[0_0_25px_rgba(229,184,66,0.25)] ring-1 ring-[#E5B842]/30 scale-[1.02]', 
                      inactiveClass: 'border-white/5 bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/[0.04] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:-translate-y-0.5' 
                    }] : []),
                    { 
                      key: 'user_block', 
                      icon: <User className="w-5 h-5 mb-0.5" />,
                      label: 'User Block', 
                      activeClass: 'border-status-blue/50 bg-gradient-to-br from-status-blue/20 to-status-blue/5 text-status-blue shadow-[0_0_25px_rgba(74,158,255,0.25)] ring-1 ring-status-blue/30 scale-[1.02]', 
                      inactiveClass: 'border-white/5 bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/[0.04] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:-translate-y-0.5' 
                    },
                    { 
                      key: 'deadline', 
                      icon: <AlertTriangle className="w-5 h-5 mb-0.5" />,
                      label: 'Deadline', 
                      activeClass: 'border-status-red/50 bg-gradient-to-br from-status-red/20 to-status-red/5 text-status-red shadow-[0_0_25px_rgba(255,95,95,0.25)] ring-1 ring-status-red/30 scale-[1.02]', 
                      inactiveClass: 'border-white/5 bg-white/[0.02] text-white/70 hover:text-white hover:bg-white/[0.04] hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:-translate-y-0.5' 
                    }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setModalData(prev => ({ ...prev, type: tab.key }))}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 px-2 text-sm font-bold uppercase tracking-wider rounded-2xl border text-center transition-all duration-300 cursor-pointer ${
                        modalData.type === tab.key ? tab.activeClass : tab.inactiveClass
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date & Time input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Start Time</label>
                  <input 
                    type="datetime-local" 
                    value={modalData.startTime ? new Date(new Date(modalData.startTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={e => setModalData(prev => ({ ...prev, startTime: new Date(e.target.value) }))}
                    className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/60 focus:bg-white/[0.04] focus:shadow-[0_0_15px_rgba(229,184,66,0.15)] rounded-2xl px-4 py-3 text-sm text-white outline-none transition-all duration-300 cursor-pointer"
                  />
                </div>
                {modalData.type === 'deadline' ? (
                  <div>
                    <label className="text-sm font-tech font-bold uppercase tracking-wider text-status-red/70 block mb-1.5 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Ending Time
                    </label>
                    <input 
                      type="datetime-local" 
                      value={modalData.startTime && !isNaN(modalData.duration) ? new Date(new Date(modalData.startTime).getTime() + (modalData.duration * 60000) - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                      onChange={e => {
                        if (!e.target.value) return;
                        const newEndTime = new Date(e.target.value);
                        const durationMins = Math.max(1, Math.round((newEndTime - new Date(modalData.startTime)) / 60000));
                        setModalData(prev => ({ ...prev, duration: durationMins }));
                      }}
                      className="w-full bg-black/40 border border-status-red/20 hover:border-status-red/40 focus:border-status-red focus:bg-status-red/5 focus:ring-1 focus:ring-status-red/30 rounded-2xl px-4 py-3 text-sm text-white outline-none transition-all duration-300 cursor-pointer"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Duration (mins)</label>
                    <input 
                      type="number" 
                      value={modalData.duration}
                      onChange={e => setModalData(prev => ({ ...prev, duration: parseInt(e.target.value) || 45 }))}
                      className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/60 focus:bg-white/[0.04] focus:shadow-[0_0_15px_rgba(229,184,66,0.15)] rounded-2xl px-4 py-3 text-sm text-white outline-none transition-all duration-300"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 block mb-1.5">Notes</label>
                <textarea 
                  placeholder="Additional context/notes..."
                  value={modalData.notes}
                  onChange={e => setModalData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 focus:bg-white/[0.02] rounded-2xl px-4 py-3 text-sm text-white outline-none transition-all duration-300 h-20 resize-none"
                />
              </div>


              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                <div>
                  {modalData._id && (
                    <button 
                      type="button"
                      onClick={handleDeleteEvent}
                      className="px-3 py-2 bg-status-red/10 hover:bg-status-red/20 text-status-red border border-status-red/20 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-6 py-2.5 bg-white/[0.03] border border-white/10 hover:bg-white/[0.08] hover:border-white/20 rounded-2xl text-sm font-bold uppercase tracking-wider transition-all duration-300 text-white/70 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-8 py-2.5 bg-gradient-to-r from-[#E5B842] to-[#FFD566] hover:brightness-110 text-black rounded-2xl text-sm font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer shadow-[0_0_20px_rgba(229,184,66,0.2)] hover:shadow-[0_0_30px_rgba(229,184,66,0.4)] hover:-translate-y-0.5"
                  >
                    <Check className="w-4 h-4" /> Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Toast Notification */}
      {toast && createPortal(
        <div className={`fixed bottom-6 right-6 z-[9999] px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-status-red/10 border-status-red/30 text-status-red' 
            : 'bg-black/90 border-[#E5B842]/30 text-[#E5B842]'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span className="text-sm font-bold tracking-wide uppercase">{toast.message}</span>
        </div>,
        document.body
      )}

    </div>
  );
}
