import { useState, useEffect } from 'react';
import { Plus, Check, Sparkles, Trash2 } from 'lucide-react';
import { habits as apiHabits } from '../../services/api.js';

export default function HabitsPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [selectedDays, setSelectedDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const data = await apiHabits.getAll();
      setHabits(data || []);
    } catch (err) {
      console.error('Error fetching habits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchHabits();
    };
    load();
  }, []);

  const toggleDaySelection = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      const created = await apiHabits.create({
        name: title,
        targetDays: [...selectedDays]
      });
      setHabits(prev => [...prev, created]);
      setTitle('');
      setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
      showToast(`Added habit: "${created.name}"`);
    } catch {
      showToast('Error creating habit', 'error');
    }
  };

  const toggleToday = async (id) => {
    try {
      const updated = await apiHabits.markComplete(id);
      setHabits(prev => prev.map(h => h._id === id ? updated : h));
      showToast('Habit completed today!');

      // Poll habit updates for AI insight if it was created asynchronously in the background
      setTimeout(async () => {
        const refetched = await apiHabits.getAll();
        setHabits(refetched || []);
      }, 3000);

    } catch {
      showToast('Error completing habit', 'error');
    }
  };

  const handleDeleteHabit = async (id) => {
    try {
      await apiHabits.delete(id);
      setHabits(prev => prev.filter(h => h._id !== id));
      showToast('Habit removed');
    } catch {
      showToast('Error removing habit', 'error');
    }
  };

  // Helper to determine week dates
  const getWeekDates = () => {
    const now = new Date();
    const currentDay = now.getDay();
    const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      dates.push({
        dayName: daysOfWeek[i],
        dateObj: d
      });
    }
    return dates;
  };
  
  const weekDays = getWeekDates();

  const isHabitCompletedOnDate = (completions = [], targetDateObj) => {
    const targetTime = new Date(targetDateObj).setHours(0, 0, 0, 0);
    return completions.some(c => {
      const d = new Date(c.date).setHours(0, 0, 0, 0);
      return d === targetTime && c.completed;
    });
  };

  return (
    <div className="space-y-5 lg:space-y-8 animate-fade-in font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <span className="text-xs lg:text-sm font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-1.5 lg:mb-2">MOMENTUM CHIPS</span>
          <h2 className="text-2xl lg:text-3xl font-display font-black tracking-tight text-white leading-none">
            Daily Habits &amp; Streaks
          </h2>
        </div>
      </div>

      {/* Add Habit Panel */}
      <form onSubmit={handleAddHabit} className="p-4 lg:p-6 bg-[#090909] border border-white/[0.04] rounded-2xl flex flex-col gap-4 layered-shadow-lg">
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <input 
            type="text"
            placeholder="What habit are you locking in? (e.g. Meditate for 10m)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none transition-all duration-300"
            required
          />
          <button 
            type="submit"
            className="sm:shrink-0 px-6 py-3 bg-transparent text-[#E5B842] border border-[#E5B842]/40 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
            style={{ minHeight: 'auto' }}
          >
            <Plus className="w-4 h-4" /> Add Habit
          </button>
        </div>

        {/* Selected Days Selector */}
        <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/5 w-full">
          <div className="flex items-center justify-between">
            <span className="text-sm font-tech font-bold uppercase tracking-wider text-white/70">Target Days Schedule</span>
            <span className="text-sm text-white/60 font-bold uppercase tracking-wider">
              {selectedDays.length === 7 ? 'Daily' : `${selectedDays.length} days a week`}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {daysOfWeek.map(day => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDaySelection(day)}
                  className={`px-3.5 py-2 rounded-xl border text-sm font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                    isSelected 
                      ? 'bg-[#E5B842]/10 border-[#E5B842]/30 text-[#E5B842] shadow-[0_0_12px_rgba(229,184,66,0.06)]' 
                      : 'bg-black/40 border-white/5 text-white/70 hover:text-white hover:border-white/10'
                  }`}
                >
                  {day}
                </button>
              );
            })}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedDays(daysOfWeek)}
                className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-sm font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setSelectedDays([])}
                className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.04] text-sm font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors cursor-pointer"
              >
                None
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Habits rows listing */}
      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2].map(n => (
              <div key={n} className="h-32 bg-white/5 rounded-3xl"></div>
            ))}
          </div>
        ) : (
          habits.map((habit) => {
            const targetDaysLabel = habit.targetDays 
              ? habit.targetDays.length === 7 
                ? 'Daily' 
                : `${habit.targetDays.length} days a week (${habit.targetDays.join(', ')})`
              : 'Daily';

            const today = new Date();
            const doneToday = isHabitCompletedOnDate(habit.completions, today);

            return (
              <div key={habit._id} className="p-6 bg-[#090909] border border-white/[0.04] rounded-3xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center layered-shadow-lg">
                
                {/* Left Col: Info details */}
                <div className="lg:col-span-4 flex items-center justify-between lg:justify-start gap-4">
                  <button 
                    onClick={() => toggleToday(habit._id)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-300 cursor-pointer ${
                      doneToday 
                        ? 'bg-[#E5B842] border-[#E5B842] text-black shadow-lg shadow-[#E5B842]/20' 
                        : 'bg-black border-white/10 text-white/60 hover:border-[#E5B842]/30 hover:text-white'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                  </button>

                  <div className="flex-1 min-w-0">
                    <h3 className={`text-sm font-bold truncate ${doneToday ? 'line-through text-white/70' : 'text-white/85'}`}>
                      {habit.name}
                    </h3>
                    <div className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-white/60 mt-1.5">
                      <span>Streak: <span className="text-[#E5B842] font-extrabold">🔥 {habit.streak || 0}d</span></span>
                    </div>
                    <div className="text-sm font-tech font-bold uppercase tracking-wider text-white/70 mt-1">
                      Target: <span className="text-[#E5B842]/80 font-bold">{targetDaysLabel}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteHabit(habit._id)}
                    className="text-white/50 hover:text-red-500 transition-colors p-2 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Right Col: 7 Day Heatmap */}
                <div className="lg:col-span-8 flex flex-col gap-2.5">
                  <span className="text-sm uppercase font-bold text-white/60 tracking-widest text-left">Weekly Heatmap Matrix</span>
                  <div className="grid grid-cols-7 gap-2">
                    {weekDays.map((dayObj) => {
                      const completed = isHabitCompletedOnDate(habit.completions, dayObj.dateObj);
                      const isTarget = habit.targetDays ? habit.targetDays.includes(dayObj.dayName) : true;
                      
                      return (
                        <div 
                          key={dayObj.dayName} 
                          className={`p-3 rounded-xl border flex flex-col items-center justify-center transition-all duration-300 ${
                            completed 
                              ? 'bg-[#E5B842]/5 border border-[#E5B842]/20 text-[#E5B842] shadow-sm' 
                              : isTarget 
                                ? 'bg-black/50 border border-white/[0.02] text-white/50' 
                                : 'bg-transparent border border-dashed border-white/5 text-white/10'
                          }`}
                        >
                          <span className="text-sm uppercase font-bold mb-1">{dayObj.dayName}</span>
                          {isTarget ? (
                            <div className={`w-1.5 h-1.5 rounded-full ${completed ? 'bg-[#E5B842]' : 'bg-white/15'}`}></div>
                          ) : (
                            <span className="text-sm opacity-25 font-bold uppercase">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Insight & Tip Card */}
                {(habit.aiInsight || habit.aiTip) && (
                  <div className="lg:col-span-12 mt-4 p-4 bg-[#E5B842]/5 border border-[#E5B842]/20 rounded-2xl space-y-2 animate-fade-in">
                    <div className="flex items-center gap-1.5 text-sm font-bold text-[#E5B842] uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" /> AI Momentum Analysis
                    </div>
                    {habit.aiInsight && (
                      <p className="text-sm text-white/80 leading-relaxed font-normal">
                        <span className="font-bold text-white/90">Insight:</span> {habit.aiInsight}
                      </p>
                    )}
                    {habit.aiTip && (
                      <p className="text-sm text-white/70 leading-relaxed font-normal">
                        <span className="font-bold text-[#E5B842]/95">Improvement Tip:</span> {habit.aiTip}
                      </p>
                    )}
                  </div>
                )}

              </div>
            );
          })
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-20 lg:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-50 px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl flex items-center gap-3 animate-fade-in ${
          toast.type === 'error' 
            ? 'bg-status-red/10 border-status-red/30 text-status-red' 
            : 'bg-black/90 border-[#E5B842]/30 text-[#E5B842]'
        }`}>
          <Check className="w-4 h-4" />
          <span className="text-sm font-bold tracking-wide uppercase">{toast.message}</span>
        </div>
      )}

    </div>
  );
}
