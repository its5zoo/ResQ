import React from 'react';
import { Bell, Flame, Calendar, Sparkles, Check, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      type: 'alert',
      unread: true,
      icon: <Sparkles className="w-4 h-4 text-black" />,
      title: "AI auto-scheduled React UI Focus Block",
      desc: "An empty spot was found on June 23 at 4:00 PM. Reserved 45 mins.",
      time: "2 hours ago"
    },
    {
      id: 2,
      type: 'achievement',
      unread: true,
      icon: <Flame className="w-4 h-4 text-[#E5B842]" />,
      title: "Streak Milestones: 7 days Gym workout!",
      desc: "Outstanding momentum. Continue today to lock in a new streak record.",
      time: "5 hours ago"
    },
    {
      id: 3,
      type: 'deadline',
      unread: false,
      icon: <Calendar className="w-4 h-4 text-status-red" />,
      title: "Vibe2Ship Hackathon submission deadline alert",
      desc: "Warning: Submission portal closes in 2 hours. Ensure tasks are marked.",
      time: "Yesterday"
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <span className="text-xs font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-2">ALERT REGISTRY</span>
          <h2 className="text-3xl font-display font-black tracking-tight text-white leading-none">
            Notifications & Actions
          </h2>
        </div>
        <button className="text-[10px] font-bold text-[#E5B842] hover:text-[#FFF2CC] uppercase tracking-widest cursor-pointer font-tech transition-colors duration-300">
          Mark all read
        </button>
      </div>

      {/* Notifications list */}
      <div className="space-y-4 max-w-4xl">
        {notifications.map((item) => (
          <div 
            key={item.id}
            className={`p-6 bg-[#090909] border border-white/[0.04] hover:border-white/10 rounded-3xl flex items-start gap-5 transition-all duration-300 layered-shadow-lg hover:layered-shadow-xl relative overflow-hidden group ${
              item.type === 'alert' && item.unread ? 'card-shine-sweep' : ''
            }`}
          >
            {/* Ambient indicator stripe */}
            <div className={`absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 ${
              item.type === 'alert' 
                ? 'bg-[#E5B842]' 
                : item.type === 'achievement' 
                  ? 'bg-[#E5B842]/40' 
                  : 'bg-status-red'
            }`}></div>

            {/* Icon Container */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-300 ${
              item.type === 'alert'
                ? 'bg-[#E5B842] border-[#E5B842] text-black shadow-[0_0_15px_rgba(229,184,66,0.15)]'
                : item.type === 'achievement'
                  ? 'bg-[#E5B842]/10 border-[#E5B842]/20 text-[#E5B842] shadow-[0_0_15px_rgba(229,184,66,0.05)]'
                  : 'bg-black border-status-red/20 text-status-red shadow-[0_0_15px_rgba(255,95,95,0.05)]'
            }`}>
              {item.icon}
            </div>

            {/* Text details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className="text-xs font-bold text-white group-hover:text-white/95 leading-none truncate">
                    {item.title}
                  </h4>
                  {item.unread && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#E5B842] shadow-[0_0_8px_rgba(229,184,66,0.8)] shrink-0 animate-pulse"></span>
                  )}
                </div>
                <span className="text-[9px] font-tech text-white/35 shrink-0 uppercase tracking-wider">{item.time}</span>
              </div>
              <p className="text-[11px] text-white/50 leading-relaxed font-light mt-2.5 max-w-2xl">
                {item.desc}
              </p>
            </div>
          </div>
        ))}

        {notifications.length === 0 && (
          <div className="text-center py-20 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-[#E5B842]/30 mx-auto mb-3" />
            <p className="text-sm text-white/40">You have no new alerts.</p>
          </div>
        )}
      </div>

    </div>
  );
}
