import { ShieldCheck, CalendarRange, Mic, Target, ShieldAlert, TrendingUp, Repeat, MessageSquare, Search, Hourglass } from 'lucide-react';

export default function FeatureStrip() {
  const steps = [
    {
      icon: <ShieldAlert className="w-5 h-5 text-red-400" />,
      title: "Rescue Mode",
      desc: "Autonomous crisis intervention in 60min",
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-[#E5B842]" />,
      title: "Foresight Engine",
      desc: "Predicts task failure before it happens",
    },
    {
      icon: <Repeat className="w-5 h-5 text-white/60" />,
      title: "Procrastination AI",
      desc: "3-strategy interception system",
    },
    {
      icon: <Search className="w-5 h-5 text-white/60" />,
      title: "Goal Pre-Mortem",
      desc: "Know your failure odds before you start",
    },
    {
      icon: <Hourglass className="w-5 h-5 text-white/60" />,
      title: "Energy Scheduling",
      desc: "Peak performance window matching",
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-white/60" />,
      title: "Post-Meeting AI",
      desc: "Auto-extract tasks after every meeting",
    },
    {
      icon: <Mic className="w-5 h-5 text-white/60" />,
      title: "Voice AI",
      desc: "Talk to your companion hands-free",
    },
    {
      icon: <CalendarRange className="w-5 h-5 text-white/60" />,
      title: "Calendar Sync",
      desc: "Bidirectional Google Calendar sync",
    },
  ];

  return (
    <section className="pt-12 lg:pt-20 pb-8 lg:pb-12 border-y border-white/[0.03] bg-[#050505] bg-noise relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 font-sans">
          {steps.map((step, idx) => (
            <div 
              key={idx} 
              className="flex items-start gap-3 p-2 rounded-xl hover:bg-white/[0.01] transition-colors duration-300 group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 border border-white/10 group-hover:border-white/30 group-hover:bg-white/10 transition-all duration-300 shrink-0">
                {step.icon}
              </div>
              <div>
                <h3 className="text-xs font-tech font-bold text-white tracking-widest uppercase mb-1 group-hover:text-white transition-colors">
                  {step.title}
                </h3>
                <p className="text-xs text-white/50 font-normal leading-relaxed tracking-wide">
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
