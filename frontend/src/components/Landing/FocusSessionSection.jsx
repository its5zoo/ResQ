import { BellOff, ShieldAlert, Disc, Zap, VolumeX, EyeOff } from 'lucide-react';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';
import FocusSessionAnimation from './FocusSessionAnimation';

export default function FocusSessionSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.focus-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });
      
      gsap.from('.focus-img', {
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
      {/* Background Gradients */}
      <div className="absolute top-0 right-1/4 w-[800px] h-[800px] bg-[#E5B842]/5 rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* Left Column: Animation (Alternating Layout) */}
          <div className="order-2 lg:order-1 relative focus-img">
            {/* Glassmorphic border container */}
            <div className="absolute inset-0 bg-gradient-to-tl from-[#E5B842]/20 to-transparent rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-sm p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05] relative bg-[#050505]">
                <FocusSessionAnimation />
              </div>
            </div>
            
            {/* Floating indicator */}
            <div className="absolute -top-6 -right-6 bg-[#0B0B0B] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-bounce-slow" style={{ animationDelay: '1s' }}>
              <div className="w-10 h-10 rounded-full bg-[#E5B842]/10 flex items-center justify-center">
                <VolumeX className="w-5 h-5 text-[#E5B842]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#E5B842] uppercase tracking-widest mb-0.5">DND Active</p>
                <p className="text-sm font-semibold text-white/80">Distractions Shielded</p>
              </div>
            </div>
          </div>

          {/* Right Column: Info */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 focus-text">
              <Zap className="w-4 h-4 text-[#E5B842]" />
              <span className="text-sm font-bold uppercase tracking-widest text-[#E5B842]">Deep Focus Mode</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] focus-text">
              Silence the noise. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] to-[#FCEABB]">Enter deep focus.</span>
            </h2>
            
            <p className="text-lg text-white/50 font-light leading-relaxed focus-text max-w-xl">
              Protect your attention from constant interruptions. ResQ's Focus Mode silences notification channels, mutes distracting alerts, and tracks your deep work sessions completely hands-free using voice control.
            </p>

            <div className="space-y-6 pt-4 focus-text">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <span className="text-sm font-bold text-white/70">1</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Distraction Shield</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">Automatically switches status on Slack & MS Teams and mutes browser alerts to safeguard your time.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0 mt-1">
                  <ShieldAlert className="w-4 h-4 text-[#E5B842]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Voice Assistant Controls</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">Command the AI with your voice to initiate deep work, e.g., "start my focus session for 25 min".</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
