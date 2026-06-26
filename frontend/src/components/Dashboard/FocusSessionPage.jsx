import { useState } from 'react';
import { Zap, Play, Clock, Brain, BellOff, VolumeX, ShieldCheck } from 'lucide-react';

export default function FocusSessionPage() {
  const [taskName, setTaskName] = useState('');
  const [duration, setDuration] = useState(25);

  const handleStartFocus = () => {
    if (duration < 1) return;
    const finalTaskName = taskName.trim() || 'Deep Work Session';
    window.dispatchEvent(new CustomEvent('resq:start-focus', { 
      detail: { taskName: finalTaskName, durationMinutes: duration } 
    }));
    setTaskName('');
  };

  return (
    <div className="max-w-5xl mx-auto h-full flex flex-col pt-4">
      <header className="mb-8 shrink-0">
        <h3 className="text-[#E5B842] uppercase tracking-[0.2em] text-xs font-bold mb-2">Deep Work</h3>
        <h1 className="text-3xl lg:text-4xl font-black text-white font-display tracking-tight flex items-center gap-3">
          Focus Session
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 tracking-normal uppercase">
            Beta
          </span>
        </h1>
        <p className="text-white/50 mt-2 text-sm max-w-xl leading-relaxed">
          Enter Cognitive Shield mode. Block out distractions, mute notifications, and immerse yourself in deep, uninterrupted work.
        </p>
      </header>

      <div className="flex-1 flex flex-col justify-center items-center pb-20">
        <div className="w-full max-w-md p-8 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-xl relative overflow-hidden group">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-[#E5B842]/10 blur-3xl rounded-full pointer-events-none transition-all duration-700 group-hover:bg-[#E5B842]/20"></div>
          
          <div className="relative z-10 flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/30 flex items-center justify-center mb-4 card-shine-sweep">
              <Brain className="w-8 h-8 text-[#E5B842]" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Configure Session</h2>
            <p className="text-sm text-white/50">Set your intention and duration before diving in.</p>
          </div>

          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                What are you focusing on?
              </label>
              <input 
                type="text" 
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="e.g. Study React Native, Write Audit Report"
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#E5B842]/50 focus:ring-1 focus:ring-[#E5B842]/50 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white/70 uppercase tracking-wider mb-2 flex justify-between">
                <span>Duration (Minutes)</span>
                <span className="text-[#E5B842]">{duration} min</span>
              </label>
              <input 
                type="range" 
                min="5" 
                max="120" 
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full accent-[#E5B842]"
              />
              <div className="flex justify-between text-xs text-white/40 mt-2 font-medium">
                <span>5m</span>
                <span>60m</span>
                <span>120m</span>
              </div>
            </div>

            <button 
              onClick={handleStartFocus}
              className="w-full bg-[#E5B842] hover:bg-[#f0c34f] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(229,184,66,0.3)]"
            >
              <Play className="w-5 h-5 fill-current" />
              Start Deep Work
            </button>
          </div>
        </div>

        <div className="flex gap-6 mt-10 text-white/40 text-sm font-medium">
          <div className="flex items-center gap-2">
            <BellOff className="w-4 h-4" /> Mutes Notifications
          </div>
          <div className="flex items-center gap-2">
            <VolumeX className="w-4 h-4" /> Blocks Distractions
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Cognitive Shield
          </div>
        </div>
      </div>
    </div>
  );
}
