import { useState, useEffect } from 'react';
import { Mic, Brain, X, CheckCircle2, Calendar, Target } from 'lucide-react';

export default function VoiceSection() {
  const [micState, setMicState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [actionMeta, setActionMeta] = useState(null);

  useEffect(() => {
    let step = 0;
    let isActive = true;
    
    const conversationLoop = [
      { 
        q: "Add walking to my calendar for 5 PM.", 
        a: "I've scheduled Walking in your calendar for 5:00 PM today.",
        meta: { icon: Calendar, label: "Event Created", color: "text-[#E5B842]" }
      },
      { 
        q: "Remind me to take a rest.", 
        a: "I've added 'Take a rest' to your pending tasks.",
        meta: { icon: CheckCircle2, label: "Task Added", color: "text-emerald-400" }
      },
      { 
        q: "Set my goal to learn React Native.", 
        a: "Got it! Your new active goal is set to 'Learn React Native'.",
        meta: { icon: Target, label: "Goal Updated", color: "text-[#00F0FF]" }
      }
    ];

    const typeString = async (text, setter) => {
      let current = '';
      for (let i = 0; i < text.length; i++) {
        if (!isActive) return;
        current += text[i];
        setter(current);
        await new Promise(r => setTimeout(r, 40));
      }
    };

    const runAnimation = async () => {
      while (isActive) {
        const currentPrompt = conversationLoop[step % conversationLoop.length];

        // Idle state before starting
        setMicState('idle');
        setTranscript('');
        setAiResponse('');
        setActionMeta(null);
        await new Promise(r => setTimeout(r, 1500));
        if (!isActive) break;

        // Listening state
        setMicState('listening');
        await typeString(currentPrompt.q, setTranscript);
        await new Promise(r => setTimeout(r, 800));
        if (!isActive) break;

        // Processing state
        setMicState('processing');
        await new Promise(r => setTimeout(r, 1500));
        if (!isActive) break;

        // Speaking state
        setMicState('speaking');
        setAiResponse(currentPrompt.a);
        setActionMeta(currentPrompt.meta);
        
        await new Promise(r => setTimeout(r, 5000));
        step++;
      }
    };

    runAnimation();

    return () => { isActive = false; };
  }, []);

  return (
    <section id="voice" className="voice-section py-20 lg:py-44 relative overflow-hidden border-t border-white/[0.03]">
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] voice-section-glow rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* Left Column: Voice Assistant Auto-Animation */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center relative font-sans pointer-events-none perspective-1000">
          
          {/* Replica of the exact GlobalVoiceAssistant UI */}
          <div className="w-full max-w-[550px] bg-[#070709] border border-white/10 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,255,255,0.02)] overflow-hidden relative transform scale-100 transition-all duration-700 ease-out z-10">
            
            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[1.5px] transition-all duration-700 ${micState === 'listening' ? 'bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent shadow-[0_0_20px_rgba(0,240,255,0.6)]' : micState === 'processing' ? 'bg-gradient-to-r from-transparent via-[#E5B842] to-transparent shadow-[0_0_20px_rgba(229,184,66,0.6)]' : 'bg-gradient-to-r from-transparent via-[#E5B842]/60 to-transparent'}`}></div>

            <div className="px-6 pt-5 pb-6">
              
              {/* Header row */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <span className="font-display font-black text-lg tracking-tighter flex items-center">
                    <span className="text-white/80">Res</span>
                    <span className="text-[#E5B842]">Q</span>
                  </span>
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-tech font-bold uppercase tracking-widest border transition-all duration-500 ${
                    micState === 'listening' ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF]' 
                    : micState === 'processing' ? 'bg-[#E5B842]/10 border-[#E5B842]/30 text-[#E5B842]'
                    : micState === 'speaking' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-white/50'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${micState === 'listening' ? 'bg-[#00F0FF] animate-pulse' : micState === 'processing' ? 'bg-[#E5B842] animate-spin' : micState === 'speaking' ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`}></span>
                    {micState === 'listening' ? 'Listening' : micState === 'processing' ? 'Thinking' : micState === 'speaking' ? 'Speaking' : 'Ready'}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white/50 flex items-center justify-center">
                  <X className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Central mic visualizer */}
              <div className="flex flex-col items-center mb-8">
                <div className="relative flex items-center justify-center mb-5">
                  {micState === 'listening' && (
                    <>
                      <div className="absolute w-28 h-28 rounded-full border border-[#00F0FF]/15 animate-ping" style={{ animationDuration: '2.5s' }}></div>
                      <div className="absolute w-36 h-36 rounded-full border border-[#00F0FF]/08 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.8s' }}></div>
                      <div className="absolute w-20 h-20 rounded-full bg-[#00F0FF]/5 animate-pulse" style={{ animationDuration: '1.5s' }}></div>
                    </>
                  )}
                  {micState === 'processing' && (
                    <>
                      <div className="absolute w-24 h-24 rounded-full border-2 border-dashed border-[#E5B842]/30 animate-spin" style={{ animationDuration: '3s' }}></div>
                      <div className="absolute w-20 h-20 rounded-full bg-[#E5B842]/5 animate-pulse"></div>
                    </>
                  )}
                  <div className={`relative w-20 h-20 rounded-[1.75rem] flex items-center justify-center z-10 transition-all duration-500 ${micState === 'listening' ? 'bg-[#00F0FF]/10 border-2 border-[#00F0FF]/40 shadow-[0_0_50px_rgba(0,240,255,0.2)]' : micState === 'processing' ? 'bg-[#E5B842]/10 border-2 border-[#E5B842]/40 shadow-[0_0_50px_rgba(229,184,66,0.2)]' : micState === 'speaking' ? 'bg-emerald-500/10 border-2 border-emerald-500/40 shadow-[0_0_50px_rgba(52,199,89,0.2)]' : 'bg-white/5 border-2 border-white/10'}`}>
                    <Mic className={`w-8 h-8 transition-colors duration-300 ${micState === 'listening' ? 'text-[#00F0FF]' : micState === 'processing' ? 'text-[#E5B842]' : micState === 'speaking' ? 'text-emerald-400' : 'text-white/60'}`} />
                  </div>
                </div>

                {/* Animated waveform bars */}
                <div className={`flex items-center gap-[3px] h-8 mb-4 transition-opacity duration-300 ${micState === 'listening' ? 'opacity-100' : 'opacity-0'}`}>
                  {[0.4, 0.7, 1, 0.6, 0.9, 0.5, 0.8, 1, 0.7, 0.4, 0.6, 0.9, 0.5].map((h, i) => (
                    <div key={i} className="w-[3px] rounded-full bg-[#00F0FF]" style={{ height: `${h * 100}%`, animation: `voiceBar 0.8s ease-in-out infinite alternate`, animationDelay: `${i * 0.07}s`, opacity: 0.5 + h * 0.5 }}></div>
                  ))}
                </div>

                <h2 className="text-xl font-display font-black tracking-tight text-white mb-1">
                  {micState === 'speaking' ? 'ResQ is responding' : micState === 'processing' ? 'Processing your request...' : "I'm listening..."}
                </h2>
                <p className="text-sm text-white/40 font-tech uppercase tracking-widest min-h-[20px]">
                  {transcript ? `"${transcript}"` : micState === 'listening' ? 'Speak your command' : micState === 'processing' ? 'Analyzing intent...' : 'Say anything'}
                </p>
              </div>

              {/* AI Response Box */}
              <div className={`transition-all duration-500 transform ${aiResponse ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}>
                <div className="bg-[#111] border border-white/5 rounded-2xl p-4 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00F0FF]/30 to-transparent"></div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#00F0FF]/10 border border-[#00F0FF]/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Brain className="w-3.5 h-3.5 text-[#00F0FF]" />
                    </div>
                    <p className="text-white/85 text-sm leading-relaxed font-sans font-medium tracking-wide flex-1">{aiResponse || "..."}</p>
                  </div>
                  {actionMeta && (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/5">
                      <actionMeta.icon className={`w-3.5 h-3.5 ${actionMeta.color}`} />
                      <span className="text-white/40 text-[10px] font-tech uppercase tracking-wider">Action:</span>
                      <span className="text-white/70 text-[10px] font-tech font-bold uppercase tracking-wider">{actionMeta.label}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom hint */}
              <div className="flex items-center justify-center gap-4 mt-5 text-[10px] font-tech text-white/20 uppercase tracking-widest">
                <span>Alt + V to toggle</span>
                <span>·</span>
                <span>Tap outside to close</span>
              </div>
            </div>
          </div>
          
          {/* Subtle glow underneath */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#00F0FF]/5 blur-[80px] -z-10 rounded-full"></div>
        </div>

        {/* Right Column: Title and Context */}
        <div className="lg:col-span-5 flex flex-col justify-center pl-0 lg:pl-6 relative z-20">
          <span className="text-sm font-tech font-bold tracking-[0.3em] uppercase text-[#E5B842] block mb-5 font-sans">
            OMNIPRESENT AUDIO SHIELD
          </span>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black mb-8 leading-tight tracking-tight text-white">
            Command your <br />
            workflow with <br />
            <span className="text-[#00F0FF]">natural speech.</span>
          </h2>
          <p className="text-white/60 text-lg font-light leading-relaxed mb-8 max-w-md font-sans">
            Experience true hands-free control. Our AI understands complex requests, from scheduling events and setting goals to prioritizing your daily tasks on the fly.
          </p>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm font-tech text-white/70">
              <CheckCircle2 className="w-4 h-4 text-[#E5B842]" /> <span>Schedule Calendar Blocks</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-tech text-white/70">
              <CheckCircle2 className="w-4 h-4 text-[#E5B842]" /> <span>Add Tasks & Habits</span>
            </div>
            <div className="flex items-center gap-3 text-sm font-tech text-white/70">
              <CheckCircle2 className="w-4 h-4 text-[#E5B842]" /> <span>Define Core Goals</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
