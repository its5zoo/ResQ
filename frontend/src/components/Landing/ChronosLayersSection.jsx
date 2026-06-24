import { Sparkles, CalendarDays, AlertTriangle } from 'lucide-react';

export default function ChronosLayersSection() {
  const layers = [
    {
      id: "ai-block",
      icon: <Sparkles className="w-5 h-5 text-[#E5B842]" />,
      title: "AI Block",
      badgeText: "🤖 Focus Shield Active",
      badgeClass: "bg-[#E5B842]/15 border-[#E5B842]/30 text-[#E5B842] font-semibold",
      timeText: "04:00 PM (45m)",
      eventTitle: "AI Focus block: React UI integration",
      eventMeta: "Slack: 📵 DND | Notifications: Queued",
      glowColor: "group-hover:border-[#E5B842]/30 group-hover:shadow-[0_0_30px_-5px_rgba(229,184,66,0.2)]",
      textColor: "text-[#E5B842]",
      desc: "Automated sessions locked in when your cognitive energy is highest. ResQ blocks team pings, queues notifications, and safeguards your time.",
      bullets: [
        "Dynamically placed during open spots",
        "Automated distraction shielding rules",
        "Synced status changes across Slack & Teams"
      ]
    },
    {
      id: "user-block",
      icon: <CalendarDays className="w-5 h-5 text-white" />,
      title: "User Block",
      badgeText: "👥 Synced Event",
      badgeClass: "bg-white/10 border-white/20 text-white/90 font-medium",
      timeText: "10:00 AM (30m)",
      eventTitle: "Sync with Team (Vibe2Ship)",
      eventMeta: "Source: Google Calendar Sync",
      glowColor: "group-hover:border-white/20 group-hover:shadow-[0_0_30px_-5px_rgba(255,255,255,0.1)]",
      textColor: "text-white",
      desc: "Standard events manually scheduled by you or synced directly from Google Calendar or Outlook. AI slots are planned around these blocks.",
      bullets: [
        "Bidirectional sync with external calendars",
        "Respected and untouched by scheduling engine",
        "Automatically adjusts adjacent focus slots"
      ]
    },
    {
      id: "deadline",
      icon: <AlertTriangle className="w-5 h-5 text-[#EF4444]" />,
      title: "Deadline",
      badgeText: "⚠️ Milestone Threat",
      badgeClass: "bg-[#EF4444]/15 border-[#EF4444]/30 text-[#EF4444] font-semibold animate-pulse",
      timeText: "06:00 PM (Critical)",
      eventTitle: "Submit Hackathon Project",
      eventMeta: "Hazard Level: High Focus Needed",
      glowColor: "group-hover:border-[#EF4444]/30 group-hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.2)]",
      textColor: "text-[#EF4444]",
      desc: "Milestones connected from your priority stack. The scheduling engine actively monitors your day to flag if meetings threaten completion.",
      bullets: [
        "Direct connection to your task stack",
        "Dynamic recalculation based on delays",
        "Proactive notifications before conflicts arise"
      ]
    }
  ];

  return (
    <section id="chronos-layers" className="py-24 relative bg-[#050505] bg-noise overflow-hidden border-t border-white/[0.03]">
      {/* Background glow highlights */}
      <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] bg-white/[0.01] rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#E5B842]/[0.01] rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 font-sans">
          <span className="text-xs font-tech font-bold tracking-[0.3em] uppercase text-white/50 block mb-5">
            Chronos Layering
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-black text-silver-gradient text-shine-sweep mb-6 leading-tight tracking-tight">
            Understand your <span className="text-[#E5B842]">timeline</span> structure
          </h2>
          <p className="text-sm sm:text-base text-white/50 leading-relaxed font-normal max-w-xl mx-auto tracking-normal">
            ResQ splits your calendar into three distinct cognitive layers, helping you visually budget deep work, collaborative sessions, and deadlines.
          </p>
        </div>

        {/* 3-Column Layers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {layers.map((layer) => (
            <div 
              key={layer.id} 
              className={`group flex flex-col justify-between bg-[#090909] border border-white/[0.04] rounded-3xl p-6 lg:p-8 layered-shadow-lg card-shine-sweep transition-all duration-500 hover:bg-[#0c0c0e] ${layer.glowColor}`}
            >
              <div className="space-y-6">
                
                {/* Header info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                    {layer.icon}
                  </div>
                  <h3 className={`text-xl font-display font-black tracking-tight ${layer.textColor}`}>
                    {layer.title}
                  </h3>
                </div>

                {/* Simulated Widget Card */}
                <div className="bg-[#0b0b0d] border border-white/[0.03] rounded-2xl p-4 font-sans select-none relative overflow-hidden transition-all duration-500 group-hover:border-white/10">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                    <span className="text-[8px] font-tech text-white/30 uppercase tracking-widest">Chronos Layer</span>
                    <span className={`text-[7px] font-tech border px-2 py-0.5 rounded-full ${layer.badgeClass}`}>
                      {layer.badgeText}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex gap-2.5 items-start pl-2 border-l border-white/5">
                      <div>
                        <span className="text-[8px] text-white/30 font-semibold block">{layer.timeText}</span>
                        <h4 className="text-[10px] sm:text-[11px] font-bold text-white/80 tracking-tight leading-tight">
                          {layer.eventTitle}
                        </h4>
                        <span className="text-[8px] text-white/40 block mt-1">
                          {layer.eventMeta}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3.5 font-sans">
                  <p className="text-sm text-white/60 leading-relaxed font-normal">
                    {layer.desc}
                  </p>
                  <ul className="space-y-2 pt-2">
                    {layer.bullets.map((bullet, bIdx) => (
                      <li key={bIdx} className="flex items-start gap-2.5 text-xs text-white/45">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white/20 shrink-0"></span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
