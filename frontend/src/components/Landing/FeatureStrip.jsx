import { ShieldCheck, CalendarRange, Mic, Target } from 'lucide-react';

export default function FeatureStrip() {
  const steps = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-white/60" />,
      title: "Agentic Prioritization",
      desc: "AI calculates real-time urgency metrics",
    },
    {
      icon: <CalendarRange className="w-5 h-5 text-white/60" />,
      title: "Google Calendar Sync",
      desc: "Instant free slot auto-scheduling",
    },
    {
      icon: <Mic className="w-5 h-5 text-white/60" />,
      title: "Conversational Voice AI",
      desc: "Talk to your companion hands-free",
    },
    {
      icon: <Target className="w-5 h-5 text-white/60" />,
      title: "Goals & Habit Streaks",
      desc: "Build focus momentum over time",
    }
  ];

  return (
    <section className="pt-20 pb-12 border-y border-white/[0.03] bg-[#050505] bg-noise relative z-20">
      <div className="max-w-7xl mx-auto px-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 font-sans">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-5 p-2 rounded-xl hover:bg-white/[0.01] transition-colors duration-300 group"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/30 group-hover:bg-white/10 transition-all duration-300 shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="text-sm font-tech font-bold text-white tracking-widest uppercase mb-1.5 group-hover:text-white transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-white/50 font-normal leading-relaxed tracking-wide">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
