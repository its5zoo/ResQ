import React, { useState } from 'react';
import { 
  Sparkles, 
  Cpu, 
  Clock, 
  Flame, 
  AlertTriangle, 
  CheckCircle2, 
  Circle,
  Calendar,
  ChevronRight,
  TrendingUp,
  Inbox,
  MoreVertical
} from 'lucide-react';

export default function DashboardHome({ 
  tasks, 
  toggleTask, 
  habits, 
  toggleHabit, 
  setCurrentTab 
}) {
  const pendingTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);
  const completedRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;
  
  // Calculate highest priority task
  const topTask = pendingTasks.length > 0 
    ? [...pendingTasks].sort((a, b) => b.urgency - a.urgency)[0] 
    : null;

  // Deadline Risk calculation
  const hasCritical = pendingTasks.some(t => t.urgency >= 9);
  const riskText = hasCritical ? 'URGENT HAZARD' : pendingTasks.length > 0 ? 'MODERATE' : 'OPTIMIZED';

  // Mock Calendar events
  const calendarEvents = [
    { time: '10:00 AM', title: 'Sync with Team (Vibe2Ship)', duration: '30m', type: 'meeting' },
    { time: '01:30 PM', title: 'PostgreSQL Database migration', duration: '60m', type: 'work' },
    { time: '04:00 PM', title: '🤖 AI Focus block: React UI integration', duration: '45m', type: 'focus' }
  ];

  return (
    <div className="space-y-10 animate-fade-in py-6">
      
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-8 font-sans">
        <div>
          <span className="text-xs font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-2">WORKSPACE HUB</span>
          <h2 className="text-3xl font-display font-black tracking-tight leading-tight">
            <span className="text-white">Welcome back, Faizaan! </span>
            <span className="text-white/40">Here's your status.</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-white/40">Active Scope:</span>
          <div className="flex items-center gap-2 px-3.5 py-1.5 bg-black border border-white/[0.06] rounded-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-white/80">
              Google Calendar Linked
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5B842] shadow-[0_0_8px_rgba(229,184,66,0.8)]"></span>
          </div>
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
              <span className="text-2xl font-bold text-white">7 Days</span>
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
            {/* Embedded Microchip with AI */}
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
              {topTask ? (
                <p className="text-sm text-white/70 leading-relaxed font-normal mb-6 tracking-normal">
                  "You have an upcoming deadline for <span className="font-bold text-white">'{topTask.title}'</span> which carries an urgency factor of {topTask.urgency}. I recommend jumping onto this immediately. I've automatically reserved 45 minutes on your Google Calendar to tackle it."
                </p>
              ) : (
                <p className="text-sm text-[#E5B842] leading-relaxed font-normal mb-6 tracking-normal">
                  "No pending high-priority tasks found. All deadlines are securely buffered. It's an excellent window to focus on habit accumulation or career upskilling."
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => setCurrentTab('calendar')}
                className="px-5 py-3 bg-transparent text-[#E5B842] border border-[#E5B842]/40 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer font-sans active:scale-[0.98]"
              >
                <Calendar className="w-4 h-4" /> Open Calendar block
              </button>
              <button 
                onClick={() => setCurrentTab('voice')}
                className="px-5 py-3 border border-white/10 hover:bg-white/5 text-white/80 hover:text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer font-sans"
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
              {pendingTasks.slice(0, 4).map((task) => (
                <div 
                  key={task.id} 
                  className="p-5 bg-black border border-white/[0.03] rounded-2xl hover:border-white/10 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTask(task.id);
                        }}
                        className="text-white/30 hover:text-white transition-colors focus:outline-hidden cursor-pointer"
                      >
                        <Circle className="w-5 h-5" />
                      </button>
                      <span className="text-sm font-medium text-white/80 truncate">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#E5B842]/5 border border-[#E5B842]/20 text-[#E5B842]">
                        Priority {task.urgency}
                      </span>
                      <span className="text-xs text-white/45 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {task.dueDate}
                      </span>
                      <button className="text-white/30 hover:text-white cursor-pointer">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Task Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#E5B842] to-[#C97D2E] rounded-full" style={{ width: '25%' }}></div>
                    </div>
                  </div>
                </div>
              ))}

              {pendingTasks.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-8 h-8 text-status-green/30 mx-auto mb-3" />
                  <p className="text-xs text-white/35 font-light">Zero high priority tasks pending. Excellent job!</p>
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
              <button className="text-white/30 hover:text-white cursor-pointer">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {calendarEvents.map((evt, idx) => (
                <div key={idx} className="flex gap-4 items-start relative pl-4 border-l-2 border-[#E5B842]/20 py-1">
                  {/* Glowing gold dot exactly on the line */}
                  <div className="absolute top-[10px] -left-[6px] w-2.5 h-2.5 rounded-full bg-[#E5B842] border-2 border-black shadow-[0_0_6px_rgba(229,184,66,0.6)]"></div>
                  <div>
                    <span className="text-[10px] text-white/40 font-bold block mb-0.5">{evt.time} ({evt.duration})</span>
                    <h5 className={`text-xs font-semibold ${evt.type === 'focus' ? 'text-white' : 'text-white/80'}`}>
                      {evt.title}
                    </h5>
                  </div>
                </div>
              ))}
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
              {habits.map((habit) => {
                const isGym = habit.title.toLowerCase().includes('gym');
                const progressFill = isGym ? '100%' : '40%';
                const streakText = isGym ? '7 days streak' : '3 days streak';

                return (
                  <div key={habit.id} className="space-y-2.5">
                    <div className="flex items-center justify-between p-4 bg-black border border-white/[0.03] rounded-2xl">
                      <div className="flex items-center gap-3 min-w-0">
                        <button 
                          onClick={() => toggleHabit(habit.id)}
                          className="focus:outline-hidden cursor-pointer"
                        >
                          {habit.completedToday ? (
                            <CheckCircle2 className="w-4.5 h-4.5 text-[#E5B842]" />
                          ) : (
                            <Circle className="w-4.5 h-4.5 text-white/20 hover:text-white/40" />
                          )}
                        </button>
                        <span className={`text-xs font-medium truncate ${habit.completedToday ? 'line-through text-white/30' : 'text-white/70'}`}>
                          {habit.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#E5B842] font-bold shrink-0">🔥 {habit.streak}d</span>
                    </div>

                    {/* Progress Bar & Subtext */}
                    <div className="px-1 space-y-1">
                      <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#E5B842] to-[#C97D2E] rounded-full" style={{ width: progressFill }}></div>
                      </div>
                      <span className="text-[9px] text-white/35 font-medium block">
                        {streakText}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
