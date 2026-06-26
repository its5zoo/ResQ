import { useState, useEffect } from 'react';
import { Clock, Play, Pause, BellOff, Volume2, Shield } from 'lucide-react';

export default function FocusSessionAnimation() {
  const [phase, setPhase] = useState('idle'); // idle, starting, active, voice_command, paused
  const [time, setTime] = useState('25:00');
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      while (isMounted) {
        // Idle
        setPhase('idle');
        setTime('25:00');
        await new Promise(r => setTimeout(r, 2000));
        if (!isMounted) break;

        // Voice Command Interrupt
        setPhase('voice_command');
        await new Promise(r => setTimeout(r, 2500));
        if (!isMounted) break;

        // Starting
        setPhase('starting');
        await new Promise(r => setTimeout(r, 1200));
        if (!isMounted) break;

        // Active countdown
        setPhase('active');
        const times = ['25:00', '24:59', '24:58', '24:57', '24:56'];
        for (let t of times) {
          setTime(t);
          setPulse(p => !p);
          await new Promise(r => setTimeout(r, 800));
          if (!isMounted) break;
        }
        if (!isMounted) break;

        // Hold active state
        await new Promise(r => setTimeout(r, 2000));
        if (!isMounted) break;
      }
    };

    run();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full bg-[#050505] text-white p-6 font-sans flex flex-col items-center justify-center min-h-[340px] select-none relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-radial-gradient from-[#E5B842]/5 to-transparent pointer-events-none"></div>

      {/* Main Focus Ring Layout */}
      <div className="flex flex-col items-center gap-6 relative z-10 w-full max-w-xs">
        
        {/* Radial Progress & Timer */}
        <div className="relative w-36 h-36 flex items-center justify-center">
          {/* Outer Pulsing Rings */}
          <div className={`absolute inset-0 rounded-full border border-[#E5B842]/20 transition-transform duration-1000 ${phase === 'active' ? 'scale-110 animate-ping opacity-20' : 'scale-100'}`}></div>
          <div className={`absolute inset-2 rounded-full border border-white/5`}></div>

          {/* SVG Progress Circle */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background track */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-white/5 fill-none"
              strokeWidth="4"
            />
            {/* Foreground progress */}
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-[#E5B842] fill-none transition-all duration-1000"
              strokeWidth="4"
              strokeDasharray="276.4"
              strokeDashoffset={phase === 'idle' ? '276.4' : phase === 'starting' ? '20' : '60'}
              strokeLinecap="round"
            />
          </svg>

          {/* Timer text & icon */}
          <div className="flex flex-col items-center justify-center z-10">
            <span className="text-3xl font-display font-black tracking-tight text-white">
              {time}
            </span>
            <span className="text-[9px] font-tech tracking-[0.2em] text-[#E5B842] uppercase mt-1">
              {phase === 'idle' ? 'Ready' : phase === 'starting' ? 'Loading' : phase === 'active' ? 'Focusing' : 'Listening'}
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="w-full space-y-3">
          {/* DND Toggle Row */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center gap-2">
              <BellOff className={`w-4 h-4 ${phase === 'active' || phase === 'voice_command' ? 'text-[#E5B842] animate-pulse' : 'text-white/30'}`} />
              <span className="text-xs font-semibold text-white/70">Slack & Teams DND</span>
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${phase === 'active' || phase === 'voice_command' ? 'bg-[#E5B842]/10 text-[#E5B842]' : 'bg-white/5 text-white/30'}`}>
              {phase === 'active' || phase === 'voice_command' ? 'Muted' : 'Off'}
            </span>
          </div>

          {/* Voice Prompt overlay */}
          <div className="min-h-[44px] flex items-center justify-center text-center">
            {phase === 'idle' && (
              <p className="text-xs text-white/40 italic">Say "start my focus session for 25 min"</p>
            )}
            {phase === 'starting' && (
              <p className="text-xs text-[#E5B842] font-semibold animate-pulse">Initializing Focus Mode...</p>
            )}
            {phase === 'active' && (
              <p className="text-xs text-white/70">Flow state active. Keep it up!</p>
            )}
            {phase === 'voice_command' && (
              <div className="flex flex-col items-center gap-1">
                <p className="text-[10px] font-tech text-[#E5B842] uppercase tracking-wider animate-pulse">Voice Command Detected</p>
                <p className="text-xs text-white font-semibold">"start my focus session for 25 min"</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
