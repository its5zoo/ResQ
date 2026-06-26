import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Flame, TrendingUp, Droplets, BookOpen, Dumbbell, Moon } from 'lucide-react';

const HABITS = [
  { id: 1, icon: Droplets,  label: 'Drink Water',    color: '#60A5FA', streak: 14, target: 7 },
  { id: 2, icon: Dumbbell,  label: 'Workout',        color: '#E5B842', streak: 6,  target: 5 },
  { id: 3, icon: BookOpen,  label: 'Read 20 mins',   color: '#A78BFA', streak: 21, target: 7 },
  { id: 4, icon: Moon,      label: 'Sleep by 11pm',  color: '#34D399', streak: 3,  target: 5 },
];

// Each row = 7 day cells (this week). true = completed, false = missed
const WEEK_DATA = {
  1: [true,  true,  true,  true,  true,  true,  null],
  2: [true,  false, true,  true,  true,  true,  null],
  3: [true,  true,  true,  true,  true,  true,  null],
  4: [false, true,  false, true,  true,  null,  null],
};

export default function HabitsAnimation() {
  // Which habit is currently being "checked off" — cycles through them
  const [completingId, setCompletingId] = useState(null);
  const [todayDone, setTodayDone] = useState({ 1: false, 2: false, 3: false, 4: false });
  const [phase, setPhase] = useState('idle'); // idle | checking | done | reset

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      while (mounted) {
        // Pause at start
        await delay(1500);
        if (!mounted) break;

        // Check habits one by one
        for (const h of HABITS) {
          if (!mounted) break;
          setCompletingId(h.id);
          setPhase('checking');
          await delay(700);
          if (!mounted) break;
          setTodayDone(prev => ({ ...prev, [h.id]: true }));
          setPhase('done');
          setCompletingId(null);
          await delay(600);
        }

        // Hold the "all done" state
        await delay(2500);
        if (!mounted) break;

        // Reset
        setPhase('reset');
        setTodayDone({ 1: false, 2: false, 3: false, 4: false });
        await delay(800);
        setPhase('idle');
      }
    };

    run();
    return () => { mounted = false; };
  }, []);

  const allDone = Object.values(todayDone).every(Boolean);

  return (
    <div className="w-full bg-[#050505] text-white p-5 font-sans min-h-[340px] select-none relative overflow-hidden flex flex-col gap-4">
      
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#E5B842]/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Header row */}
      <div className="flex items-center justify-between relative z-10">
        <div>
          <p className="text-[10px] font-tech text-[#E5B842] uppercase tracking-widest">This Week</p>
          <p className="text-base font-display font-black text-white mt-0.5 leading-tight">Habit Tracker</p>
        </div>

        {/* Streak badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all duration-500
          ${allDone
            ? 'bg-[#E5B842]/15 border-[#E5B842]/30'
            : 'bg-white/[0.03] border-white/10'}`}>
          <Flame className={`w-4 h-4 transition-colors duration-500 ${allDone ? 'text-[#E5B842]' : 'text-white/30'}`} />
          <span className={`text-xs font-bold transition-colors duration-500 ${allDone ? 'text-[#E5B842]' : 'text-white/40'}`}>
            {allDone ? 'Perfect Day!' : 'Streak On'}
          </span>
        </div>
      </div>

      {/* 7-day column headers */}
      <div className="grid grid-cols-[1fr_auto] gap-3 relative z-10">
        <div /> {/* habit label spacer */}
        <div className="grid grid-cols-7 gap-1 w-[154px]">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <p key={i} className="text-[9px] font-tech text-white/25 text-center uppercase">{d}</p>
          ))}
        </div>
      </div>

      {/* Habit rows */}
      <div className="flex flex-col gap-2.5 relative z-10">
        {HABITS.map((habit) => {
          const Icon = habit.icon;
          const isCompleting = completingId === habit.id;
          const isDone = todayDone[habit.id];

          return (
            <div
              key={habit.id}
              className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-all duration-500
                ${isCompleting ? 'bg-[#E5B842]/8 border-[#E5B842]/25 scale-[1.01]' : isDone ? 'bg-white/[0.025] border-white/[0.07]' : 'bg-white/[0.015] border-white/[0.04]'}`}
            >
              {/* Icon + label */}
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-500"
                  style={{ backgroundColor: `${habit.color}18`, borderColor: `${habit.color}35`, border: '1px solid' }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: habit.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white/80 truncate">{habit.label}</p>
                  <p className="text-[9px] text-white/35 font-tech">{habit.streak}d streak</p>
                </div>
              </div>

              {/* Weekly heatmap cells */}
              <div className="grid grid-cols-7 gap-1 shrink-0 w-[154px]">
                {[0,1,2,3,4,5,6].map((dayIdx) => {
                  const val = WEEK_DATA[habit.id][dayIdx];
                  const isToday = dayIdx === 6;
                  const todayCompleted = isToday && isDone;

                  return (
                    <div
                      key={dayIdx}
                      className={`w-4.5 h-4.5 rounded-[4px] flex items-center justify-center transition-all duration-400
                        ${isToday && isCompleting ? 'scale-125' : 'scale-100'}`}
                      style={{ width: 18, height: 18 }}
                    >
                      {isToday ? (
                        <div
                          className="w-full h-full rounded-[4px] transition-all duration-500 flex items-center justify-center"
                          style={{
                            backgroundColor: todayCompleted ? `${habit.color}30` : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${todayCompleted ? habit.color + '60' : 'rgba(255,255,255,0.08)'}`,
                          }}
                        >
                          {todayCompleted && (
                            <CheckCircle2 className="w-2.5 h-2.5" style={{ color: habit.color }} />
                          )}
                          {!todayCompleted && isCompleting && (
                            <div className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: habit.color }} />
                          )}
                        </div>
                      ) : val === true ? (
                        <div
                          className="w-full h-full rounded-[4px]"
                          style={{ backgroundColor: `${habit.color}35`, border: `1px solid ${habit.color}55` }}
                        />
                      ) : val === false ? (
                        <div className="w-full h-full rounded-[4px] bg-white/[0.02] border border-white/[0.05]" />
                      ) : (
                        <div className="w-full h-full rounded-[4px] border border-dashed border-white/[0.06]" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom summary bar */}
      <div className="mt-auto flex items-center justify-between px-2 relative z-10">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-[#E5B842]/60" />
          <span className="text-[10px] text-white/35 font-tech">
            {Object.values(todayDone).filter(Boolean).length}/{HABITS.length} completed today
          </span>
        </div>

        {/* Progress dots */}
        <div className="flex gap-1">
          {HABITS.map((h) => (
            <div
              key={h.id}
              className="w-1.5 h-1.5 rounded-full transition-all duration-500"
              style={{ backgroundColor: todayDone[h.id] ? h.color : 'rgba(255,255,255,0.12)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
