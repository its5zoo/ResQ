import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Sparkles, AlertTriangle, CalendarDays, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function GlobalVoiceAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isListening, setIsListening] = useState(false);
  const [isWoken, setIsWoken] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('How can I help you today? Try saying "Hey ResQ" or click one of the quick scenarios.');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [micState, setMicState] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'speaking'
  const [choices, setChoices] = useState([]);
  
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  // Initialize Speech Synthesis and Speech Recognition
  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        console.log('Background wake-word recognition active (listening for "Hey ResQ")...');
      };

      recognition.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const speechText = event.results[lastResultIndex][0].transcript.toLowerCase().trim();
        console.log('Heard speech:', speechText);

        if (!isWoken) {
          // Listen for wake word
          if (speechText.includes('hey resq') || speechText.includes('hey rescue') || speechText.includes('hey res') || speechText.includes('hey key')) {
            triggerWakeUp();
          }
        } else {
          // Process active commands
          setTranscript(event.results[lastResultIndex][0].transcript);
          processCommand(speechText);
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechSupported(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Restart background listening automatically if not woken
        if (!isWoken) {
          try {
            recognition.start();
          } catch (e) {
            console.error('Failed to restart recognition:', e);
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();

    } catch (err) {
      console.error('Speech Recognition initialization failed:', err);
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [isWoken]);

  // Voice synthesis feedback helper
  const speakBack = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel(); // Stop any ongoing speech
    
    setMicState('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      setMicState(isWoken ? 'listening' : 'idle');
    };
    utterance.onerror = () => {
      setMicState(isWoken ? 'listening' : 'idle');
    };
    synthRef.current.speak(utterance);
  };

  // Wake up assistant
  const triggerWakeUp = () => {
    setIsWoken(true);
    setMicState('listening');
    setTranscript('');
    setChoices([]);
    setAiResponse("I'm here! What would you like me to do? You can check schedules, study blocks, or deadlines.");
    speakBack("I am here. How can I help you?");

    // If speech recognition is active, reset it to active mode
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.start();
          }
        }, 300);
      } catch (e) {}
    }
  };

  // Close assistant
  const closeAssistant = () => {
    setIsWoken(false);
    setMicState('idle');
    setTranscript('');
    setChoices([]);
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    // Restart recognition in background mode
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  // Pre-programmed Command Processor (Decision Tree)
  const processCommand = (commandText) => {
    setMicState('processing');
    
    // Scenario 1: Study timetables / scheduling block queries
    if (commandText.includes('study') || commandText.includes('schedule study') || commandText.includes('time table') || commandText.includes('timetable')) {
      const promptText = "I'd love to schedule a study block for you. Do you have a particular time in mind to study? If you choose a specific time, I will fix it on your calendar. Otherwise, we can keep the time flexible and only fix the day.";
      setAiResponse(promptText);
      speakBack(promptText);
      setChoices([
        { 
          label: "Study at 10:00 AM (Fixed)", 
          action: () => handleStudySelection("10:00 AM", true)
        },
        { 
          label: "Study at 04:00 PM (Fixed)", 
          action: () => handleStudySelection("04:00 PM", true)
        },
        { 
          label: "Flexible (Only fix the day)", 
          action: () => handleStudySelection(null, false)
        }
      ]);
    }
    // Scenario 2: Summarize today
    else if (commandText.includes('today') || commandText.includes('summarize') || commandText.includes('todo') || commandText.includes('plan')) {
      const summaryText = "Here is your plan for today: You have a team sync scheduled for 10:00 AM, and I have blocked out an AI Focus Block for React UI integration at 04:00 PM. Let's stay focused and make it a productive day!";
      setAiResponse(summaryText);
      speakBack(summaryText);
      setChoices([
        {
          label: "View Calendar",
          action: () => {
            navigate('/dashboard?tab=calendar');
            closeAssistant();
          }
        },
        {
          label: "View Tasks",
          action: () => {
            navigate('/dashboard?tab=tasks');
            closeAssistant();
          }
        }
      ]);
    }
    // Scenario 3: Deadlines
    else if (commandText.includes('deadline') || commandText.includes('hazard') || commandText.includes('due')) {
      const deadlineText = "Warning: Your Hackathon Project deadline is at 06:00 PM today. Our hazard radar registers zero schedule buffer remaining. Focus shield is fully active. Let's work smart.";
      setAiResponse(deadlineText);
      speakBack(deadlineText);
      setChoices([
        {
          label: "Check Buffer Time",
          action: () => {
            navigate('/dashboard');
            closeAssistant();
          }
        }
      ]);
    }
    // Unknown commands
    else {
      const fallbackText = `I heard you say: "${commandText}". ResQ AI is ready to execute. I will connect this request to your backend logic when hooked up.`;
      setAiResponse(fallbackText);
      speakBack(fallbackText);
      setChoices([
        {
          label: "Reset Conversation",
          action: () => {
            setAiResponse("What would you like me to do? You can check schedules, study blocks, or deadlines.");
            setChoices([]);
          }
        }
      ]);
    }
  };

  // Study scheduling scenario branches
  const handleStudySelection = (time, isFixed) => {
    setMicState('processing');
    if (isFixed) {
      const text = `Perfect. I have booked your study block at ${time} on your calendar. Focus shielding will engage automatically.`;
      setAiResponse(text);
      speakBack(text);
    } else {
      const text = "Understood. The study block is set to flexible. I will register the day as a study target on your goals dashboard, and let the AI find the optimal focus window on the fly.";
      setAiResponse(text);
      speakBack(text);
    }
    setChoices([
      {
        label: "Go to Calendar",
        action: () => {
          navigate('/dashboard?tab=calendar');
          closeAssistant();
        }
      },
      {
        label: "Go to Goals",
        action: () => {
          navigate('/dashboard?tab=goals');
          closeAssistant();
        }
      }
    ]);
  };

  // Interactive buttons to trigger queries without speaking (useful for testing)
  const triggerScenario = (phrase) => {
    setTranscript(`[Scenario Click]: "${phrase}"`);
    processCommand(phrase.toLowerCase());
  };

  return (
    <>
      {/* Floating Breathing Orb Button */}
      <div 
        onClick={isWoken ? closeAssistant : triggerWakeUp}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-black border rounded-full flex items-center justify-center cursor-pointer shadow-2xl z-[9999] transition-all duration-300 ${
          isWoken 
            ? 'border-[#EF4444] shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:scale-105' 
            : 'border-[#E5B842]/40 hover:border-[#E5B842] shadow-[0_0_20px_rgba(229,184,66,0.2)] hover:scale-110'
        } group`}
        title={isWoken ? "Close Assistant" : "Say 'Hey ResQ' or Click to Speak"}
      >
        {/* Pulsing ring inside orb */}
        <div className={`absolute inset-0.5 rounded-full border border-white/5 bg-[#09090b] z-0`}></div>
        
        {/* Dynamic Breathing Outline */}
        <div className={`absolute inset-0 rounded-full border border-dashed transition-all duration-1000 ${
          isWoken 
            ? 'border-[#EF4444]/60 animate-spin border-spacing-2' 
            : 'border-[#E5B842]/20 group-hover:border-[#E5B842]/50 animate-pulse'
        }`}></div>

        <div className="z-10 flex items-center justify-center">
          {isWoken ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Mic className="w-5 h-5 text-[#E5B842] transition-colors duration-300 group-hover:text-white" />
          )}
        </div>

        {/* Small background indicator showing speech activity */}
        {isListening && !isWoken && (
          <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5B842] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E5B842] border border-black"></span>
          </span>
        )}
      </div>

      {/* Expanded Voice Console Overlay */}
      {isWoken && (
        <div className="fixed bottom-24 right-6 w-[calc(100vw-32px)] sm:w-[420px] bg-[#09090b]/95 border border-white/10 rounded-3xl p-6 shadow-2xl z-[9998] font-sans backdrop-blur-xl animate-fade-in-up">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#E5B842]" />
              <span className="text-xs font-tech font-bold text-[#E5B842] tracking-wider uppercase">ResQ Voice AI</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-tech px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50 uppercase">
                {micState === 'speaking' ? 'Speaking' : micState === 'processing' ? 'Processing' : 'Listening'}
              </span>
              <button 
                onClick={closeAssistant}
                className="p-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dynamic Audio Waves Visualizer */}
          <div className="h-16 flex items-center justify-center gap-1.5 mb-5 bg-[#050505] border border-white/[0.03] rounded-2xl relative overflow-hidden">
            {/* Visual background elements */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#E5B842]/[0.02] to-transparent"></div>
            
            {/* Wave Bars */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((barHeight, idx) => {
              // Calculate animation duration based on state
              let animDuration = '0s';
              if (micState === 'listening') animDuration = `${0.6 + (idx % 3) * 0.2}s`;
              else if (micState === 'speaking') animDuration = `${0.3 + (idx % 2) * 0.15}s`;
              else if (micState === 'processing') animDuration = '0.5s animate-pulse';

              return (
                <div 
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    micState === 'speaking' 
                      ? 'bg-[#E5B842]' 
                      : micState === 'processing' 
                      ? 'bg-[#E5B842]/40' 
                      : 'bg-white/20'
                  }`}
                  style={{
                    height: `${barHeight * 3}px`,
                    animation: micState !== 'idle' ? `voiceWave ${animDuration} infinite ease-in-out` : 'none',
                    animationDelay: `${idx * 0.05}s`
                  }}
                />
              );
            })}
          </div>

          {/* Transcript Display */}
          <div className="space-y-4">
            
            {/* User Speech Transcript */}
            <div className="space-y-1">
              <span className="text-[10px] font-tech text-white/30 uppercase tracking-widest block">You said:</span>
              <p className="text-sm font-medium text-white/90 italic pl-1 border-l-2 border-white/10 min-h-[20px]">
                {transcript || 'Waiting for speech... (Say "Hey ResQ" or ask a question)'}
              </p>
            </div>

            {/* AI Assistant Output */}
            <div className="space-y-1 bg-white/[0.02] border border-white/[0.03] p-4 rounded-2xl relative">
              <span className="text-[10px] font-tech text-[#E5B842] uppercase tracking-widest block mb-1">ResQ AI:</span>
              <p className="text-sm text-white/80 leading-relaxed font-sans">
                {aiResponse}
              </p>

              {/* Action Choices */}
              {choices.length > 0 && (
                <div className="flex flex-col gap-2 mt-4 pt-3 border-t border-white/5">
                  {choices.map((choice, idx) => (
                    <button
                      key={idx}
                      onClick={choice.action}
                      className="w-full text-left text-xs bg-white/5 hover:bg-[#E5B842] hover:text-black border border-white/10 hover:border-[#E5B842] text-white/80 px-3.5 py-2 rounded-xl font-semibold transition-all duration-300"
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Testing Triggers */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[9px] font-tech text-white/30 uppercase tracking-widest block">Quick simulator triggers:</span>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => triggerScenario("Summarize today")}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/[0.08] transition-all text-center"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-white/55 mb-1" />
                  <span className="text-[8px] text-white/60 font-semibold font-tech">Summarize Day</span>
                </button>
                <button 
                  onClick={() => triggerScenario("Set study time table")}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/[0.08] transition-all text-center"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#E5B842] mb-1" />
                  <span className="text-[8px] text-white/60 font-semibold font-tech">Study Planner</span>
                </button>
                <button 
                  onClick={() => triggerScenario("Show deadlines")}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-white/5 border border-white/5 hover:border-white/15 hover:bg-white/[0.08] transition-all text-center"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444] mb-1" />
                  <span className="text-[8px] text-white/60 font-semibold font-tech">Deadlines Alert</span>
                </button>
              </div>
            </div>

            {/* Micro/Permission notification */}
            {!speechSupported && (
              <div className="p-2.5 bg-[#EF4444]/5 border border-[#EF4444]/20 rounded-xl text-center">
                <span className="text-[9px] text-[#EF4444] leading-normal font-tech">
                  ⚠️ Speech API not enabled/mic permission denied. Use the simulator buttons to test the conversation flows!
                </span>
              </div>
            )}

          </div>

        </div>
      )}

      {/* Embed wave animation keyframes inside style tag */}
      <style>{`
        @keyframes voiceWave {
          0%, 100% { transform: scaleY(0.7); }
          50% { transform: scaleY(1.4); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.3s ease-out forwards;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
