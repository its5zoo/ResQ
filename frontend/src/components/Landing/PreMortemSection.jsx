import { Search, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

function PreMortemAnimation() {
  const [phase, setPhase] = useState('loading'); // loading | results
  const [oddsCount, setOddsCount] = useState(0);
  const [revealedReasons, setRevealedReasons] = useState(0);

  const failureReasons = [
    { reason: "First milestone missed within 2 weeks", probability: 71, mitigation: "Book 3 focus blocks this week", color: 'text-red-400', barColor: 'bg-red-500' },
    { reason: "Scope creep beyond original plan", probability: 54, mitigation: "Lock scope in writing today", color: 'text-[#E5B842]', barColor: 'bg-[#E5B842]' },
    { reason: "Competing priorities take over", probability: 38, mitigation: "Block calendar time now", color: 'text-orange-400', barColor: 'bg-orange-500' },
  ];

  useEffect(() => {
    // Loading phase
    const t1 = setTimeout(() => {
      setPhase('results');
      // Count up odds
      let c = 0;
      const counter = setInterval(() => {
        c += 2;
        setOddsCount(c);
        if (c >= 62) {
          setOddsCount(62);
          clearInterval(counter);
        }
      }, 20);
    }, 1800);

    return () => clearTimeout(t1);
  }, []);

  useEffect(() => {
    if (phase !== 'results') return;
    let revealed = 0;
    const t = setInterval(() => {
      revealed++;
      setRevealedReasons(revealed);
      if (revealed >= 3) clearInterval(t);
    }, 600);
    return () => clearInterval(t);
  }, [phase]);

  // Loop back
  useEffect(() => {
    const loop = setInterval(() => {
      setPhase('loading');
      setOddsCount(0);
      setRevealedReasons(0);
      setTimeout(() => {
        setPhase('results');
        let c = 0;
        const counter = setInterval(() => {
          c += 2;
          setOddsCount(c);
          if (c >= 62) { setOddsCount(62); clearInterval(counter); }
        }, 20);
      }, 1800);
    }, 10000);
    return () => clearInterval(loop);
  }, []);

  return (
    <div className="w-full bg-[#070709] rounded-2xl font-sans select-none p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-tech text-white/40 uppercase tracking-widest mb-0.5">ResQ Pre-Mortem</p>
          <p className="text-sm font-bold text-white">"Launch SaaS Product" · Q3</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-tech font-bold uppercase tracking-widest ${phase === 'loading' ? 'bg-[#E5B842]/10 border-[#E5B842]/20 text-[#E5B842]' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          {phase === 'loading' ? (
            <><span className="w-2 h-2 rounded-full border border-[#E5B842] border-t-transparent animate-spin"></span> Analyzing</>
          ) : (
            <><CheckCircle2 className="w-3 h-3" /> Complete</>
          )}
        </div>
      </div>

      {phase === 'loading' ? (
        <div className="space-y-3 py-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-3 bg-white/[0.04] rounded-full animate-pulse" style={{ width: `${70 + i * 10}%`, animationDelay: `${i * 0.2}s` }}></div>
              <div className="h-2 bg-white/[0.02] rounded-full animate-pulse" style={{ width: `${50 + i * 5}%`, animationDelay: `${i * 0.3}s` }}></div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
            <Search className="w-3.5 h-3.5 text-[#E5B842] animate-pulse" />
            <span className="text-xs text-white/40 font-tech">Running failure scenario analysis...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Success odds */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3.5 mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-tech text-white/40 uppercase tracking-widest mb-1">Overall Success Odds</p>
              <p className="text-xs text-white/50">Based on your past 4 goals</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-black font-mono text-[#E5B842]">{oddsCount}%</span>
            </div>
          </div>

          {/* Failure reasons */}
          <p className="text-[10px] font-tech text-white/40 uppercase tracking-widest mb-3">Top Failure Scenarios</p>
          <div className="space-y-3 mb-4">
            {failureReasons.slice(0, revealedReasons).map((r, i) => (
              <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 transition-all duration-500">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-xs font-medium text-white/80 leading-snug flex-1">{r.reason}</p>
                  <span className={`text-sm font-black font-mono shrink-0 ${r.color}`}>{r.probability}%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                  <div className={`h-full rounded-full transition-all duration-700 ${r.barColor}`} style={{ width: `${r.probability}%` }}></div>
                </div>
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-white/30 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-white/40">{r.mitigation}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Critical action */}
          {revealedReasons >= 3 && (
            <div className="bg-[#E5B842]/5 border border-[#E5B842]/15 rounded-xl p-3">
              <div className="flex items-start gap-2">
                <Target className="w-3.5 h-3.5 text-[#E5B842] shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-tech font-bold text-[#E5B842] uppercase tracking-widest mb-1">Week 1 Critical Action</p>
                  <p className="text-xs text-white/70">Ship a landing page with waitlist signup before any dev work starts.</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function PreMortemSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.premortem-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });

      gsap.from('.premortem-img', {
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
      <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-[#E5B842]/[0.04] rounded-full blur-[130px] pointer-events-none -translate-y-1/2"></div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: Animation */}
          <div className="order-2 lg:order-1 relative premortem-img">
            <div className="absolute inset-0 bg-gradient-to-tl from-[#E5B842]/20 to-transparent rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-sm p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05] relative bg-[#050505]">
                <PreMortemAnimation />
              </div>
            </div>

            <div className="absolute -bottom-6 -right-6 bg-[#0B0B0B] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-bounce-slow" style={{ animationDelay: '0.8s' }}>
              <div className="w-10 h-10 rounded-full bg-[#E5B842]/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-[#E5B842]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#E5B842] uppercase tracking-widest mb-0.5">Pre-Mortem</p>
                <p className="text-sm font-semibold text-white/80">62% Success Odds</p>
              </div>
            </div>
          </div>

          {/* Right: Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 premortem-text">
              <Search className="w-4 h-4 text-[#E5B842]" />
              <span className="text-sm font-bold uppercase tracking-widest text-[#E5B842]">Goal Pre-Mortem AI</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] premortem-text">
              Before you commit —<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] to-[#FCEABB]">
                know your odds.
              </span>
            </h2>

            <p className="text-lg text-white/50 font-light leading-relaxed premortem-text max-w-xl">
              The moment you create a goal, ResQ runs a Gemini pre-mortem — imagining it's the deadline and the goal <strong className="text-white/80">already failed</strong>. You see your top 3 failure scenarios and exact mitigations before you leave the screen.
            </p>

            <div className="space-y-6 pt-4 premortem-text">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-sm font-bold text-white/70">1</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Failure Probability Analysis</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    Each failure scenario gets a probability score based on your history and the goal's characteristics.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0 mt-1">
                  <Target className="w-4 h-4 text-[#E5B842]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Commitment Contracts</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    Choose accountability: send an email to a contact if milestone is missed, or unlock a dashboard shame meter. Stakes create results.
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
