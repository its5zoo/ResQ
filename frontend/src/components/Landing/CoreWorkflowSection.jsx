import { Brain, Zap, Target, LayoutTemplate } from 'lucide-react';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function CoreWorkflowSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.workflow-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });
      
      gsap.from('.workflow-img', {
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
    <section ref={containerRef} className="py-32 relative z-10 overflow-hidden bg-black border-y border-white/[0.02]">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-[#E5B842]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>
      
      <div className="container mx-auto px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 workflow-text">
              <Zap className="w-4 h-4 text-[#E5B842]" />
              <span className="text-xs font-bold uppercase tracking-widest text-[#E5B842]">Smart Task Management</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] workflow-text">
              Stop organizing. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/40">Start executing.</span>
            </h2>
            
            <p className="text-lg text-white/50 font-light leading-relaxed workflow-text max-w-xl">
              Don't waste time figuring out what to do next. ResQ's AI instantly analyzes deadlines, effort, and strategic importance to rank your tasks. Just open your dashboard and tackle the #1 priority.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 pt-6 workflow-text">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white/70" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">AI Priority Ranking</h4>
                <p className="text-xs text-white/40 leading-relaxed">
                  Tasks are scored from 1-100 based on urgency and context. No more decision fatigue.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <LayoutTemplate className="w-5 h-5 text-white/70" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">Unified Stack</h4>
                <p className="text-xs text-white/40 leading-relaxed">
                  Calendar events, pending habits, and tasks all merge into one seamless command center.
                </p>
              </div>
            </div>
          </div>

          <div className="relative workflow-img">
            {/* Glassmorphic border container */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E5B842]/20 to-transparent rounded-3xl blur-2xl opacity-40"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-sm p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05]">
                <img 
                  src="/screenshots/tasks_board.png" 
                  alt="Task Management Dashboard" 
                  className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                />
              </div>
            </div>
            
            {/* Floating indicator */}
            <div className="absolute -bottom-6 -left-6 bg-[#0B0B0B] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-bounce-slow">
              <div className="w-12 h-12 rounded-full bg-[#E5B842]/10 flex items-center justify-center">
                <Target className="w-6 h-6 text-[#E5B842]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-0.5">Top Priority</p>
                <p className="text-sm font-semibold text-white">Score: 98/100</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
