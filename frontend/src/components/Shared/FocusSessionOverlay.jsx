import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, X, Coffee
} from 'lucide-react';
import voicePersonality from '../../services/VoicePersonality.js';
import { wakeWordEngine } from '../../services/WakeWordEngine.js';

export default function FocusSessionOverlay({ taskName, duration, userName, onClose }) {
  const [phase, setPhase] = useState('focus'); // 'focus' | 'break'
  const [isPaused, setIsPaused] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(duration * 60);
  const [totalSeconds, setTotalSeconds] = useState(duration * 60);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const recognitionRef = useRef(null);
  
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
    // Cancel any ongoing TTS from GlobalVoiceAssistant before playing chime
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    // Small delay so the GlobalVoiceAssistant's voice finishes gracefully, then chime plays
    setTimeout(() => {
      playAscendingChime();
    }, 300);
    // Note: GlobalVoiceAssistant already announces the session start — no duplicate TTS here

    // Block notifications during focus session
    window.dispatchEvent(new CustomEvent('resq:notifications-block', { detail: { blocked: true } }));

    // Block global wake word listeners on mount
    wakeWordEngine.stopBackgroundListening();
    wakeWordEngine.stopCommandListening();

    // Start local SpeechRecognition after a short delay to ensure hardware mic is released
    const startTimeout = setTimeout(() => {
      startLocalSpeechListener();
    }, 400);

    return () => {
      activeRef.current = false;
      clearTimeout(startTimeout);

      if (recognitionRef.current) {
        if (typeof recognitionRef.current._stopCleanup === 'function') {
          recognitionRef.current._stopCleanup();
        } else {
          try { recognitionRef.current.abort(); } catch { /* ignore */ }
        }
      }

      // Unblock notifications
      window.dispatchEvent(new CustomEvent('resq:notifications-block', { detail: { blocked: false } }));

      // Restore global wake word listener
      wakeWordEngine.startBackgroundListening();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 2. Local speech command listener (always listening, no wake word needed)
  function startLocalSpeechListener() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    let isListening = false;
    let restartTimeout = null;
    let commandCooldown = false; // prevent rapid re-triggering

    const recog = new SpeechRecognition();
    recog.continuous = false; // use false + restart for better reliability
    recog.interimResults = false;
    recog.lang = 'en-US';
    recog.maxAlternatives = 3; // capture alternative transcriptions too

    const startRecog = () => {
      if (!activeRef.current || isListening) return;
      try {
        recog.start();
        isListening = true;
      } catch (err) { 
        // If it throws (e.g. mic not released yet), retry in 500ms
        setTimeout(startRecog, 500);
      }
    };

    recog.onresult = (e) => {
      if (!activeRef.current || commandCooldown) return;

      // Collect all alternatives for best match
      const alternatives = [];
      for (let i = 0; i < e.results.length; i++) {
        for (let j = 0; j < e.results[i].length; j++) {
          alternatives.push(e.results[i][j].transcript.trim().toLowerCase());
        }
      }
      const transcript = alternatives[0] || '';
      console.log('[Focus Speech] Heard:', alternatives);

      // Helper: check if any alternative matches keywords
      const matches = (keywords) => alternatives.some(alt => keywords.some(kw => alt.includes(kw)));

      // ─── AWAITING CONFIRMATION ────────────────────────────────────
      if (showEndConfirmationRef.current) {
        if (matches(['yes', 'yeah', 'yep', 'confirm', 'do it', 'end', 'stop', 'quit', 'haa', 'ha'])) {
          commandCooldown = true;
          handleEndSessionConfirm();
        } else if (matches(['no', 'cancel', 'nah', 'wait', 'nevermind', 'nahi'])) {
          commandCooldown = true;
          setShowEndConfirmation(false);
          speakBack('Confirmation cancelled. Resuming focus.');
          setTimeout(() => { commandCooldown = false; }, 2000);
        }
        return; // Don't process other commands while waiting for confirmation
      }

      // ─── STOP / END ────────────────────────────────────────────────
      const stopKeywords = [
        'stop', 'stp', 'stopp', 'stap', // typo variants speech recog may produce
        'end', 'end session', 'end focus',
        'finish', 'finish session', 'done', 'quit', 'exit',
        'cancel session', 'terminate', 'halt',
        'band karo', 'ruk', 'ruko', 'band kar'
      ];

      // ─── PAUSE ────────────────────────────────────────────────────
      const pauseKeywords = [
        'pause', 'paws', 'pauz', // speech recog variants
        'pause session', 'hold', 'hold on',
        'wait', 'take a break', 'ruk ja', 'rok'
      ];

      // ─── RESUME / PLAY ────────────────────────────────────────────
      const resumeKeywords = [
        'resume', 'rezume', 'resome', // speech recog variants
        'resume session', 'continue', 'start again',
        'play', 'go', 'unpause', 'carry on',
        'shuru', 'chalu', 'dobara shuru'
      ];

      if (matches(stopKeywords)) {
        commandCooldown = true;
        handleEndSessionConfirm();
      } else if (matches(pauseKeywords)) {
        commandCooldown = true;
        setIsPaused(true);
        speakBack('Session paused.');
        setTimeout(() => { commandCooldown = false; }, 2000);
      } else if (matches(resumeKeywords)) {
        commandCooldown = true;
        setIsPaused(false);
        speakBack('Resuming session.');
        setTimeout(() => { commandCooldown = false; }, 2000);
      } else if (matches(['time left', 'how much time', 'remaining', 'kitna time', 'time bata', 'how long'])) {
        commandCooldown = true;
        const mins = Math.floor(remainingSecondsRef.current / 60);
        const secs = remainingSecondsRef.current % 60;
        const speakText = mins > 0
          ? `${mins} minutes and ${secs} seconds remaining.`
          : `${secs} seconds remaining.`;
        speakBack(speakText);
        setTimeout(() => { commandCooldown = false; }, 3000);
      }
    };

    recog.onstart = () => { isListening = true; };

    recog.onend = () => {
      isListening = false;
      if (activeRef.current) {
        // Restart with small delay to avoid rapid cycling
        restartTimeout = setTimeout(startRecog, 300);
      }
    };

    recog.onerror = (e) => {
      isListening = false;
      console.warn('[Focus Speech] Error:', e.error);
      if (activeRef.current && e.error !== 'not-allowed' && e.error !== 'service-not-allowed') {
        restartTimeout = setTimeout(startRecog, 800);
      }
    };

    recognitionRef.current = recog;
    recognitionRef.current._stopCleanup = () => {
      clearTimeout(restartTimeout);
      isListening = false;
      try { recog.abort(); } catch { /* ignore */ }
    };

    startRecog();
  }

  // Simple TTS feedback — does NOT abort recognition (recognition auto-restarts via onend)
  function speakBack(text) {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      window.speechSynthesis.speak(utter);
    }
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
                  // Removed speakBack to make manual clicks silent
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
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-xl border border-white/10 px-8 py-5 rounded-3xl flex items-center gap-8 shadow-[0_0_40px_rgba(239,68,68,0.15)] relative z-20 animate-fade-in-up">
            <span className="text-base font-medium text-white tracking-wide">You want to end task?</span>
            <div className="flex gap-3">
              <button 
                onClick={handleEndSessionConfirm}
                className="px-6 py-2.5 bg-[#EF4444] text-white hover:bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-xs font-bold uppercase tracking-widest rounded-xl cursor-pointer transition-all active:scale-95"
              >
                End
              </button>
              <button 
                onClick={() => {
                  setShowEndConfirmation(false);
                }}
                className="px-6 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white/70 text-xs font-bold uppercase tracking-widest rounded-xl cursor-pointer transition-all active:scale-95"
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
            "Say 'pause', 'resume', 'how much time left', or just <strong className='text-white/50 not-italic'>stop</strong> to end anytime."
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
