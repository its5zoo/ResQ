import { useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import gsap from 'gsap';
import SmartPlannerAnimation from './SmartPlannerAnimation';

export default function SmartPlannerSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.plan-sec-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });
      
      gsap.from('.plan-sec-card', {
        scale: 0.96,
        opacity: 0,
        y: 35,
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
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-[#E5B842]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Visual demo container */}
          <div className="relative plan-sec-card order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E5B842]/20 to-transparent rounded-3xl blur-2xl opacity-40"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/60 overflow-hidden shadow-2xl backdrop-blur-md p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05] relative bg-[#050505]">
                <SmartPlannerAnimation />
              </div>
            </div>
          </div>

          {/* Right Column: Copy & features list */}
          <div className="space-y-6 lg:space-y-8 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 plan-sec-text">
              <Sparkles className="w-3.5 h-3.5 text-[#E5B842]" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#E5B842]">UNIVERSAL ROADMAP BUILDER</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-black text-white leading-[1.05] tracking-tight plan-sec-text">
              Plan anything. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] to-amber-300">Scale your growth.</span>
            </h2>
            
            <p className="text-lg text-white/50 font-light leading-relaxed plan-sec-text max-w-xl font-sans">
              Let ResQ map out your learning path, exam preparations, or business projects automatically. Speak your target, and watch a structured, day-by-day roadmap emerge instantly.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 pt-4 plan-sec-text">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">Day-by-Day Ticking</h4>
                <p className="text-sm text-white/70 leading-relaxed">
                  Incrementally tick off daily tasks directly from your home timeline. Watch your progress update instantly.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5 text-[#E5B842]" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">Google Calendar Sync</h4>
                <p className="text-sm text-white/70 leading-relaxed">
                  Generated tasks are scheduled automatically into calendar focus blocks. Marking a day complete prefixes it with a ✅ in your Google Calendar.
                </p>
              </div>
            </div>

            <div className="pt-6 plan-sec-text">
              <a 
                href="#voice" 
                className="inline-flex items-center gap-2 text-sm font-tech font-bold text-white/80 hover:text-[#E5B842] transition-colors duration-300 group"
              >
                <span>SEE VOICE CONTROLS IN ACTION</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
