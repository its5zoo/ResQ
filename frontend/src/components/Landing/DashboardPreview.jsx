import { useRef, useEffect, useState } from 'react';
import { ShieldCheck, Zap, Lock, Calendar as CalendarIcon } from 'lucide-react';
import gsap from 'gsap';

export default function DashboardPreview() {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  
  // Demo State for Video-like playback
  const [demoState, setDemoState] = useState('listening'); // 'listening', 'processing', 'speaking'
  const [transcript, setTranscript] = useState('Speak now...');
  const [aiResponse, setAiResponse] = useState("Yes? I'm listening.");
  const [showAction, setShowAction] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const runDemoLoop = async () => {
      while (isMounted) {
        // Step 1: Initial Listening
        setDemoState('listening');
        setTranscript('Speak now...');
        setAiResponse("Yes? I'm listening.");
        setShowAction(false);
        await new Promise(r => setTimeout(r, 2000));
        if (!isMounted) break;
        
        // Step 2: User Speaks
        setTranscript('set my study time table for 4:00 a.m.');
        await new Promise(r => setTimeout(r, 1500));
        if (!isMounted) break;
        
        // Step 3: Processing
        setDemoState('processing');
        setAiResponse("Scheduling...");
        await new Promise(r => setTimeout(r, 1500));
        if (!isMounted) break;
        
        // Step 4: Speaking & Complete
        setDemoState('speaking');
        setAiResponse("I've successfully scheduled your study session for tomorrow morning at 4:00 AM.");
        setShowAction(true);
        await new Promise(r => setTimeout(r, 4500));
      }
    };
    
    runDemoLoop();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(imageRef.current,
        { y: 100, opacity: 0, scale: 0.95, rotateX: 10 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          rotateX: 0,
          duration: 1.5,
          ease: 'power4.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 70%',
          }
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-24 relative z-20 overflow-hidden bg-[#050505] border-y border-white/[0.02]">
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-display font-black text-white">
            Your entire life, <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] to-[#FCEABB]">centralized.</span>
          </h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto font-light">
            One command center for your habits, calendar events, and AI-prioritized tasks.
          </p>
        </div>

        <div className="relative max-w-6xl mx-auto" style={{ perspective: '1000px' }}>
          {/* Outer glow */}
          <div className="absolute inset-0 bg-[#00E5FF]/10 rounded-[2rem] blur-3xl opacity-30 pointer-events-none"></div>
          
          <div ref={imageRef} className="relative rounded-[2rem] border border-white/10 bg-[#0A0A0A] p-2 shadow-2xl backdrop-blur-sm">
            <div className="rounded-2xl overflow-hidden border border-white/[0.05] bg-[#050505]">
              {/* Window Controls Mac Style */}
              <div className="bg-[#0B0B0B] border-b border-white/[0.05] px-4 py-3 flex items-center gap-2 z-20 relative">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                <div className="ml-4 flex-1 text-center">
                  <div className="inline-flex items-center gap-2 bg-white/[0.03] border border-white/[0.05] rounded-lg px-3 py-1">
                    <Lock className="w-3 h-3 text-white/40" />
                    <span className="text-[10px] text-white/40 font-mono">app.resq.ai</span>
                  </div>
                </div>
              </div>
              
              {/* Voice Assistant Preview instead of static image */}
              <div className="relative w-full h-[550px] bg-[#050505] overflow-hidden flex flex-col items-center justify-center">
                
                {/* Dashboard Image Background */}
                <div className="absolute inset-0 z-0">
                  <img src="/screenshots/hero_dashboard_preview.png" alt="Dashboard Background" className="w-full h-full object-cover object-top opacity-60" />
                </div>

                {/* Background Blur Overlay */}
                <div className="absolute inset-0 bg-[#080808]/85 backdrop-blur-2xl z-0"></div>
                
                {/* Center Mic & Waveform */}
                <div className="relative flex items-center justify-center mb-8 z-10">
                  {/* Wave Visualizer Mock */}
                  {demoState !== 'idle' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                      {demoState === 'listening' ? (
                        <>
                          <div className="absolute w-32 h-32 rounded-full border border-[#00E5FF]/40 animate-ping" style={{ animationDuration: '3s' }}></div>
                          <div className="absolute w-40 h-40 rounded-full border border-[#00E5FF]/20 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }}></div>
                          <div className="absolute w-48 h-48 rounded-full bg-[#00E5FF]/5 animate-pulse"></div>
                        </>
                      ) : demoState === 'processing' ? (
                        <div className="absolute w-32 h-32 rounded-full border-t-2 border-b-2 border-[#E5B842] animate-spin" style={{ animationDuration: '1.5s' }}></div>
                      ) : demoState === 'speaking' ? (
                        <>
                          <div className="absolute w-32 h-32 rounded-full border border-[#00E5FF]/50 animate-pulse" style={{ animationDuration: '1s' }}></div>
                          <div className="absolute w-44 h-44 rounded-full border border-[#00E5FF]/20 animate-pulse" style={{ animationDuration: '2s' }}></div>
                        </>
                      ) : null}
                    </div>
                  )}
                  
                  {/* Mic Box */}
                  <div className={`w-28 h-28 rounded-[2.5rem] bg-[#0c0c0e]/80 backdrop-blur-xl flex items-center justify-center z-10 relative transition-all duration-500 ${demoState === 'listening' ? 'shadow-[0_0_80px_rgba(0,229,255,0.2)] scale-105 border border-[#00E5FF]/40' : demoState === 'processing' ? 'border-t-2 border-[#E5B842] shadow-[0_0_40px_rgba(229,184,66,0.15)]' : 'shadow-[0_0_40px_rgba(0,229,255,0.1)] scale-100 border border-[#00E5FF]/20'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={demoState === 'processing' ? '#E5B842' : '#00E5FF'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mic transition-colors duration-300"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  </div>
                </div>

                <h2 className="text-2xl font-display font-black text-white mb-3 tracking-tight z-10 relative">
                  {demoState === 'processing' ? "I'm thinking..." : demoState === 'speaking' ? "I'm speaking" : "I'm listening"}
                </h2>
                <p className="text-base text-white/40 mb-12 max-w-2xl text-center z-10 relative h-6 font-medium">
                  {transcript}
                </p>

                {/* AI Response Box Mock */}
                <div className="max-w-xl w-full mx-4 relative z-10 transition-all duration-500">
                  <div className="bg-[#0c0c0e]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                     <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent"></div>
                     <div className="flex items-start gap-4 relative z-10">
                       <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                         <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                       </div>
                       <p className="text-white/90 text-lg leading-relaxed font-sans font-medium tracking-wide pt-1.5">{aiResponse}</p>
                     </div>
                     
                     {showAction && (
                       <div className="flex items-center gap-2 mt-6 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[11px] font-semibold w-max animate-fade-in-up">
                         <CalendarIcon className="w-3.5 h-3.5 text-[#00E5FF]" />
                         <span className="text-white/40">Action completed:</span>
                         <span className="text-white font-tech uppercase tracking-wider">CALENDAR SYNCED</span>
                       </div>
                     )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof / Trust Mini-Strip */}
        <div className="mt-24 pt-12 border-t border-white/[0.05] grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="text-center space-y-2">
            <div className="text-3xl font-black text-white font-display">100k+</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Tasks Completed</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-black text-white font-display">99.9%</div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Uptime</div>
          </div>
          <div className="text-center space-y-2 flex flex-col items-center">
            <div className="mb-2">
              <ShieldCheck className="w-8 h-8 text-[#E5B842]/70" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Enterprise Security</div>
          </div>
          <div className="text-center space-y-2 flex flex-col items-center">
            <div className="mb-2">
              <Zap className="w-8 h-8 text-[#E5B842]/70" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Lightning Fast</div>
          </div>
        </div>
      </div>
    </section>
  );
}
