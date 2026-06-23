import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Sparkles, 
  Clock, 
  Check, 
  Trash2, 
  X, 
  AlertCircle, 
  RefreshCw, 
  Layers 
} from 'lucide-react';
import { calendar as apiCalendar } from '../../services/api.js';
import { useSocket } from '../../services/socket.js';

export default function CalendarPage({ tasks }) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  
  // Voice AI highlighting states
  const [highlightedEventId, setHighlightedEventId] = useState(null);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', 
    '05:00 PM', '06:00 PM'
  ];

  // Layer filters
  const [layerFilters, setLayerFilters] = useState({
    ai_block: true,
    user_block: true,
    deadline: true,
    study: true,
    meeting: true
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
    type: 'ai_block',
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

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await apiCalendar.getAll();
      setCalendarEvents(data || []);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

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
  useSocket('calendar:new-events', (newEvents) => {
    console.log('[Socket] calendar:new-events received');
    fetchEvents();
    showToast('AI Focus blocks updated in real-time!');
  });

  // Calculate dates of the active week based on offset
  const getWeekDates = (offset) => {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday + offset * 7);
    monday.setHours(0, 0, 0, 0);
    
    const dates = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push({
        dayOfWeek: daysOfWeek[i],
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
    } catch (err) {
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

  // Count active focus slots in active week
  const focusSlotsCount = filteredEvents.filter(e => e.type === 'ai_block' || e.aiGenerated).length;

  // Unscheduled tasks
  const scheduledTaskIds = calendarEvents.map(e => e.taskId).filter(Boolean);
  const unscheduledTasks = (tasks || []).filter(t => !t.completed && !scheduledTaskIds.includes(t._id));

  return (
    <div className="space-y-8 animate-fade-in font-sans relative">
      
      {/* Header */}
      <div className="sticky -top-6 bg-[#080808] z-30 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-6 pt-6 -mt-6">
        <div>
          <span className="text-xs font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-2">CHRONOS LAYERS</span>
          <h2 className="text-3xl font-display font-black tracking-tight text-white leading-none">
            Google Calendar Integrations
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#0B0B0B] border border-white/[0.06] rounded-xl p-1">
            <button 
              onClick={() => setCurrentWeekOffset(prev => prev - 1)}
              className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors text-white/40 hover:text-white cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold uppercase px-2 text-white/80 min-w-[130px] text-center">
              {displayWeekRange}
            </span>
            <button 
              onClick={() => setCurrentWeekOffset(prev => prev + 1)}
              className="p-1.5 hover:bg-white/[0.05] rounded-lg transition-colors text-white/40 hover:text-white cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          
          <button 
            onClick={handleTriggerAutoSchedule}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-[#E5B842] text-black hover:brightness-110 text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1 cursor-pointer active:scale-[0.98] shadow-[0_0_15px_rgba(34,211,238,0.2)]"
          >
            <Sparkles className="w-3.5 h-3.5" /> Auto-Schedule AI
          </button>

          <button 
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-transparent text-[#E5B842] border border-[#E5B842]/40 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1 cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" /> Book Slot
          </button>
        </div>
      </div>

      {/* Main Grid View and list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Calendar Core Grid */}
        <div className="lg:col-span-9 bg-[#090909] border border-white/[0.04] rounded-3xl p-6 layered-shadow-lg overflow-x-auto">
          <div className="min-w-[650px] h-[540px] overflow-y-auto pr-1 flex flex-col">
            
            {/* Days Column Headers */}
            <div className="grid grid-cols-8 gap-4 border-b border-white/5 pb-4 mb-4 sticky top-0 bg-[#090909] z-20">
              <div className="text-xs font-tech font-bold uppercase tracking-wider text-white/35 text-center bg-[#090909] py-2 flex items-center justify-center">Time</div>
              {weekDates.map((d) => {
                const isToday = new Date(d.fullDate).toDateString() === new Date().toDateString();
                return (
                  <div 
                    key={d.dayOfWeek} 
                    className={`text-center py-1.5 px-1 flex flex-col items-center rounded-xl transition-all duration-300 ${
                      isToday 
                        ? 'bg-[#E5B842]/10 border border-[#E5B842]/20 shadow-[0_0_10px_rgba(229,184,66,0.05)]' 
                        : 'border border-transparent'
                    }`}
                  >
                    <span className={`text-[9px] font-tech font-bold uppercase tracking-wider ${isToday ? 'text-[#E5B842]' : 'text-white/35'}`}>
                      {d.dayOfWeek}
                    </span>
                    <span className={`text-xs font-black mt-0.5 w-6 h-6 flex items-center justify-center rounded-full transition-all duration-300 ${
                      isToday 
                        ? 'bg-[#E5B842] text-black shadow-[0_0_10px_rgba(229,184,66,0.4)]' 
                        : 'text-white'
                    }`}>
                      {d.dateNum}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Time Grid Rows */}
            <div className="space-y-3.5 flex-1">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 gap-4 items-center">
                  <div className="text-xs font-bold text-white/40 text-center">{hour}</div>
                  
                  {weekDates.map((dayObj) => {
                    const match = findEventForCell(filteredEvents, dayObj.fullDate, hour);
                    const isAiBlock = match && (match.type === 'ai_block' || match.aiGenerated);
                    
                    return (
                      <div 
                        key={dayObj.dayOfWeek} 
                        onClick={() => handleCellClick(dayObj.fullDate, hour)}
                        className={`min-h-[52px] rounded-xl border transition-all duration-300 flex flex-col justify-center relative group cursor-pointer ${
                          match 
                            ? isAiBlock
                              ? 'bg-[#E5B842]/10 border-[#E5B842]/30 hover:border-[#E5B842]/60 text-[#E5B842] shadow-[0_0_15px_rgba(229,184,66,0.1)]'
                              : match.type === 'deadline'
                                ? 'bg-status-red/[0.05] border border-status-red/20 hover:border-status-red/40 text-status-red shadow-[0_4px_12px_rgba(255,95,95,0.04)]'
                                : 'bg-status-blue/[0.05] border border-status-blue/20 hover:border-status-blue/40 text-status-blue shadow-[0_4px_12px_rgba(74,158,255,0.04)]'
                            : 'bg-transparent border border-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.02] hover:scale-[1.01] hover:shadow-[0_0_8px_rgba(255,255,255,0.02)]'
                        } ${match && match._id === highlightedEventId ? 'animate-event-pulse' : ''}`}
                      >
                        {match ? (
                          <>
                            <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
                              <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                                isAiBlock 
                                  ? 'bg-gradient-to-b from-[#E5B842] to-[#FFF2CC]' 
                                  : match.type === 'deadline' 
                                    ? 'bg-status-red' 
                                    : 'bg-status-blue'
                              }`}></div>
                              <div className="pl-3.5 pr-2 py-1.5 min-w-0 flex flex-col justify-center h-full">
                                <h5 className="text-[10px] font-bold uppercase truncate leading-tight tracking-wider">{match.title}</h5>
                                <span className="text-[8px] opacity-60 font-semibold uppercase mt-0.5 block">
                                  {isAiBlock ? '🤖 AI Scheduled' : match.type.replace('_', ' ')}
                                </span>
                              </div>
                            </div>

                            {/* Floating Custom Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col w-52 p-3 bg-[#0D0D0E]/95 border border-white/10 rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.95)] backdrop-blur-md text-left z-50 pointer-events-none transition-all">
                              <span className={`text-[8px] font-tech font-bold uppercase tracking-[0.2em] mb-1 ${
                                isAiBlock 
                                  ? 'text-[#E5B842]' 
                                  : match.type === 'deadline' 
                                    ? 'text-status-red' 
                                    : 'text-status-blue'
                              }`}>
                                {isAiBlock ? '🤖 AI Scheduled Layer' : match.type === 'deadline' ? '⚠️ Deadline Layer' : '👤 Sync Layer'}
                              </span>
                              <h6 className="text-[10px] font-bold text-white leading-snug mb-1.5 break-words">
                                {match.title}
                              </h6>
                              <div className="flex items-center gap-1 text-[8px] text-white/50 font-semibold mb-1">
                                <Clock className="w-2.5 h-2.5" />
                                <span>{new Date(match.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              {match.notes && (
                                <p className="text-[8px] text-white/40 leading-relaxed font-normal border-t border-white/5 pt-1 mt-1">
                                  {match.notes}
                                </p>
                              )}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0D0D0E]/95 z-50"></div>
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Side Panel: Scheduled Lists & Filters */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Chronos Layers Filter */}
          <div className="p-6 bg-[#090909] border border-white/[0.04] rounded-3xl space-y-4 layered-shadow-lg">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Layers className="w-4 h-4 text-white/50" />
              <h4 className="text-xs font-tech font-bold uppercase tracking-wider text-white/80">Chronos Layers</h4>
            </div>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group text-xs text-white/70 hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={layerFilters.ai_block} 
                  onChange={e => setLayerFilters(prev => ({ ...prev, ai_block: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/10 text-[#E5B842] focus:ring-0 focus:ring-offset-0 bg-black cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                  <span className="w-2.5 h-2.5 rounded bg-gradient-to-r from-[#E5B842] to-[#FFF2CC] inline-block shadow-[0_0_8px_rgba(229,184,66,0.4)]"></span>
                  AI Scheduled Tasks
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group text-xs text-white/70 hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={layerFilters.user_block} 
                  onChange={e => setLayerFilters(prev => ({ ...prev, user_block: e.target.checked, meeting: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/10 text-status-blue focus:ring-0 focus:ring-offset-0 bg-black cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                  <span className="w-2.5 h-2.5 rounded bg-status-blue inline-block shadow-[0_0_8px_rgba(74,158,255,0.4)]"></span>
                  My Added Events
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group text-xs text-white/70 hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={layerFilters.deadline} 
                  onChange={e => setLayerFilters(prev => ({ ...prev, deadline: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/10 text-status-red focus:ring-0 focus:ring-offset-0 bg-black cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                  <span className="w-2.5 h-2.5 rounded bg-status-red inline-block shadow-[0_0_8px_rgba(255,95,95,0.4)]"></span>
                  Upcoming Deadlines
                </span>
              </label>
            </div>
          </div>

          {/* AI Automated focus details */}
          <div className="p-6 bg-white/[0.01] border border-[#E5B842]/20 rounded-3xl space-y-4 layered-shadow-lg card-shine-sweep relative overflow-hidden">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#E5B842] animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wider uppercase font-display">Auto-Schedule Engine</span>
            </div>
            <p className="text-xs text-white/70 leading-relaxed font-normal">
              ResQ proactively analyzes your empty spots and populates AI Scheduled Tasks to ensure tasks are completed way before their deadlines.
            </p>

            <div className="flex items-center gap-2 p-2.5 bg-black/60 rounded-xl border border-[#E5B842]/20">
              <Check className="w-3.5 h-3.5 text-[#E5B842]" />
              <span className="text-[10px] font-bold text-[#E5B842] uppercase tracking-wide">
                {focusSlotsCount} focus slots booked this week
              </span>
            </div>
          </div>

          {/* Sync status */}
          <div className="p-6 bg-[#090909] border border-white/[0.04] rounded-3xl space-y-4 layered-shadow-lg">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <RefreshCw className="w-4 h-4 text-white/50" />
              <h4 className="text-xs font-tech font-bold uppercase tracking-wider text-white/80">Sync Integrations</h4>
            </div>
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/70">Google Calendar</span>
                <button 
                  onClick={() => setSyncSettings(prev => ({ ...prev, google: !prev.google }))}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer ${syncSettings.google ? 'bg-[#E5B842]' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-300 ${syncSettings.google ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Pending Tasks timeline */}
          <div className="p-6 bg-[#090909] border border-white/[0.04] rounded-3xl space-y-4 layered-shadow-lg">
            <h4 className="text-xs font-tech font-bold uppercase tracking-wider text-white/40">Unscheduled Tasks</h4>
            {unscheduledTasks.length === 0 ? (
              <div className="p-4 bg-black/20 border border-dashed border-white/5 rounded-xl text-center">
                <span className="text-[10px] text-white/30 uppercase font-semibold">All tasks scheduled</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {unscheduledTasks.map((task) => (
                  <div key={task._id} className="p-3 bg-black/40 border border-white/[0.03] rounded-xl hover:border-white/10 transition-all duration-300 space-y-2">
                    <h5 className="text-xs font-bold text-white/80 leading-none truncate">{task.title}</h5>
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase">
                      <span className="text-white/40 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {task.estimatedMinutes || task.duration || 30}m
                      </span>
                      <span 
                        onClick={() => handleTriggerAutoSchedule()}
                        className="text-[#E5B842] hover:text-[#FFF2CC] cursor-pointer transition-colors"
                      >
                        Auto schedule &rarr;
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

      {/* Booking / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            className="bg-[#0A0A0A] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative space-y-6 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-xl font-display font-black tracking-tight text-white leading-none">
                {modalData._id ? 'Manage Schedule Slot' : 'Book Schedule Slot'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-white/5 rounded-xl transition-colors text-white/40 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveModal} className="space-y-5">
              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Slot Title</label>
                <input 
                  type="text"
                  placeholder="e.g. Focus Block: Coding task"
                  value={modalData.title}
                  onChange={e => setModalData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842] rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 outline-none transition-all duration-300"
                />
              </div>

              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-2">Layer Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {key: 'ai_block', label: '🤖 AI Scheduled', activeClass: 'border-[#E5B842] bg-[#E5B842]/10 text-[#E5B842] shadow-[0_0_12px_rgba(229,184,66,0.1)]', inactiveClass: 'border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04]' },
                    { key: 'user_block', label: '👤 User Block', activeClass: 'border-status-blue bg-status-blue/10 text-status-blue shadow-[0_0_12px_rgba(74,158,255,0.1)]', inactiveClass: 'border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04]' },
                    { key: 'deadline', label: '⚠️ Deadline', activeClass: 'border-status-red bg-status-red/10 text-status-red shadow-[0_0_12px_rgba(255,95,95,0.1)]', inactiveClass: 'border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04]' }
                  ].map(tab => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setModalData(prev => ({ ...prev, type: tab.key }))}
                      className={`py-2 px-1 text-[10px] font-bold uppercase tracking-wider rounded-xl border text-center transition-all duration-300 cursor-pointer ${
                        modalData.type === tab.key ? tab.activeClass : tab.inactiveClass
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Date & Time input */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Start Time</label>
                  <input 
                    type="datetime-local" 
                    value={modalData.startTime ? new Date(new Date(modalData.startTime).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''}
                    onChange={e => setModalData(prev => ({ ...prev, startTime: new Date(e.target.value) }))}
                    className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Duration (mins)</label>
                  <input 
                    type="number" 
                    value={modalData.duration}
                    onChange={e => setModalData(prev => ({ ...prev, duration: parseInt(e.target.value) || 45 }))}
                    className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Notes</label>
                <textarea 
                  placeholder="Additional context/notes..."
                  value={modalData.notes}
                  onChange={e => setModalData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors h-16 resize-none"
                />
              </div>

              {/* Notification Preferences */}
              <div className="pt-1.5">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/70 hover:text-white transition-colors">
                  <input 
                    type="checkbox" 
                    checked={modalData.notificationsEnabled} 
                    onChange={e => setModalData(prev => ({ ...prev, notificationsEnabled: e.target.checked }))}
                    className="w-4 h-4 rounded border-white/10 text-[#E5B842] focus:ring-0 focus:ring-offset-0 bg-black cursor-pointer"
                  />
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-white/65">
                    Enable high-frequency reminders (1 day, 5h, 3h, 2h, 1h before)
                  </span>
                </label>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                <div>
                  {modalData._id && (
                    <button 
                      type="button"
                      onClick={handleDeleteEvent}
                      className="px-3 py-2 bg-status-red/10 hover:bg-status-red/20 text-status-red border border-status-red/20 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-[#0F0F0F] border border-white/10 hover:bg-white/[0.05] rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-white/70 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-[#E5B842] hover:bg-[#FFF2CC] text-black rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer font-bold"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-status-red/10 border-status-red/30 text-status-red' 
            : 'bg-black/90 border-[#E5B842]/30 text-[#E5B842]'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span className="text-xs font-bold tracking-wide uppercase">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
