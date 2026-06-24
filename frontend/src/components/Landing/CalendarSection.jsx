import { Calendar as CalendarIcon, Clock, Move } from 'lucide-react';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import CalendarAnimation from './CalendarAnimation';

export default function CalendarSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cal-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });
      
      gsap.from('.cal-img', {
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
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          <div className="space-y-6 lg:space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 cal-text">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-bold uppercase tracking-widest text-blue-400">Time Blocking</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] cal-text">
              Protect your focus. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Defend your time.</span>
            </h2>
            
            <p className="text-lg text-white/50 font-light leading-relaxed cal-text max-w-xl">
              A task without a time slot is just a wish. Drag and drop your highest priority tasks directly into your calendar. Treat your deep work sessions like unmissable meetings.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 pt-6 cal-text">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <Move className="w-5 h-5 text-white/70" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">Drag & Drop</h4>
                <p className="text-sm text-white/70 leading-relaxed">
                  Seamlessly drag tasks from your backlog directly onto your weekly agenda.
                </p>
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white/70" />
                </div>
                <h4 className="text-sm font-bold text-white tracking-wide">Dynamic Duration</h4>
                <p className="text-sm text-white/70 leading-relaxed">
                  Events automatically size themselves based on the AI-estimated effort of the task.
                </p>
              </div>
            </div>
          </div>

          <div className="relative cal-img">
            {/* Glassmorphic border container */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-transparent rounded-3xl blur-2xl opacity-40"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-sm p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05] relative bg-[#050505]">
                <CalendarAnimation />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
