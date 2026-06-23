import React, { useState } from 'react';
import { Settings, Shield, Bell, Calendar, User, Eye } from 'lucide-react';

export default function SettingsPage() {
  const [proactivity, setProactivity] = useState(3); // 1 to 5 scale
  const [allowEmail, setAllowEmail] = useState(true);
  const [allowPush, setAllowPush] = useState(true);
  const [selectedCalendars, setSelectedCalendars] = useState(['primary', 'work']);

  const proactivityLabels = [
    'Gentle (Alerts only)',
    'Balanced (Alerts + Nudges)',
    'Optimal (Autonomic scheduling)',
    'Aggressive (Double-booking resolution)',
    'Relentless (Full calendar control)'
  ];

  const handleCalToggle = (id) => {
    setSelectedCalendars(
      selectedCalendars.includes(id) 
        ? selectedCalendars.filter(item => item !== id) 
        : [...selectedCalendars, id]
    );
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <span className="text-xs font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-2">CONFIG SYSTEM</span>
        <h2 className="text-3xl font-display font-black tracking-tight text-white leading-none">
          Workspace Settings
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: General Profile & AI Proactivity */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Guardian Settings */}
           <div className="p-6 bg-[#090909] border border-white/[0.04] rounded-3xl space-y-6 layered-shadow-lg">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-1.5 font-display">
              <Shield className="w-4 h-4 text-[#E5B842]" /> AI Guardian Proactivity
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/50">Proactivity Scale Factor:</span>
                <span className="text-[#E5B842] font-bold uppercase">{proactivityLabels[proactivity - 1]}</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="5"
                value={proactivity} 
                onChange={(e) => setProactivity(parseInt(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#E5B842]"
              />
              <p className="text-xs text-white/50 leading-relaxed font-normal">
                This dictates the autonomy level of the priority scheduling engine. Level 3 (Optimal) permits the assistant to book free slots in your Google Calendar automatically. Level 5 allows full reorganization of overlapping slots.
              </p>
            </div>
          </div>

          {/* Connected calendars list */}
          <div className="p-6 bg-[#090909] border border-white/[0.04] rounded-3xl space-y-4 layered-shadow-lg">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-1.5 font-display">
              <Calendar className="w-4 h-4 text-[#E5B842]" /> Google Calendar Sync
            </h3>

            <div className="space-y-3">
              {[
                { id: 'primary', name: 'Primary Account (faizaan@gmail.com)' },
                { id: 'work', name: 'Work Calendar (CN Hackathon)' },
                { id: 'holidays', name: 'Indian Holidays' }
              ].map((cal) => {
                const active = selectedCalendars.includes(cal.id);
                return (
                  <div 
                    key={cal.id}
                    onClick={() => handleCalToggle(cal.id)}
                    className="flex items-center justify-between p-3.5 bg-black/40 border border-white/[0.03] rounded-xl cursor-pointer hover:border-white/10 transition-all duration-300"
                  >
                    <span className="text-sm text-white/85">{cal.name}</span>
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 border ${active ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${active ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Side: Notification channels */}
        <div className="space-y-6">
          <div className="p-6 bg-[#090909] border border-white/[0.04] rounded-3xl space-y-6 layered-shadow-lg">
            <h3 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-1.5 font-display">
              <Bell className="w-4 h-4 text-[#E5B842]" /> Notification Channels
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/75">Push Notifications</span>
                <div 
                  onClick={() => setAllowPush(!allowPush)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 border cursor-pointer ${allowPush ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${allowPush ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`}></div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-white/75">Daily Email Briefings</span>
                <div 
                  onClick={() => setAllowEmail(!allowEmail)}
                  className={`w-9 h-5 rounded-full p-0.5 transition-all duration-300 border cursor-pointer ${allowEmail ? 'bg-[#E5B842] border-[#E5B842]' : 'bg-transparent border-white/20'}`}
                >
                  <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${allowEmail ? 'translate-x-4 bg-black' : 'translate-x-0 bg-white/40'}`}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy statement */}
          <div className="p-5 bg-black/40 border border-white/[0.03] rounded-2xl text-xs text-white/45 leading-relaxed space-y-2 layered-shadow-lg">
            <h4 className="font-bold text-white/60">🔐 Privacy Credentials</h4>
            <p>Your calendar access scopes, schedules, profiles, and voice histories are fully encrypted. No telemetry is shared with external model fine-tuning arrays.</p>
          </div>
        </div>

      </div>

    </div>
  );
}

