import { useRef, useEffect } from 'react';
import { ShieldCheck, Zap, Lock } from 'lucide-react';
import gsap from 'gsap';

export default function DashboardPreview() {
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(imageRef.current,
        { y: 100, opacity: 0, scale: 0.95, rotateX: 10 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotateX: 0,
          duration: 1.5,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 70%',
          }
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 relative z-20 overflow-hidden bg-[#050505] border-y border-white/[0.02]">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-display font-black text-white">
            Your entire life, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] to-[#FCEABB]">centralized.</span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto font-light">
            One command center for your habits, calendar events, and AI-prioritized tasks.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto" style={{ perspective: '1000px' }}>
          {/* Outer glow */}
          <div className="absolute inset-0 bg-[#E5B842]/20 rounded-[2rem] blur-3xl opacity-30 pointer-events-none"></div>
          
          <div ref={imageRef} className="relative rounded-[2rem] border border-white/10 bg-[#0A0A0A] p-2 shadow-2xl backdrop-blur-sm">
            <div className="rounded-2xl overflow-hidden border border-white/[0.05] bg-[#050505]">
              {/* Window Controls Mac Style */}
              <div className="bg-[#0B0B0B] border-b border-white/[0.05] px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                <div className="ml-4 flex-1 text-center">
                  <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-1">
                    <Lock className="w-3 h-3 text-white/40" />
                    <span className="text-[10px] text-white/40 font-mono">app.resq.ai</span>
                  </div>
                </div>
              </div>
              
              <img 
                src="/screenshots/hero_dashboard_preview.png" 
                alt="ResQ Command Center" 
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>

        {/* Social Proof / Trust Mini-Strip */}
        <div className="mt-24 pt-12 border-t border-white/[0.05] grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-2">
            <div className="text-3xl font-black text-white font-display">100k+</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Tasks Completed</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-black text-white font-display">99.9%</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Uptime</div>
          </div>
          <div className="text-center space-y-2 flex flex-col items-center">
            <div className="mb-2">
              <ShieldCheck className="w-8 h-8 text-[#E5B842]/70" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Enterprise Security</div>
          </div>
          <div className="text-center space-y-2 flex flex-col items-center">
            <div className="mb-2">
              <Zap className="w-8 h-8 text-[#E5B842]/70" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Lightning Fast</div>
          </div>
        </div>
      </div>
    </section>
  );
}
