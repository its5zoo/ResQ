import { ShieldAlert, Timer, Flame, Zap, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

function RescueModeAnimation() {
  const [countdown, setCountdown] = useState(52 * 60); // 52 minutes in seconds
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState([false, false, false, false]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 52 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const cycler = setInterval(() => {
      setStep(s => (s + 1) % 4);
    }, 3500);
    return () => clearInterval(cycler);
  }, []);

  const mins = String(Math.floor(countdown / 60)).padStart(2, '0');
  const secs = String(countdown % 60).padStart(2, '0');

  const microSteps = [
    "Open the document now",
    "Write the executive summary",
    "Fill in data tables",
    "Send & notify team",
  ];

  const handleCheck = (i) => {
    setChecked(prev => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  return (
    <div className="w-full bg-[#070707] rounded-2xl overflow-hidden font-sans select-none">
      {/* Red top alert bar */}
      <div className="bg-red-900/30 border-b border-red-500/20 px-5 py-3 flex items-center gap-3">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="text-xs font-tech font-bold uppercase tracking-widest text-red-400">
          RESCUE MODE ACTIVE — CRITICAL
        </span>
      </div>

      <div className="p-5">
        {/* Task info */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] font-tech text-white/40 uppercase tracking-widest mb-1">Overdue Task Detected</p>
            <h3 className="text-base font-bold text-white leading-tight">Q3 Financial Report</h3>
            <p className="text-xs text-white/50 mt-0.5">Due at 4:30 PM · 45 min estimated</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-tech text-red-400/70 uppercase tracking-widest mb-1">Time Left</p>
            <p className="text-3xl font-black text-red-400 font-mono tracking-tighter leading-none">{mins}:{secs}</p>
          </div>
        </div>

        {/* Coach message */}
        <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3.5 mb-5">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Flame className="w-3 h-3 text-red-400" />
            </div>
            <p className="text-sm text-white/80 font-medium leading-relaxed">
              "You have {mins} minutes. Focus on <span className="text-red-400 font-bold">the summary only</span>. Ship imperfect over missing."
            </p>
          </div>
        </div>

        {/* Micro steps */}
        <p className="text-[10px] font-tech text-white/40 uppercase tracking-widest mb-3">AI Emergency Plan</p>
        <div className="space-y-2 mb-5">
          {microSteps.map((s, i) => (
            <button
              key={i}
              onClick={() => handleCheck(i)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all duration-300 cursor-pointer ${
                checked[i]
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : i === step && !checked[i]
                  ? 'bg-red-500/5 border-red-500/20'
                  : 'bg-white/[0.02] border-white/5'
              }`}
            >
              {checked[i] ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : i === step ? (
                <span className="w-4 h-4 rounded-full border-2 border-red-400 shrink-0 animate-pulse"></span>
              ) : (
                <span className="w-4 h-4 rounded-full border border-white/20 shrink-0"></span>
              )}
              <span className={`text-sm font-medium ${checked[i] ? 'text-white/40 line-through' : i === step ? 'text-white' : 'text-white/60'}`}>
                {s}
              </span>
            </button>
          ))}
        </div>

        {/* CTA row */}
        <div className="grid grid-cols-2 gap-2.5">
          <button className="py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold tracking-wider uppercase hover:bg-red-400 transition-colors cursor-pointer">
            I'm On It
          </button>
          <button className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs font-bold tracking-wider uppercase hover:bg-white/10 transition-colors cursor-pointer">
            Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RescueModeSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.rescue-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });

      gsap.from('.rescue-img', {
        scale: 0.95,
        opacity: 0,
        y: 30,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%',
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-16 lg:py-32 relative z-10 overflow-hidden bg-black border-b border-white/[0.02]">
      {/* Background red glow — subtle urgency */}
      <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-red-900/5 rounded-full blur-[130px] pointer-events-none -translate-y-1/2"></div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: Animation */}
          <div className="order-2 lg:order-1 relative rescue-img">
            <div className="absolute inset-0 bg-gradient-to-tl from-red-900/20 to-transparent rounded-3xl blur-2xl opacity-40"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-sm p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05] relative bg-[#050505]">
                <RescueModeAnimation />
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -top-6 -right-6 bg-[#0B0B0B] border border-red-500/20 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-bounce-slow" style={{ animationDelay: '1s' }}>
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-400 uppercase tracking-widest mb-0.5">Crisis Mode</p>
                <p className="text-sm font-semibold text-white/80">AI Intervening</p>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 rescue-text">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="text-sm font-bold uppercase tracking-widest text-red-400">Autonomous Crisis Response</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] rescue-text">
              Never miss a deadline<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-300">
                again. Ever.
              </span>
            </h2>

            <p className="text-lg text-white/50 font-light leading-relaxed rescue-text max-w-xl">
              When a task is unstarted with 60 minutes left, ResQ triggers <strong className="text-white/80">Rescue Mode</strong> — a full-screen emergency takeover. No asking. Just action. Gemini generates an instant step-by-step battle plan and reads it aloud so you can start immediately.
            </p>

            <div className="space-y-6 pt-4 rescue-text">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Timer className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Live Countdown Timer</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    A monospace countdown ticks in real-time. The pressure is visible, real, and motivating.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Zap className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">AI Micro-Step Battle Plan</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    Gemini breaks the task into 4 timed steps you can actually finish. Tick each off as you go.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-1">
                  <Flame className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Voice Coach + Extension Draft</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    ResQ speaks your battle plan aloud and — if needed — drafts a professional delay email in one tap.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
