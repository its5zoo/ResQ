import React, { useState } from 'react';
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

export default function CalendarPage({ tasks }) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  // Weekly hours rows for schedule visualization
  const hours = [
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', 
    '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', 
    '05:00 PM', '06:00 PM'
  ];

  // Dynamic Event State
  const [calendarEvents, setCalendarEvents] = useState([
    { id: 1, day: 'Mon', hour: '10:00 AM', title: 'Team Scrum meeting', type: 'user', weekOffset: 0 },
    { id: 2, day: 'Tue', hour: '04:00 PM', title: '🤖 Focus Block: Coding tasks', type: 'ai', weekOffset: 0 },
    { id: 3, day: 'Wed', hour: '11:00 AM', title: 'Submit Proposal Review', type: 'deadline', weekOffset: 0 },
    { id: 4, day: 'Thu', hour: '01:00 PM', title: '🤖 AI Block: Habit gym trip', type: 'ai', weekOffset: 0 },
    { id: 5, day: 'Fri', hour: '03:00 PM', title: 'Client check-in', type: 'user', weekOffset: 0 }
  ]);

  // Track scheduled tasks to hide them from the sidebar list
  const [scheduledTaskIds, setScheduledTaskIds] = useState([]);

  // Visibility Layer Filters
  const [layerFilters, setLayerFilters] = useState({
    ai: true,
    deadline: true,
    user: true
  });

  // Calendar Sync settings
  const [syncSettings, setSyncSettings] = useState({
    google: true,
    outlook: false,
    autopilot: true
  });

  // Toast Notification state
  const [toast, setToast] = useState(null);

  // Booking / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState({
    id: null,
    title: '',
    type: 'ai',
    day: 'Mon',
    hour: '09:00 AM',
    weekOffset: 0
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Helper function to calculate calendar dates for the active week
  const getWeekDates = (offset) => {
    // base Monday is June 22, 2026
    const baseMonday = new Date(2026, 5, 22);
    baseMonday.setDate(baseMonday.getDate() + offset * 7);
    
    const dates = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseMonday);
      d.setDate(baseMonday.getDate() + i);
      dates.push({
        dayOfWeek: daysOfWeek[i],
        dateNum: d.getDate(),
        monthLabel: months[d.getMonth()],
        year: d.getFullYear(),
        fullDateString: `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
      });
    }
    return dates;
  };

  const weekDates = getWeekDates(currentWeekOffset);
  const weekStartLabel = `${weekDates[0].monthLabel} ${weekDates[0].dateNum}`;
  const weekEndLabel = `${weekDates[6].monthLabel} ${weekDates[6].dateNum}, ${weekDates[6].year}`;
  const displayWeekRange = `${weekStartLabel} - ${weekEndLabel}`;

  // Filter events according to active filters and active week offset
  const filteredEvents = calendarEvents.filter(e => {
    if (e.weekOffset !== currentWeekOffset) return false;
    return layerFilters[e.type];
  });

  // Open Booking Modal for adding new event
  const handleOpenCreateModal = () => {
    setModalData({
      id: null,
      title: '',
      type: 'ai',
      day: 'Mon',
      hour: '09:00 AM',
      weekOffset: currentWeekOffset
    });
    setIsModalOpen(true);
  };

  // Open Edit / Booking Modal when clicking a calendar grid cell
  const handleCellClick = (day, hour) => {
    const existing = calendarEvents.find(
      e => e.weekOffset === currentWeekOffset && e.day === day && e.hour === hour
    );
    if (existing) {
      setModalData({ ...existing });
    } else {
      setModalData({
        id: null,
        title: '',
        type: 'ai',
        day,
        hour,
        weekOffset: currentWeekOffset
      });
    }
    setIsModalOpen(true);
  };

  // Save changes from Modal
  const handleSaveModal = (e) => {
    e.preventDefault();
    if (!modalData.title.trim()) {
      showToast("Please enter a title for the slot", "error");
      return;
    }

    // Check for schedule conflicts
    const conflict = calendarEvents.find(
      evt => evt.id !== modalData.id &&
             evt.weekOffset === modalData.weekOffset &&
             evt.day === modalData.day &&
             evt.hour === modalData.hour
    );

    if (conflict) {
      showToast(`Conflict: "${conflict.title}" already occupies this slot!`, "error");
      return;
    }

    if (modalData.id === null) {
      // Adding new event
      const newEvent = {
        ...modalData,
        id: Date.now()
      };
      setCalendarEvents(prev => [...prev, newEvent]);
      showToast(`Successfully booked: "${modalData.title}"`);
    } else {
      // Editing existing event
      setCalendarEvents(prev => prev.map(evt => evt.id === modalData.id ? modalData : evt));
      showToast(`Successfully updated: "${modalData.title}"`);
    }
    setIsModalOpen(false);
  };

  // Delete event from Modal
  const handleDeleteEvent = () => {
    if (!modalData.id) return;
    setCalendarEvents(prev => prev.filter(evt => evt.id !== modalData.id));
    if (modalData.taskId) {
      // Return task to the unscheduled list
      setScheduledTaskIds(prev => prev.filter(id => id !== modalData.taskId));
    }
    showToast(`Removed slot: "${modalData.title}"`);
    setIsModalOpen(false);
  };

  // Auto-Scheduling Logic
  const handleAutoSchedule = (task) => {
    for (const day of daysOfWeek) {
      for (const hour of hours) {
        const isOccupied = calendarEvents.some(
          e => e.weekOffset === currentWeekOffset && e.day === day && e.hour === hour
        );
        if (!isOccupied) {
          const newEvent = {
            id: Date.now(),
            day,
            hour,
            title: `🤖 AI Focus: ${task.title}`,
            type: 'ai',
            weekOffset: currentWeekOffset,
            taskId: task.id
          };
          setCalendarEvents(prev => [...prev, newEvent]);
          setScheduledTaskIds(prev => [...prev, task.id]);
          showToast(`Scheduled "${task.title}" to ${day} at ${hour}!`);
          return;
        }
      }
    }
    showToast("No empty slots found in this week!", "error");
  };

  // Get active unscheduled tasks
  const unscheduledTasks = tasks.filter(t => !t.completed && !scheduledTaskIds.includes(t.id));

  // Focus Slots Count
  const focusSlotsCount = calendarEvents.filter(e => e.weekOffset === currentWeekOffset && e.type === 'ai').length;

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
            
            {/* Days Column Headers (Sticky top-0 inside scrollable wrapper) */}
            <div className="grid grid-cols-8 gap-4 border-b border-white/5 pb-4 mb-4 sticky top-0 bg-[#090909] z-20">
              <div className="text-xs font-tech font-bold uppercase tracking-wider text-white/35 text-center bg-[#090909] py-1">Time</div>
              {weekDates.map((d) => (
                <div key={d.dayOfWeek} className="text-center bg-[#090909] py-1 flex flex-col items-center">
                  <span className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/35">{d.dayOfWeek}</span>
                  <span className="text-xs font-bold text-white mt-0.5">{d.dateNum}</span>
                </div>
              ))}
            </div>

            {/* Time Grid Rows */}
            <div className="space-y-3.5 flex-1">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 gap-4 items-center">
                  {/* Time column */}
                  <div className="text-xs font-bold text-white/40 text-center">{hour}</div>
                  
                  {/* Days cells */}
                  {daysOfWeek.map((day) => {
                    const match = filteredEvents.find(e => e.day === day && e.hour === hour);
                    return (
                      <div 
                        key={day} 
                        onClick={() => handleCellClick(day, hour)}
                        className={`min-h-[52px] rounded-xl border transition-all duration-300 flex flex-col justify-center relative overflow-hidden cursor-pointer ${
                          match 
                            ? match.type === 'ai'
                              ? 'bg-[#E5B842]/5 border border-[#E5B842]/20 hover:border-[#E5B842]/40 text-[#E5B842] shadow-[0_4px_12px_rgba(229,184,66,0.04)]'
                              : match.type === 'deadline'
                                ? 'bg-status-red/[0.05] border border-status-red/20 hover:border-status-red/40 text-status-red shadow-[0_4px_12px_rgba(255,95,95,0.04)]'
                                : 'bg-status-blue/[0.05] border border-status-blue/20 hover:border-status-blue/40 text-status-blue shadow-[0_4px_12px_rgba(74,158,255,0.04)]'
                            : 'bg-transparent border border-white/[0.015] hover:border-white/10 hover:bg-white/[0.01]'
                        }`}
                      >
                        {match ? (
                          <>
                            {/* Left accent border line */}
                            <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                              match.type === 'ai' 
                                ? 'bg-[#E5B842]' 
                                : match.type === 'deadline' 
                                  ? 'bg-status-red' 
                                  : 'bg-status-blue'
                            }`}></div>
                            <div className="pl-3.5 pr-2 py-1.5 min-w-0">
                              <h5 className="text-[10px] font-bold uppercase truncate leading-tight tracking-wider">{match.title}</h5>
                              <span className="text-[8px] opacity-60 font-semibold uppercase mt-0.5 block">{match.type} block</span>
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
                  checked={layerFilters.ai} 
                  onChange={e => setLayerFilters(prev => ({ ...prev, ai: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/10 text-[#E5B842] focus:ring-0 focus:ring-offset-0 bg-black cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                  <span className="w-2.5 h-2.5 rounded bg-[#E5B842] inline-block shadow-[0_0_8px_rgba(229,184,66,0.4)]"></span>
                  AI Focus Blocks
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group text-xs text-white/70 hover:text-white transition-colors">
                <input 
                  type="checkbox" 
                  checked={layerFilters.user} 
                  onChange={e => setLayerFilters(prev => ({ ...prev, user: e.target.checked }))}
                  className="w-4 h-4 rounded border-white/10 text-status-blue focus:ring-0 focus:ring-offset-0 bg-black cursor-pointer"
                />
                <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                  <span className="w-2.5 h-2.5 rounded bg-status-blue inline-block shadow-[0_0_8px_rgba(74,158,255,0.4)]"></span>
                  User Meetings
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
                  Deadline Hazards
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
              ResQ proactively analyzes your empty spots and populates "Focus Blocks" to ensure tasks are completed way before deadline hazards.
            </p>

            <div className="flex items-center gap-2 p-2.5 bg-black/60 rounded-xl border border-[#E5B842]/20">
              <Check className="w-3.5 h-3.5 text-[#E5B842]" />
              <span className="text-[10px] font-bold text-[#E5B842] uppercase tracking-wide">
                {focusSlotsCount} focus slots booked this week
              </span>
            </div>
          </div>

          {/* Integrations Panel */}
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/70">Outlook Calendar</span>
                <button 
                  onClick={() => setSyncSettings(prev => ({ ...prev, outlook: !prev.outlook }))}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer ${syncSettings.outlook ? 'bg-[#E5B842]' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-300 ${syncSettings.outlook ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/70">Auto-Pilot Shield</span>
                <button 
                  onClick={() => setSyncSettings(prev => ({ ...prev, autopilot: !prev.autopilot }))}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-300 relative cursor-pointer ${syncSettings.autopilot ? 'bg-[#E5B842]' : 'bg-white/10'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform duration-300 ${syncSettings.autopilot ? 'translate-x-4' : 'translate-x-0'}`} />
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
                  <div key={task.id} className="p-3 bg-black/40 border border-white/[0.03] rounded-xl hover:border-white/10 transition-all duration-300 space-y-2">
                    <h5 className="text-xs font-bold text-white/80 leading-none truncate">{task.title}</h5>
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase">
                      <span className="text-white/40 flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" /> {task.duration}m</span>
                      <span 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAutoSchedule(task);
                        }}
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
                {modalData.id ? 'Manage Schedule Slot' : 'Book Schedule Slot'}
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

              {/* Event Type selection tabs */}
              <div>
                <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-2">Layer Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'ai', label: '🤖 AI Block', activeClass: 'border-[#E5B842] bg-[#E5B842]/10 text-[#E5B842] shadow-[0_0_12px_rgba(229,184,66,0.1)]', inactiveClass: 'border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04]' },
                    { key: 'user', label: '👤 User Block', activeClass: 'border-status-blue bg-status-blue/10 text-status-blue shadow-[0_0_12px_rgba(74,158,255,0.1)]', inactiveClass: 'border-white/5 bg-white/[0.02] text-white/40 hover:text-white hover:bg-white/[0.04]' },
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

              {/* Day & Time columns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Day</label>
                  <select 
                    value={modalData.day} 
                    onChange={e => setModalData(prev => ({ ...prev, day: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-colors cursor-pointer"
                  >
                    {daysOfWeek.map(d => <option key={d} value={d} className="bg-[#0A0A0A]">{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-tech font-bold uppercase tracking-wider text-white/40 block mb-1.5">Time Slot</label>
                  <select 
                    value={modalData.hour} 
                    onChange={e => setModalData(prev => ({ ...prev, hour: e.target.value }))}
                    className="w-full bg-black/60 border border-white/10 hover:border-white/20 focus:border-[#E5B842]/50 rounded-xl px-3 py-2.5 text-xs text-white outline-none transition-colors cursor-pointer"
                  >
                    {hours.map(h => <option key={h} value={h} className="bg-[#0A0A0A]">{h}</option>)}
                  </select>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
                <div>
                  {modalData.id && (
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
