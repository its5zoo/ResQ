import { Flag, Milestone, Sparkles } from 'lucide-react';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function GoalSystemSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.goal-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });
      
      gsap.from('.goal-img', {
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
    <section ref={containerRef} className="py-32 relative z-10 overflow-hidden bg-[#050505]">
      <div className="container mx-auto px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="order-2 lg:order-1 relative goal-img">
            {/* Glassmorphic border container */}
            <div className="absolute inset-0 bg-gradient-to-tl from-[#E5B842]/20 to-transparent rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-sm p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05]">
                <img 
                  src="/screenshots/goals_milestones.png" 
                  alt="Goal Planning System" 
                  className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                />
              </div>
            </div>
            
            {/* Floating indicator */}
            <div className="absolute -top-6 -right-6 bg-[#0B0B0B] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-bounce-slow" style={{ animationDelay: '1s' }}>
              <div className="w-10 h-10 rounded-full bg-[#E5B842]/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#E5B842]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#E5B842] uppercase tracking-widest mb-0.5">AI Polished</p>
                <p className="text-xs font-semibold text-white/80">Milestones refined</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 goal-text">
              <Flag className="w-4 h-4 text-white/70" />
              <span className="text-xs font-bold uppercase tracking-widest text-white/70">Strategic Planning</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] goal-text">
              Turn overwhelming goals <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] to-[#FCEABB]">into weekly actions.</span>
            </h2>
            
            <p className="text-lg text-white/50 font-light leading-relaxed goal-text max-w-xl">
              Don't just set targets—achieve them. ResQ breaks down your massive long-term goals into a timeline of achievable weekly milestones. Track your progress with pinpoint accuracy.
            </p>

            <div className="space-y-6 pt-4 goal-text">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-xs font-bold text-white/70">1</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Define Your Target</h4>
                  <p className="text-xs text-white/40 leading-relaxed mt-1">Set a deadline and draft rough milestones. The system handles the timeline.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0 mt-1">
                  <Milestone className="w-4 h-4 text-[#E5B842]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">AI Polishing</h4>
                  <p className="text-xs text-white/40 leading-relaxed mt-1">Gemini AI analyzes your inputs and rewrites them into crystal-clear, actionable directives.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
