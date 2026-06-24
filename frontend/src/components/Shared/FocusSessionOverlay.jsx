import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, X, Coffee, Wind
} from 'lucide-react';
import voicePersonality from '../../services/VoicePersonality.js';
import { wakeWordEngine } from '../../services/WakeWordEngine.js';

export default function FocusSessionOverlay({ taskName, duration, userName, onClose }) {
  const [phase, setPhase] = useState('focus'); // 'focus' | 'break'
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(duration * 60);
  const [totalSeconds, setTotalSeconds] = useState(duration * 60);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const [ambientSound, setAmbientSound] = useState('none'); // 'none' | 'brown_noise'

  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const brownNoiseSourceRef = useRef(null);
  
  const activeRef = useRef(true);
  const phaseRef = useRef(phase);
  const remainingSecondsRef = useRef(remainingSeconds);
  const showEndConfirmationRef = useRef(showEndConfirmation);
  const bellPlayedRef = useRef(false);

  // Sync refs
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { remainingSecondsRef.current = remainingSeconds; }, [remainingSeconds]);
  useEffect(() => { showEndConfirmationRef.current = showEndConfirmation; }, [showEndConfirmation]);

  // 1. Play ascending chime on start
  useEffect(() => {
    playAscendingChime();
    speakBack(`Starting focus session for: ${taskName}. Twenty-five minutes on the clock.`);

    // Block global wake word listeners on mount
    wakeWordEngine.stopBackgroundListener();
    wakeWordEngine.stopCommandListener();

    // Start local SpeechRecognition
    startLocalSpeechListener();

    return () => {
      activeRef.current = false;
      stopBrownNoise();
      
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch { /* ignore */ }
      }

      // Restore global wake word listener
      wakeWordEngine.startBackgroundListener();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Local speech command listener (always listening, no wake word)
  function startLocalSpeechListener() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.continuous = true;
    recog.interimResults = false;
    recog.lang = 'en-US';

    recog.onresult = (e) => {
      if (!activeRef.current) return;
      const transcript = e.results[e.results.length - 1][0].transcript.trim().toLowerCase();
      console.log('[Focus Speech] Command Captured:', transcript);

      // Awaiting End confirmation
      if (showEndConfirmationRef.current) {
        if (
          transcript.includes('yes') || 
          transcript.includes('yeah') || 
          transcript.includes('confirm') || 
          transcript.includes('do it') || 
          transcript.includes('stop') || 
          transcript.includes('end')
        ) {
          handleEndSessionConfirm();
        } else if (transcript.includes('no') || transcript.includes('cancel')) {
          setShowEndConfirmation(false);
          speakBack("Confirmation cancelled. Resuming focus.");
        }
        return;
      }

      // General Commands
      if (transcript.includes('pause session') || transcript.includes('pause')) {
        setIsPaused(true);
        speakBack("Session paused.");
      } else if (transcript.includes('resume session') || transcript.includes('resume')) {
        setIsPaused(false);
        speakBack("Resuming session.");
      } else if (transcript.includes('stop session') || transcript.includes('end session') || transcript.includes('stop focus') || transcript.includes('end focus')) {
        setShowEndConfirmation(true);
        speakBack("Are you sure you want to end the session? Just say stop session or click End.");
      } else if (transcript.includes('time left') || transcript.includes('how much time left') || transcript.includes('remaining time')) {
        const mins = Math.floor(remainingSecondsRef.current / 60);
        const secs = remainingSecondsRef.current % 60;
        let speakText = `You have ${mins} minutes and ${secs} seconds remaining in this ${phaseRef.current} phase.`;
        if (mins === 0) {
          speakText = `You have ${secs} seconds remaining in this ${phaseRef.current} phase.`;
        }
        speakBack(speakText);
      } else if (transcript.includes('skip break') || transcript.includes('skip rest')) {
        if (phaseRef.current === 'break') {
          handleSkipBreak();
        } else {
          speakBack("You can only skip break during a break phase.");
        }
      } else if (transcript.includes('turn on focus sounds') || transcript.includes('enable focus sounds') || transcript.includes('turn on ambient sounds')) {
        handleAmbientSoundMatrixToggle('brown_noise');
      } else if (transcript.includes('turn off focus sounds') || transcript.includes('disable focus sounds') || transcript.includes('turn off ambient sounds')) {
        handleAmbientSoundMatrixToggle('none');
      }
    };

    recog.onend = () => {
      if (activeRef.current) {
        try { recog.start(); } catch { /* ignore */ }
      }
    };

    recognitionRef.current = recog;
    try { recog.start(); } catch { /* ignore */ }
  }

  // Speaks feedback and pauses SpeechRecognition to prevent looping
  function speakBack(text) {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    voicePersonality.speak(text, {
      priority: true,
      onEnd: () => {
        if (activeRef.current && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch { /* ignore */ }
        }
      }
    });
  }

  // 3. Count Down Timer Loop
  useEffect(() => {
    let interval = null;
    if (!isPaused && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds(prev => {
          const nextVal = prev - 1;
          
          // Bell chime at 5m remaining (300s) during focus
          if (nextVal === 300 && phaseRef.current === 'focus' && !bellPlayedRef.current) {
            playGentleBell();
            bellPlayedRef.current = true;
          }

          if (nextVal <= 0) {
            clearInterval(interval);
            handlePhaseTransition();
            return 0;
          }
          return nextVal;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, remainingSeconds]);

  // 4. Pomodoro Phase transition
  function handlePhaseTransition() {
    if (phaseRef.current === 'focus') {
      // Transition to break
      playCompletionSound();
      const minutesWorked = Math.round(totalSeconds / 60);
      speakBack(`Focus session complete. You worked for ${minutesWorked} minutes. Well done, ${userName || 'user'}. Time for a five minute break.`);
      setPhase('break');
      setRemainingSeconds(5 * 60);
      setTotalSeconds(5 * 60);
      bellPlayedRef.current = false;
    } else {
      // Transition back to focus
      playAscendingChime();
      speakBack("Break over. Time to focus. Starting another twenty-five minute block.");
      setPhase('focus');
      setRemainingSeconds(duration * 60);
      setTotalSeconds(duration * 60);
    }
  }

  const handleSkipBreak = () => {
    playAscendingChime();
    speakBack("Resuming focus. Starting another twenty-five minute block.");
    setPhase('focus');
    setRemainingSeconds(duration * 60);
    setTotalSeconds(duration * 60);
  };

  const handleEndSessionConfirm = () => {
    playCompletionSound();
    onClose();
  };

  // 5. Procedural Web Audio Synthesis
  function playAscendingChime() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + idx * 0.12 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.45);
    });
  }

  function playGentleBell() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.value = 880;
    osc2.type = 'triangle';
    osc2.frequency.value = 1760;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 1.8);
    osc2.stop(ctx.currentTime + 1.8);
  }

  const playCompletionSound = () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + idx * 0.1 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.7);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.7);
    });
  };

  // 6. Web Audio Ambient Noise Loop (Lowpass Brown Noise)
  const handleAmbientSoundMatrixToggle = (soundType) => {
    if (ambientSound === soundType || soundType === 'none') {
      setAmbientSound('none');
      stopBrownNoise();
      speakBack("Focus sounds deactivated.");
    } else {
      setAmbientSound('brown_noise');
      startBrownNoise();
      speakBack("Focus sounds activated.");
    }
  };

  const startBrownNoise = () => {
    stopBrownNoise();
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const source = ctx.createBufferSource();
      source.buffer = noiseBuffer;
      source.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500; // Deep rumble focus

      const gain = ctx.createGain();
      gain.gain.value = 0.12;

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      source.start(0);
      brownNoiseSourceRef.current = source;
    } catch (e) {
      console.error('[BrownNoise] Failed:', e);
    }
  };

  function stopBrownNoise() {
    if (brownNoiseSourceRef.current) {
      try { brownNoiseSourceRef.current.stop(); } catch { /* ignore */ }
      brownNoiseSourceRef.current = null;
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch { /* ignore */ }
      audioCtxRef.current = null;
    }
  }

  // Format MM:SS
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Progress Bar percentage
  const dashOffset = 2 * Math.PI * 105 - (remainingSeconds / totalSeconds) * (2 * Math.PI * 105);

  return (
    <>
      <div className="fixed inset-0 bg-[#060608]/98 z-[99999] flex flex-col items-center justify-center p-8 backdrop-blur-3xl animate-fade-in text-white font-sans select-none">
        
        {/* Neon blur overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#E5B842]/5 blur-[130px] rounded-full pointer-events-none"></div>

        {/* Top Header */}
        <div className="w-full max-w-3xl flex items-center justify-between border-b border-white/5 pb-6 mb-12 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5B842] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E5B842]"></span>
            </span>
            <span className="text-sm font-tech font-bold uppercase tracking-[0.25em] text-[#E5B842]">
              {phase === 'focus' ? 'COGNITIVE SHIELD ACTIVE' : 'RECOVERY BREAK PERIOD'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-tech px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 uppercase tracking-wider font-semibold">
              Hands-Free Mode Active
            </span>
          </div>
        </div>

        {/* Middle Main Content */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-16 w-full max-w-4xl relative z-10">
          
          {/* Progress Ring Visualizer */}
          <div className="relative w-72 h-72 flex items-center justify-center">
            
            {/* Breathing Animation Background */}
            {!isPaused && (
              <div className="focus-breathing-circle"></div>
            )}
            
            <div className="absolute inset-0 rounded-full border border-white/[0.015] shadow-[inset_0_0_25px_rgba(255,255,255,0.01)]"></div>
            
            <svg className="w-72 h-72 transform -rotate-90">
              <defs>
                <linearGradient id="focusGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E5B842" />
                  <stop offset="100%" stopColor="#C97D2E" />
                </linearGradient>
              </defs>
              <circle
                cx="144"
                cy="144"
                r="105"
                stroke="rgba(255, 255, 255, 0.02)"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="144"
                cy="144"
                r="105"
                stroke="url(#focusGlow)"
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 105}
                strokeDashoffset={isNaN(dashOffset) ? 0 : dashOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>

            {/* Inside Countdown Text */}
            <div className="absolute flex flex-col items-center justify-center z-10">
              <span 
                className="font-mono text-white tracking-tighter leading-none mb-1 text-glow-gold"
                style={{ fontSize: '72px', fontWeight: 900 }}
              >
                {formatTime(remainingSeconds)}
              </span>
              <span className="text-sm font-tech font-bold uppercase tracking-widest text-white/70">
                {isPaused ? 'PAUSED' : phase === 'focus' ? 'FOCUSING' : 'RESTING'}
              </span>
            </div>
          </div>

          {/* Right Side Objective & Sounds */}
          <div className="flex-1 flex flex-col justify-center space-y-8 max-w-md text-center md:text-left">
            <div>
              <span className="text-sm font-tech text-[#E5B842] uppercase tracking-[0.2em] font-black block mb-2">
                {phase === 'focus' ? 'Current Objective' : 'Recovery Buffer'}
              </span>
              <h2 className="text-2xl font-display font-black tracking-tight leading-snug mb-3">
                {phase === 'focus' ? taskName : 'Take a moment to unwind'}
              </h2>
              <p className="text-sm text-white/50 leading-relaxed max-w-sm">
                {phase === 'focus' 
                  ? 'Your notifications are muted. The ResQ AI shield is protecting your session from external interruptions.'
                  : 'Let your cognitive load recover. Skipping or ending will resume your normal dashboard environment.'
                }
              </p>
            </div>

            {/* Sound Selector */}
            <div className="space-y-3.5 bg-white/[0.02] border border-white/[0.03] p-5 rounded-3xl">
              <span className="text-sm font-tech text-white/45 uppercase tracking-[0.15em] font-black block">Ambient Sound Matrix</span>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => handleAmbientSoundMatrixToggle('brown_noise')}
                  className={`flex-1 p-4 rounded-2xl border text-sm font-tech font-bold uppercase tracking-wider flex flex-col items-center gap-2 transition-all duration-300 cursor-pointer ${
                    ambientSound === 'brown_noise'
                      ? 'bg-[#E5B842]/15 border-[#E5B842]/40 text-[#E5B842] shadow-[0_0_15px_rgba(229,184,66,0.1)]'
                      : 'bg-black/40 border-white/5 text-white/70 hover:text-white hover:border-white/15'
                  }`}
                >
                  <Wind className="w-4.5 h-4.5" />
                  <span>Brown Noise Rumble</span>
                </button>
              </div>
            </div>

            {/* Backup buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button
                onClick={() => {
                  setIsPaused(!isPaused);
                  speakBack(isPaused ? "Resuming session." : "Session paused.");
                }}
                className={`px-5 py-3 border text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                  isPaused 
                    ? 'bg-[#E5B842] text-black border-transparent hover:brightness-110 shadow-md shadow-[#E5B842]/20' 
                    : 'bg-black/60 border-white/10 hover:bg-white/5 text-white/80'
                }`}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                <span>{isPaused ? 'Resume Session' : 'Pause Session'}</span>
              </button>

              {phase === 'break' && (
                <button
                  onClick={handleSkipBreak}
                  className="px-5 py-3 bg-[#E5B842]/5 border border-[#E5B842]/20 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-[#E5B842] text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Skip Break</span>
                </button>
              )}

              <button
                onClick={() => {
                  setShowEndConfirmation(true);
                  speakBack("Are you sure you want to end the session? Just say stop session or click End.");
                }}
                className="px-5 py-3 bg-[#EF4444]/10 border border-[#EF4444]/20 hover:bg-[#EF4444] hover:text-white hover:border-transparent text-[#EF4444] text-sm font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <X className="w-3.5 h-3.5" />
                <span>End Session</span>
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Slide-Over banner */}
        {showEndConfirmation && (
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[#0C0C0E] border border-[#EF4444]/30 px-8 py-5 rounded-2xl flex items-center gap-6 shadow-2xl relative z-20 animate-fade-in-up">
            <span className="text-sm font-bold text-white/80">Are you sure? Say "yes" or click End to confirm.</span>
            <div className="flex gap-2">
              <button 
                onClick={handleEndSessionConfirm}
                className="px-4 py-2 bg-[#EF4444] text-white hover:brightness-110 text-sm font-bold uppercase tracking-wider rounded-xl cursor-pointer"
              >
                End
              </button>
              <button 
                onClick={() => {
                  setShowEndConfirmation(false);
                  speakBack("Confirmation cancelled. Resuming focus.");
                }}
                className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 text-sm font-bold uppercase tracking-wider rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* HUD bottom context bar */}
        <div className="mt-16 w-full max-w-3xl border-t border-white/5 pt-6 flex flex-col items-center gap-2 relative z-10">
          <span className="text-sm font-tech text-white/50 uppercase tracking-[0.3em]">RESQ SHIELD RADAR</span>
          <p className="text-sm text-white/35 italic text-center max-w-lg leading-relaxed">
            "Direct focus commands: say 'pause', 'resume', 'how much time left', or 'stop session' anytime."
          </p>
        </div>
      </div>

      <style>{`
        .focus-breathing-circle {
          position: absolute;
          width: 256px;
          height: 256px;
          border-radius: 50%;
          background: rgba(229, 184, 66, 0.03);
          animation: breathing 4s ease-in-out infinite;
          z-index: 0;
        }
        @keyframes breathing {
          0%, 100% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        .text-glow-gold {
          text-shadow: 0 0 20px rgba(229, 184, 66, 0.35);
        }
      `}</style>
    </>
  );
}
