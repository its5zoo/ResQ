import React, { useState } from 'react';
import { Mic, MicOff, Volume2, Sparkles } from 'lucide-react';

export default function VoiceSection() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('Click the mic and ask: "What does my day look like?"');
  const [aiResponse, setAiResponse] = useState('');

  const samplePrompts = [
    { q: "What's on my plate today?", a: "You have 3 tasks. The Vibe2Ship Hackathon submission is due in 2 hours. Focus session is booked for 4:00 PM." },
    { q: "Create a critical task for tomorrow", a: "Task 'Database schema optimization' created and synced to Google Calendar with High priority." },
    { q: "Check my habit streaks", a: "You are on a 7-day Gym streak. You have not checked it off today. Shall I schedule a slot?" }
  ];

  const handlePromptClick = (prompt) => {
    setIsListening(true);
    setTranscript(prompt.q);
    setAiResponse('Processing voice input...');
    
    setTimeout(() => {
      setIsListening(false);
      setAiResponse(prompt.a);
      // Trigger voice speech synthesis if available
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(prompt.a);
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }, 1200);
  };

  return (
    <section id="voice" className="py-44 relative bg-[#050505] bg-noise overflow-hidden border-t border-white/[0.03]">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-white/[0.015] rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        
        {/* Left Column: Waveform Simulator */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center p-10 bg-[#090909] border border-white/[0.05] rounded-3xl min-h-[420px] relative hover:border-white/10 transition-all duration-500 font-sans layered-shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.01),transparent_70%)] pointer-events-none"></div>
          
          {/* Animated Waveform */}
          <div className="flex items-end justify-center gap-2.5 h-36 mb-12 w-full max-w-[300px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((val) => (
              <span 
                key={val} 
                className={`w-1 rounded-full transition-all duration-300 ${
                  isListening 
                    ? 'bg-white animate-wave-bar' 
                    : 'bg-white/10 h-8'
                }`}
                style={{
                  animationDelay: `${val * 0.1}s`,
                  height: isListening ? undefined : `${(val % 4 + 1) * 10}px`
                }}
              ></span>
            ))}
          </div>

          {/* Mic Button */}
          <button 
            onClick={() => {
              setIsListening(!isListening);
              if (!isListening) {
                setTranscript('Listening for command...');
                setAiResponse('');
              } else {
                setTranscript('Click the mic and ask: "What does my day look like?"');
              }
            }}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 shadow-xl cursor-pointer ${
              isListening 
                ? 'bg-white text-black' 
                : 'bg-[#121212] text-white/40 border border-white/5 hover:border-white/40 hover:text-white'
            }`}
          >
            {isListening ? <Mic className="w-7 h-7 animate-pulse" /> : <MicOff className="w-7 h-7" />}
          </button>

          <span className="text-xs font-tech font-bold text-white/40 uppercase tracking-widest mt-5">
            {isListening ? "Listening Active" : "Click to Speak"}
          </span>
        </div>

        {/* Right Column: Transcript Dialogue */}
        <div className="lg:col-span-6 flex flex-col justify-center">
          <span className="text-xs font-tech font-bold tracking-[0.3em] uppercase text-white/50 block mb-5 font-sans">
            VOICE CONVERSATION
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-silver-gradient text-shine-sweep mb-8 leading-tight tracking-tight">
            Talk to your AI companion <br />
            on the go.
          </h2>
          
          <div className="space-y-5 mb-10">
            {/* User Transcript bubble */}
            <div className="p-5 rounded-2xl bg-[#090909] border border-white/[0.04] self-end font-sans">
              <span className="text-[10px] uppercase tracking-wider text-white/35 block mb-2 font-tech">User Command</span>
              <p className="text-sm text-white/80 font-medium">"{transcript}"</p>
            </div>

            {/* AI Response bubble */}
            {aiResponse && (
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 animate-fade-in font-sans">
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span className="text-[10px] uppercase tracking-wider text-white/75 font-bold font-tech">ResQ AI</span>
                </div>
                <p className="text-sm text-white/90 leading-relaxed font-normal">{aiResponse}</p>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="font-sans">
            <span className="text-xs uppercase font-bold tracking-wider text-white/40 block mb-4 font-tech">Tap to Simulate Query:</span>
            <div className="flex flex-wrap gap-3">
              {samplePrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handlePromptClick(p)}
                  className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-[#070707] border border-white/[0.05] hover:border-white/30 text-xs font-semibold tracking-wider uppercase text-white/60 hover:text-white transition-all flex items-center gap-2 focus:outline-hidden cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5 text-white/40" /> {p.q}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
