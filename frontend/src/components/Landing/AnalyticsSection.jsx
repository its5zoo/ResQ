import { Activity, BarChart3, TrendingUp } from 'lucide-react';
import { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function AnalyticsSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.analytics-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });
      
      gsap.from('.analytics-img', {
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
    <section ref={containerRef} className="py-16 lg:py-32 relative z-10 overflow-hidden bg-[#050505]">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          <div className="order-2 lg:order-1 relative analytics-img">
            {/* Glassmorphic border container */}
            <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/20 to-transparent rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-sm p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05]">
                <img 
                  src="/screenshots/analytics_insights.png" 
                  alt="Analytics and Weekly Insights" 
                  className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity duration-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 analytics-text">
              <Activity className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-bold uppercase tracking-widest text-purple-400">Weekly Insights</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] analytics-text">
              Understand your flow. <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-300">Optimize your week.</span>
            </h2>
            
            <p className="text-lg text-white/50 font-light leading-relaxed analytics-text max-w-xl">
              What gets measured gets managed. ResQ's AI analyzes your completion rates, habits, and focus hours to deliver a personalized weekly report. Stop guessing how productive you were.
            </p>

            <div className="space-y-6 pt-4 analytics-text">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
                  <BarChart3 className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Completion Velocity</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">Track the exact percentage of tasks and milestones you crush every week.</p>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-5 h-5 text-white/70" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">AI Burnout Detection</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">Our engine recognizes when you're taking on too much and suggests schedule adjustments.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
