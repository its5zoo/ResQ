import { MessageSquare, Repeat, Zap, Mic } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

function ProcrastinationAnimation() {
  const [strategyIdx, setStrategyIdx] = useState(0);
  const [animating, setAnimating] = useState(false);

  const strategies = [
    {
      id: 'A',
      label: 'Strategy A — Micro Action',
      color: 'text-[#E5B842]',
      borderColor: 'border-[#E5B842]/20',
      bgColor: 'bg-[#E5B842]/5',
      badgeBg: 'bg-[#E5B842]/10 border-[#E5B842]/20',
      badgeText: 'text-[#E5B842]',
      icon: <Zap className="w-4 h-4 text-[#E5B842]" />,
      task: 'Update API Documentation',
      dismissCount: 4,
      message: 'Just do THIS:',
      action: 'Open docs.md and write the auth section header — 5 min max.',
      timer: '05:00',
    },
    {
      id: 'B',
      label: 'Strategy B — Blocker Probe',
      color: 'text-[#00F0FF]',
      borderColor: 'border-[#00F0FF]/20',
      bgColor: 'bg-[#00F0FF]/5',
      badgeBg: 'bg-[#00F0FF]/10 border-[#00F0FF]/20',
      badgeText: 'text-[#00F0FF]',
      icon: <Mic className="w-4 h-4 text-[#00F0FF]" />,
      task: 'Update API Documentation',
      dismissCount: 4,
      message: "What's stopping you?",
      action: 'Blocker identified: "clarity" → Break into subtasks first. Reschedule to 3 PM.',
      timer: null,
    },
    {
      id: 'C',
      label: 'Strategy C — Emotional Anchor',
      color: 'text-purple-400',
      borderColor: 'border-purple-400/20',
      bgColor: 'bg-purple-400/5',
      badgeBg: 'bg-purple-400/10 border-purple-400/20',
      badgeText: 'text-purple-400',
      icon: <MessageSquare className="w-4 h-4 text-purple-400" />,
      task: 'Update API Documentation',
      dismissCount: 4,
      message: 'Why this matters:',
      action: 'This docs update directly unlocks your goal "Ship v2.0". Every hour you delay is an hour devs are blocked on you.',
      timer: null,
    },
  ];

  useEffect(() => {
    const t = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setStrategyIdx(s => (s + 1) % 3);
        setAnimating(false);
      }, 300);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const s = strategies[strategyIdx];

  return (
    <div className="w-full bg-[#070709] rounded-2xl font-sans select-none p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-tech text-white/40 uppercase tracking-widest mb-0.5">Procrastination Intercepted</p>
          <p className="text-sm font-bold text-white">Task dismissed {s.dismissCount}× in 2 hours</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-tech font-bold uppercase tracking-widest ${s.badgeBg} ${s.badgeText}`}>
          <Repeat className="w-3 h-3" />
          <span>{s.id}</span>
        </div>
      </div>

      {/* Strategy indicator */}
      <div className="flex gap-2 mb-4">
        {strategies.map((st, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${i === strategyIdx ? (i === 0 ? 'bg-[#E5B842]' : i === 1 ? 'bg-[#00F0FF]' : 'bg-purple-400') : 'bg-white/10'}`}
          ></div>
        ))}
      </div>

      {/* Strategy label */}
      <div className={`text-xs font-tech font-bold uppercase tracking-widest mb-4 ${s.color} flex items-center gap-2`}>
        {s.icon} {s.label}
      </div>

      {/* Task title */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 mb-4">
        <p className="text-xs text-white/40 font-tech uppercase tracking-wider mb-1">Avoiding:</p>
        <p className="text-sm font-bold text-white">{s.task}</p>
      </div>

      {/* Strategy card */}
      <div
        className={`rounded-xl border p-4 transition-all duration-300 ${s.bgColor} ${s.borderColor} ${animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}
        style={{ transition: 'opacity 0.3s, transform 0.3s' }}
      >
        <p className={`text-xs font-tech font-bold uppercase tracking-widest mb-2 ${s.color}`}>{s.message}</p>
        <p className="text-sm text-white/80 leading-relaxed font-medium">{s.action}</p>

        {s.timer && (
          <div className={`mt-3 flex items-center gap-2 pt-3 border-t ${s.borderColor}`}>
            <span className={`text-2xl font-black font-mono ${s.color}`}>{s.timer}</span>
            <span className="text-xs text-white/40 font-tech uppercase tracking-widest">Pomodoro Auto-starts</span>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className={`py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase border transition-colors cursor-pointer ${s.bgColor} ${s.borderColor} ${s.color}`}>
          {s.id === 'A' ? "Let's Go" : s.id === 'B' ? 'Accept Fix' : "You're Right"}
        </button>
        <button className="py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 text-xs font-bold tracking-wider uppercase hover:bg-white/10 transition-colors cursor-pointer">
          Try Next
        </button>
      </div>
    </div>
  );
}

export default function ProcrastinationSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.procr-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });

      gsap.from('.procr-img', {
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
    <section ref={containerRef} className="py-16 lg:py-32 relative z-10 overflow-hidden bg-[#080808] border-b border-white/[0.02]">
      <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-[#E5B842]/[0.04] rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 procr-text">
              <Repeat className="w-4 h-4 text-[#E5B842]" />
              <span className="text-sm font-bold uppercase tracking-widest text-[#E5B842]">Procrastination Interception</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] procr-text">
              Avoiding something?<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] to-[#FCEABB]">
                ResQ switches tactics.
              </span>
            </h2>

            <p className="text-lg text-white/50 font-light leading-relaxed procr-text max-w-xl">
              If you dismiss the same task 3+ times in 2 hours, ResQ doesn't repeat itself. It <strong className="text-white/80">changes strategy</strong> — cycling through Micro Action, Blocker Probe, and Emotional Anchor until something actually works.
            </p>

            <div className="space-y-6 pt-4 procr-text">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0 mt-1">
                  <Zap className="w-4 h-4 text-[#E5B842]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Strategy A — Micro Action</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    One concrete 5-minute action you can do right now. A Pomodoro auto-starts immediately.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center shrink-0 mt-1">
                  <Mic className="w-4 h-4 text-[#00F0FF]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Strategy B — Blocker Probe</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    Voice prompt: "What's actually stopping you?" Gemini identifies the real blocker — clarity, energy, fear — and acts on it.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-purple-400/10 border border-purple-400/20 flex items-center justify-center shrink-0 mt-1">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Strategy C — Emotional Anchor</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    Links this task to your stated goal. Gemini writes a 2-sentence reminder of exactly why this matters to you personally.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Animation */}
          <div className="relative procr-img">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E5B842]/20 to-transparent rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-sm p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05] relative bg-[#050505]">
                <ProcrastinationAnimation />
              </div>
            </div>

            <div className="absolute -top-6 -left-6 bg-[#0B0B0B] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-bounce-slow" style={{ animationDelay: '0.5s' }}>
              <div className="w-10 h-10 rounded-full bg-[#E5B842]/10 flex items-center justify-center">
                <Repeat className="w-5 h-5 text-[#E5B842]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#E5B842] uppercase tracking-widest mb-0.5">Pattern Detected</p>
                <p className="text-sm font-semibold text-white/80">Strategy Switching</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
