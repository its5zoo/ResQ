import { TrendingUp, AlertCircle, Brain, BarChart3 } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

function ForesightAnimation() {
  const [tasks, setTasks] = useState([
    { title: 'Q3 Financial Report', risk: 9, factors: ['Created Friday', 'Est >90min', 'Rescheduled 3x'], due: '2h', urgency: 9, type: 'technical' },
    { title: 'Send Client Proposal', risk: 6, factors: ['Similar tasks 60% done', 'Mon morning'], due: '4h', urgency: 7, type: 'communication' },
    { title: 'Review PR Comments', risk: 3, factors: ['High past completion', 'Short estimate'], due: 'Tomorrow', urgency: 4, type: 'technical' },
    { title: 'Update Team Slides', risk: 7, factors: ['Creative task', 'Post-lunch slot'], due: '5h', urgency: 6, type: 'creative' },
  ]);

  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setPulse(p => p + 1), 2000);
    return () => clearInterval(t);
  }, []);

  const riskColor = (r) => {
    if (r >= 7) return { bg: 'bg-red-500/10', border: 'border-red-500/25', text: 'text-red-400', dot: 'bg-red-500' };
    if (r >= 4) return { bg: 'bg-[#E5B842]/10', border: 'border-[#E5B842]/25', text: 'text-[#E5B842]', dot: 'bg-[#E5B842]' };
    return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/25', text: 'text-emerald-400', dot: 'bg-emerald-500' };
  };

  const riskLabel = (r) => r >= 7 ? 'HIGH RISK' : r >= 4 ? 'MODERATE' : 'LOW RISK';

  return (
    <div className="w-full bg-[#070709] rounded-2xl font-sans select-none p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-tech text-white/40 uppercase tracking-widest mb-0.5">ResQ Foresight</p>
          <p className="text-sm font-bold text-white">Predictive Risk Scanner</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20">
          <Brain className="w-3 h-3 text-[#E5B842]" />
          <span className="text-[9px] font-tech font-bold uppercase tracking-widest text-[#E5B842]">Gemini Active</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {tasks.map((task, i) => {
          const c = riskColor(task.risk);
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={i}
              className={`rounded-xl border p-3 transition-all duration-300 cursor-default ${c.bg} ${c.border} ${task.risk >= 7 && pulse % 2 === 0 && !isHovered ? 'shadow-[0_0_12px_rgba(239,68,68,0.15)]' : ''}`}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.dot} ${task.risk >= 7 ? 'animate-pulse' : ''}`}></span>
                    <span className="text-sm font-semibold text-white truncate">{task.title}</span>
                  </div>
                  {isHovered ? (
                    <div className="space-y-1 mt-2">
                      <p className="text-[10px] font-tech text-white/40 uppercase tracking-widest mb-1">Risk Factors</p>
                      {task.factors.map((f, fi) => (
                        <div key={fi} className="flex items-center gap-1.5">
                          <AlertCircle className={`w-3 h-3 ${c.text} shrink-0`} />
                          <span className="text-xs text-white/70">{f}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-white/50">Due {task.due} · {task.type}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xl font-black font-mono ${c.text} leading-none`}>{task.risk}<span className="text-xs font-bold">/10</span></div>
                  <div className={`text-[8px] font-tech font-bold uppercase tracking-widest ${c.text} mt-0.5`}>{riskLabel(task.risk)}</div>
                </div>
              </div>
              {/* urgency bar */}
              <div className="mt-2.5 w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${task.risk >= 7 ? 'bg-red-500' : task.risk >= 4 ? 'bg-[#E5B842]' : 'bg-emerald-500'}`}
                  style={{ width: `${task.risk * 10}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-white/40 font-tech">Based on your last 90 days</span>
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3 h-3 text-[#E5B842]" />
          <span className="text-xs font-tech text-[#E5B842]">Profile updated</span>
        </div>
      </div>
    </div>
  );
}

export default function ForesightSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.foresight-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });

      gsap.from('.foresight-img', {
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
    <section ref={containerRef} className="py-16 lg:py-32 relative z-10 overflow-hidden bg-[#050505] border-b border-white/[0.02]">
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[#E5B842]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 foresight-text">
              <TrendingUp className="w-4 h-4 text-[#E5B842]" />
              <span className="text-sm font-bold uppercase tracking-widest text-[#E5B842]">Predictive Failure Engine</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] foresight-text">
              See failure coming<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] to-[#FCEABB]">
                before it arrives.
              </span>
            </h2>

            <p className="text-lg text-white/50 font-light leading-relaxed foresight-text max-w-xl">
              ResQ Foresight studies your personal task history — completion rates, reschedule patterns, time-of-day habits — to assign every task a live <strong className="text-white/80">Risk Score from 1–10</strong>. Not generic. Your fingerprint.
            </p>

            <div className="space-y-6 pt-4 foresight-text">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-sm font-bold text-white/70">1</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Personal Failure Profile</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    Analyzes 90 days of your completed and missed tasks. No averages — your unique patterns only.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0 mt-1">
                  <Brain className="w-4 h-4 text-[#E5B842]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Gemini Risk Scoring</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    A single Gemini call cross-references your task against your failure profile and assigns 3 specific risk factors — hover any task to see exactly why.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0 mt-1">
                  <AlertCircle className="w-4 h-4 text-[#E5B842]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Proactive Early Warning</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    Risk score ≥8 with &gt;24h left? ResQ pushes a proactive alert immediately — not when it's too late.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Animation */}
          <div className="relative foresight-img">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E5B842]/20 to-transparent rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-sm p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05] relative bg-[#050505]">
                <ForesightAnimation />
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 bg-[#0B0B0B] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-bounce-slow">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-red-400 uppercase tracking-widest mb-0.5">Risk: 9/10</p>
                <p className="text-sm font-semibold text-white/80">Alert Triggered</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
