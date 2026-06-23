import React, { useState } from 'react';
import { Flame, Plus, Check, Award, AlertCircle } from 'lucide-react';

export default function HabitsPage() {
  const [habits, setHabits] = useState([
    { id: 1, title: 'Gym Workout Routine', streak: 7, longest: 14, completions: [0, 1, 1, 1, 1, 1, 1], doneToday: true },
    { id: 2, title: 'Drink 3L of Water', streak: 12, longest: 30, completions: [1, 1, 1, 1, 0, 1, 1], doneToday: true },
    { id: 3, title: 'Focus Reading (30m)', streak: 3, longest: 8, completions: [0, 0, 1, 0, 1, 1, 0], doneToday: false }
  ]);

  const [title, setTitle] = useState('');

  const toggleToday = (id) => {
    setHabits(habits.map(h => {
      if (h.id !== id) return h;
      const updatedDone = !h.doneToday;
      const updatedStreak = updatedDone ? h.streak + 1 : Math.max(0, h.streak - 1);
      const updatedCompletions = [...h.completions];
      updatedCompletions[6] = updatedDone ? 1 : 0;
      return {
        ...h,
        doneToday: updatedDone,
        streak: updatedStreak,
        completions: updatedCompletions
      };
    }));
  };

  const handleAddHabit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newHabit = {
      id: Date.now(),
      title,
      streak: 0,
      longest: 0,
      completions: [0, 0, 0, 0, 0, 0, 0],
      doneToday: false
    };
    setHabits([...habits, newHabit]);
    setTitle('');
  };

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <span className="text-xs font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-2">MOMENTUM CHIPS</span>
          <h2 className="text-3xl font-display font-black tracking-tight text-white leading-none">
            Daily Habits & Streaks
          </h2>
        </div>
      </div>

      {/* Add Habit Panel */}
      <form onSubmit={handleAddHabit} className="p-6 bg-[#090909] border border-white/[0.04] rounded-2xl flex gap-3 layered-shadow-lg">
        <input 
          type="text"
          placeholder="What habit are you locking in? (e.g. Meditate for 10m)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="flex-1 bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-hidden transition-all duration-300"
          required
        />
        <button 
          type="submit"
          className="px-6 py-3 bg-transparent text-[#E5B842] border border-[#E5B842]/40 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Add Habit
        </button>
      </form>

      {/* Habits rows listing */}
      <div className="space-y-6">
        {habits.map((habit) => (
          <div key={habit.id} className="p-6 bg-[#090909] border border-white/[0.04] rounded-3xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center layered-shadow-lg">
            
            {/* Left Col: Info details */}
            <div className="lg:col-span-4 flex items-center justify-between lg:justify-start gap-4">
              <button 
                onClick={() => toggleToday(habit.id)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 cursor-pointer ${
                  habit.doneToday 
                    ? 'bg-[#E5B842] border-[#E5B842] text-black shadow-lg shadow-[#E5B842]/20' 
                    : 'bg-black border-white/10 text-white/30 hover:border-[#E5B842]/30 hover:text-white'
                }`}
              >
                <Check className="w-5 h-5" />
              </button>

              <div>
                <h3 className={`text-xs font-bold ${habit.doneToday ? 'line-through text-white/40' : 'text-white/85'}`}>{habit.title}</h3>
                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-wider text-white/30 mt-1.5">
                  <span>Current: <span className="text-[#E5B842] font-extrabold">🔥 {habit.streak}d</span></span>
                  <span>Longest: <span className="text-[#E5B842]/70">🏆 {habit.longest}d</span></span>
                </div>
              </div>
            </div>

            {/* Right Col: 7 Day Heatmap */}
            <div className="lg:col-span-8 flex flex-col gap-2.5">
              <span className="text-[10px] uppercase font-bold text-white/30 tracking-widest text-left">Weekly Heatmap Matrix</span>
              <div className="grid grid-cols-7 gap-2">
                {daysOfWeek.map((day, dIdx) => {
                  const completed = habit.completions[dIdx] === 1;
                  return (
                    <div 
                      key={day} 
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 ${
                        completed 
                          ? 'bg-[#E5B842]/5 border border-[#E5B842]/20 text-[#E5B842] shadow-sm' 
                          : 'bg-black/50 border border-white/[0.02] text-white/20'
                      }`}
                    >
                      <span className="text-[9px] uppercase font-bold mb-1">{day}</span>
                      <div className={`w-1.5 h-1.5 rounded-full ${completed ? 'bg-[#E5B842]' : 'bg-white/15'}`}></div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

