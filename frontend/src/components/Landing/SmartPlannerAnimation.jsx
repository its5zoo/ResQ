import { useState, useEffect, useRef } from 'react';
import { Mic, Brain, CheckCircle2, Circle, Flame, Sparkles, BookOpen, Calendar } from 'lucide-react';

const PLAN_DAYS = [
  { day: 1, title: 'Install VS Code & Python', desc: 'Set up your development environment. Verify installation with a Hello World script.', type: 'learn', resource: 'python.org official download' },
  { day: 2, title: 'Variables & Data Types', desc: 'Understand integers, floats, strings, and boolean values in Python. Write simple expressions.', type: 'learn', resource: 'W3Schools Python Variables' },
  { day: 3, title: 'Conditionals & Loops', desc: 'Learn if-else blocks, while loops, and for loops to control program execution flow.', type: 'practice', resource: 'Exercism Python Basics' },
  { day: 4, title: 'Weekly Review: Simple Exercises', desc: 'Solve 5 beginner problems combining variables, conditionals, and loops.', type: 'review', resource: 'ResQ practice suite' },
  { day: 5, title: 'Functions & Scope', desc: 'Learn how to define functions, pass arguments, return values, and understand local vs global scope.', type: 'learn', resource: 'Corey Schafer Functions Video' },
];

