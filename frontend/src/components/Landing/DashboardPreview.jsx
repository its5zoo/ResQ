import { useRef, useEffect } from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import gsap from 'gsap';

export default function DashboardPreview() {
  const containerRef = useRef(null);
  const laptopRef   = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        laptopRef.current,
        { y: 80, opacity: 0, scale: 0.96, rotateX: 8 },
        {
          y: 0, opacity: 1, scale: 1, rotateX: 0,
          duration: 1.6,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 72%',
          }
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 relative z-20 overflow-hidden bg-[#050505] border-y border-white/[0.02]">
      <div className="container mx-auto px-6 max-w-7xl">

        {/* Section heading */}
        <div className="text-center mb-16 space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#E5B842]/20 bg-[#E5B842]/5 text-[#E5B842] text-sm font-bold uppercase tracking-[0.2em]">
            <Zap className="w-3.5 h-3.5" /> Live Workspace
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-white leading-[1.1] tracking-tight">
            Your command centre,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] via-[#FFF2CC] to-[#B8860B]">always in control.</span>
          </h2>
          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            One unified workspace for tasks, calendar, habits, goals, and your AI advisor — all surfaced intelligently so you never miss what matters.
          </p>
        </div>

        {/* ── Laptop Mockup ── */}
        <div className="relative max-w-5xl mx-auto" style={{ perspective: '1200px' }}>
          {/* Ambient glow behind laptop */}
          <div className="absolute inset-x-0 bottom-0 h-40 bg-[#E5B842]/10 blur-3xl opacity-40 pointer-events-none rounded-full"></div>

          <div ref={laptopRef} className="relative" style={{ transformStyle: 'preserve-3d' }}>

            {/* ── Laptop lid / screen ── */}
            <div className="relative rounded-t-2xl rounded-b-none bg-[#1a1a1a] border border-white/10 shadow-[0_-4px_40px_rgba(0,0,0,0.6)] overflow-hidden"
              style={{ paddingTop: '0' }}>

              {/* Notch / camera strip */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#111111] border-b border-white/[0.06]">
                {/* Traffic lights */}
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/70"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/70"></div>
                </div>
                {/* URL bar */}
                <div className="flex-1 mx-6">
                  <div className="mx-auto max-w-xs bg-white/[0.04] border border-white/[0.06] rounded-md px-3 py-1 text-center text-[11px] text-white/40 font-mono tracking-wide">
                    app.resq.ai/dashboard
                  </div>
                </div>
                <div className="w-14"></div>
              </div>

              {/* Dashboard screenshot — fills the screen area */}
              <div className="relative w-full overflow-hidden" style={{ maxHeight: '520px' }}>
                <img
                  src="/dashboard_v3.png"
                  alt="ResQ Dashboard — AI Productivity Workspace"
                  className="w-full object-cover object-top block"
                  style={{ maxHeight: '520px' }}
                  draggable={false}
                />
                {/* Subtle bottom fade so the screenshot doesn't hard-cut */}
                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#050505]/80 to-transparent pointer-events-none"></div>
              </div>
            </div>

            {/* ── Laptop base / hinge ── */}
            <div className="relative h-4 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-none border-x border-white/[0.08]">
              {/* Hinge highlight */}
              <div className="absolute top-0 left-0 right-0 h-px bg-white/10"></div>
              {/* Camera dot centered in hinge */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/10 border border-white/20"></div>
            </div>

            {/* ── Laptop deck (keyboard area) ── */}
            <div className="relative bg-gradient-to-b from-[#1e1e1e] to-[#161616] rounded-b-2xl border border-t-0 border-white/[0.06] shadow-[0_20px_60px_rgba(0,0,0,0.7)]"
              style={{ height: '24px' }}>
              {/* Trackpad hint */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 rounded-sm border border-white/[0.08] bg-white/[0.02]"></div>
            </div>

            {/* Base shadow */}
            <div className="absolute -bottom-6 left-4 right-4 h-8 bg-black/50 blur-xl rounded-full pointer-events-none"></div>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-24 pt-12 border-t border-white/[0.05] grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-2">
            <div className="text-3xl font-black text-white font-display">100k+</div>
            <div className="text-sm uppercase tracking-widest text-white/50 font-bold">Tasks Completed</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-black text-white font-display">99.9%</div>
            <div className="text-sm uppercase tracking-widest text-white/50 font-bold">Uptime</div>
          </div>
          <div className="text-center space-y-2 flex flex-col items-center">
            <ShieldCheck className="w-8 h-8 text-[#E5B842]/70 mb-2" />
            <div className="text-sm uppercase tracking-widest text-white/50 font-bold">Enterprise Security</div>
          </div>
          <div className="text-center space-y-2 flex flex-col items-center">
            <Zap className="w-8 h-8 text-[#E5B842]/70 mb-2" />
            <div className="text-sm uppercase tracking-widest text-white/50 font-bold">Lightning Fast</div>
          </div>
        </div>
      </div>
    </section>
  );
}