export default function SmartPlannerAnimation() {
  const [step, setStep] = useState('voice-request'); // 'voice-request' | 'thinking' | 'speaking' | 'timeline-show' | 'tick-day-1' | 'tick-day-2' | 'tick-day-3' | 'completed'
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [completedDays, setCompletedDays] = useState({ 1: false, 2: false, 3: false, 4: false, 5: false });
  const [streak, setStreak] = useState(0);
  const scrollContainerRef = useRef(null);

  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  const typeString = async (text, setter) => {
    let current = '';
    for (let i = 0; i < text.length; i++) {
      current += text[i];
      setter(current);
      await delay(35);
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      while (mounted) {
        // Reset states
        setStep('voice-request');
        setTranscript('');
        setAiResponse('');
        setCompletedDays({ 1: false, 2: false, 3: false, 4: false, 5: false });
        setStreak(0);
        if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;

        await delay(1200);
        if (!mounted) break;

        // 1. Simulate Voice Request typing
        await typeString('plan my 30 days python programming learning', setTranscript);
        await delay(800);
        if (!mounted) break;

        // 2. Thinking phase
        setStep('thinking');
        await delay(1800);
        if (!mounted) break;

        // 3. Response speaking phase
        setStep('speaking');
        setAiResponse("I've built your 30-day Python curriculum and synced all milestone blocks to your Google Calendar!");
        await delay(2500);
        if (!mounted) break;

        // 4. Reveal the generated Timeline
        setStep('timeline-show');
        await delay(1500);
        if (!mounted) break;

        // 5. Scroll to and tick Day 1
        setStep('tick-day-1');
        await delay(800);
        if (!mounted) break;
        setCompletedDays(prev => ({ ...prev, 1: true }));
        setStreak(1);
        await delay(1200);

        // Scroll down slightly
        if (scrollContainerRef.current && mounted) {
          scrollContainerRef.current.scrollTo({ top: 75, behavior: 'smooth' });
        }

        // 6. Tick Day 2
        setStep('tick-day-2');
        await delay(800);
        if (!mounted) break;
        setCompletedDays(prev => ({ ...prev, 2: true }));
        setStreak(2);
        await delay(1200);

        // Scroll down more
        if (scrollContainerRef.current && mounted) {
          scrollContainerRef.current.scrollTo({ top: 150, behavior: 'smooth' });
        }

        // 7. Tick Day 3
        setStep('tick-day-3');
        await delay(800);
        if (!mounted) break;
        setCompletedDays(prev => ({ ...prev, 3: true }));
        setStreak(3);
        await delay(2500); // Hold final completed state

        // Reset phase
        setStep('reset');
        await delay(800);
      }
    };

    run();
    return () => { mounted = false; };
  }, []);

  const progressPercent = Math.round((Object.values(completedDays).filter(Boolean).length / 30) * 100);

  return (
    <div className="w-full bg-[#050505] text-white p-5 font-sans min-h-[460px] select-none relative overflow-hidden flex flex-col gap-4">
      {/* Background radial gold glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#E5B842]/5 rounded-full blur-[90px] pointer-events-none" />

      {/* STAGE A: Voice Assistant Overlay (Typing & Response) */}
      {(step === 'voice-request' || step === 'thinking' || step === 'speaking') && (
        <div className="flex-grow flex flex-col justify-between py-2 relative z-10">
          
          {/* Header indicator */}
          <div className="flex items-center justify-between">
            <span className="font-display font-black text-sm tracking-tighter flex items-center">
              <span className="text-white/60">Res</span>
              <span className="text-[#E5B842]">Q</span>
            </span>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-tech font-bold uppercase tracking-wider border transition-all duration-500 ${
              step === 'voice-request' ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]' 
              : step === 'thinking' ? 'bg-[#E5B842]/10 border-[#E5B842]/30 text-[#E5B842]'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${step === 'voice-request' ? 'bg-[#00F0FF] animate-pulse' : step === 'thinking' ? 'bg-[#E5B842] animate-spin' : 'bg-emerald-400 animate-pulse'}`}></span>
              {step === 'voice-request' ? 'Listening' : step === 'thinking' ? 'Planning...' : 'Speaking'}
            </div>
          </div>

          {/* Central orb visualizer */}
          <div className="flex flex-col items-center my-6">
            <div className="relative flex items-center justify-center mb-4">
              {step === 'voice-request' && (
                <>
                  <div className="absolute w-24 h-24 rounded-full border border-[#00F0FF]/20 animate-ping" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute w-16 h-16 rounded-full bg-[#00F0FF]/5 animate-pulse"></div>
                </>
              )}
              {step === 'thinking' && (
                <>
                  <div className="absolute w-20 h-20 rounded-full border-2 border-dashed border-[#E5B842]/30 animate-spin" style={{ animationDuration: '3s' }}></div>
                  <div className="absolute w-16 h-16 rounded-full bg-[#E5B842]/5"></div>
                </>
              )}
              {step === 'speaking' && (
                <>
                  <div className="absolute w-20 h-20 rounded-full bg-emerald-500/5 animate-pulse"></div>
                </>
              )}

              <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center z-10 transition-all duration-500 ${
                step === 'voice-request' ? 'bg-[#00F0FF]/15 border border-[#00F0FF]/40 shadow-[0_0_30px_rgba(0,240,255,0.15)]' 
                : step === 'thinking' ? 'bg-[#E5B842]/15 border border-[#E5B842]/40 shadow-[0_0_30px_rgba(229,184,66,0.15)]' 
                : 'bg-emerald-500/15 border border-emerald-500/40 shadow-[0_0_30px_rgba(52,199,89,0.15)]'
              }`}>
                <Mic className={`w-6 h-6 transition-colors duration-300 ${
                  step === 'voice-request' ? 'text-[#00F0FF]' 
                  : step === 'thinking' ? 'text-[#E5B842]' 
                  : 'text-emerald-400'
                }`} />
              </div>
            </div>

            <p className="text-sm font-tech text-white/60 tracking-wider text-center max-w-[280px] h-[40px] flex items-center justify-center leading-relaxed">
              {transcript ? `"${transcript}"` : 'Listening to request...'}
            </p>
          </div>

          {/* Prompt result speech box */}
          <div className={`transition-all duration-500 transform ${aiResponse ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 h-0 overflow-hidden'}`}>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Brain className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <p className="text-white/80 text-xs leading-relaxed font-sans font-medium">{aiResponse}</p>
            </div>
          </div>

        </div>
      )}

      {/* STAGE B: Timeline Dashboard Animation */}
      {(step !== 'voice-request' && step !== 'thinking' && step !== 'speaking') && (
        <div className="flex-grow flex flex-col justify-between relative z-10 animate-fadeIn">
          
          {/* Dashboard plan header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-tech text-[#E5B842] uppercase tracking-widest font-bold">ResQ Smart Planner</span>
                <Sparkles className="w-3 h-3 text-[#E5B842] animate-pulse" />
              </div>
              <h3 className="text-sm font-display font-black text-white mt-0.5">Python Programming Plan</h3>
            </div>

            {/* Streak & Status info */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Progress metric */}
              <div className="text-right">
                <p className="text-[9px] text-white/30 font-tech">PROGRESS</p>
                <p className="text-xs font-bold text-[#E5B842]">{progressPercent}% done</p>
              </div>

              {/* Streak badge */}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border transition-all duration-500 ${
                streak > 0 ? 'bg-[#E5B842]/15 border-[#E5B842]/30 scale-105' : 'bg-white/[0.03] border-white/10'
              }`}>
                <Flame className={`w-3.5 h-3.5 transition-colors ${streak > 0 ? 'text-[#E5B842]' : 'text-white/20'}`} />
                <span className="text-[10px] font-bold font-tech text-white/70">{streak}d</span>
              </div>
            </div>
          </div>

          {/* Scrollable days container */}
          <div 
            ref={scrollContainerRef}
            className="flex-grow overflow-y-auto max-h-[290px] py-3 pr-1 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10"
          >
            {PLAN_DAYS.map((day) => {
              const isCompleted = completedDays[day.day];
              const isTickingNow = 
                (step === 'tick-day-1' && day.day === 1) || 
                (step === 'tick-day-2' && day.day === 2) || 
                (step === 'tick-day-3' && day.day === 3);

              return (
                <div
                  key={day.day}
                  className={`flex gap-3.5 items-start p-3 rounded-xl border transition-all duration-500 ${
                    isTickingNow ? 'bg-[#E5B842]/5 border-[#E5B842]/30 scale-[1.01]' 
                    : isCompleted ? 'bg-white/[0.015] border-white/[0.05] opacity-70' 
                    : 'bg-white/[0.025] border-white/[0.08]'
                  }`}
                >
                  {/* Left node (Day counter & link line) */}
                  <div className="flex flex-col items-center shrink-0">
                    <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center border font-tech font-bold transition-all duration-500 ${
                      isCompleted ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                      : isTickingNow ? 'bg-[#E5B842]/10 border-[#E5B842]/40 text-[#E5B842]' 
                      : 'bg-white/[0.03] border-white/10 text-white/50'
                    }`}>
                      <span className="text-[7px] leading-none text-white/40 uppercase font-light">Day</span>
                      <span className="text-xs mt-0.5 leading-none">{day.day}</span>
                    </div>
                  </div>

                  {/* Center item details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-tech font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        day.type === 'learn' ? 'bg-[#00F0FF]/10 text-[#00F0FF]' 
                        : day.type === 'practice' ? 'bg-[#E5B842]/10 text-[#E5B842]' 
                        : 'bg-purple-500/10 text-purple-400'
                      }`}>
                        {day.type}
                      </span>
                      <span className="text-[9px] text-white/30 truncate max-w-[120px]">{day.resource}</span>
                    </div>

                    <h4 className={`text-xs font-bold mt-1.5 transition-all duration-500 ${isCompleted ? 'text-white/60 line-through' : 'text-white'}`}>
                      {day.title}
                    </h4>
                    <p className="text-[10px] text-white/40 leading-relaxed mt-1 font-light">{day.desc}</p>
                  </div>

                  {/* Right interactive checkmark */}
                  <div className="shrink-0 flex items-center justify-center h-8">
                    <button 
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-300 relative overflow-hidden ${
                        isCompleted ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' 
                        : isTickingNow ? 'bg-[#E5B842]/20 border-[#E5B842]/60 text-[#E5B842] scale-110' 
                        : 'bg-white/[0.02] border-white/20 hover:border-white/45 text-white/20'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 animate-[checkmark_0.4s_ease-out]" />
                      ) : isTickingNow ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E5B842] animate-ping" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 opacity-50" />
                      )}
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Bottom sync status bar */}
          <div className="border-t border-white/5 pt-3 mt-auto flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[9px] text-white/35 font-tech">
              <Calendar className="w-3 h-3 text-[#E5B842]/60" />
              <span>Google Calendar Sync: Active (30 slots scheduled)</span>
            </div>
            
            <div className="w-28 bg-white/5 h-1 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#E5B842] to-emerald-400 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
