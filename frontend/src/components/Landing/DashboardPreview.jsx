import { useRef, useEffect, useState } from 'react';
import { ShieldCheck, Zap, Lock, Calendar as CalendarIcon, Mic, CheckCircle2 } from 'lucide-react';
import gsap from 'gsap';

export default function DashboardPreview() {
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  
  // Demo State for Video-like playback
  const [demoState, setDemoState] = useState('idle'); // 'idle', 'listening', 'processing', 'speaking'
  const [transcript, setTranscript] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [showAction, setShowAction] = useState(false);
  const [actionText, setActionText] = useState('');
  const [activePage, setActivePage] = useState('home');
  const [mockItem, setMockItem] = useState(null);

  useEffect(() => {
    let isMounted = true;
    
    const runDemoLoop = async () => {
      const scenarios = [
        {
          transcript: "Hey ResQ, set my study timetable for 4:00 a.m.",
          response: "I've successfully scheduled your study session for tomorrow morning at 4:00 AM.",
          action: "CALENDAR SYNCED",
          page: "calendar",
          item: "Study Session - 4:00 AM"
        },
        {
          transcript: "Hey ResQ, please set my running time to 5 a.m.",
          response: "Got it. I've added a daily habit for running at 5:00 AM. Keep it up!",
          action: "HABIT LOGGED",
          page: "habits",
          item: "Running (5:00 AM)"
        },
        {
          transcript: "Hey ResQ, remind me to review the project PR at 3 PM.",
          response: "No problem. I've added a high-priority task to your list for today at 3:00 PM.",
          action: "TASK CREATED",
          page: "tasks",
          item: "Review Project PR - 3:00 PM"
        }
      ];

      let scenarioIndex = 0;

      while (isMounted) {
        const scenario = scenarios[scenarioIndex];

        // Step 0: Idle state (How to activate)
        setDemoState('idle');
        setTranscript('');
        setAiResponse('');
        setShowAction(false);
        setActivePage('home');
        setMockItem(null);
        await new Promise(r => setTimeout(r, 2500));
        if (!isMounted) break;

        // Step 1: Initial Listening
        setDemoState('listening');
        setTranscript('Speak now...');
        setAiResponse("Yes? I'm listening.");
        await new Promise(r => setTimeout(r, 1500));
        if (!isMounted) break;
        
        // Step 2: User Speaks
        setTranscript(scenario.transcript);
        await new Promise(r => setTimeout(r, 2000));
        if (!isMounted) break;
        
        // Step 3: Processing
        setDemoState('processing');
        setAiResponse("Thinking...");
        await new Promise(r => setTimeout(r, 1500));
        if (!isMounted) break;
        
        // Step 4: Speaking & Complete (Navigates to page)
        setDemoState('speaking');
        setAiResponse(scenario.response);
        setActionText(scenario.action);
        setShowAction(true);
        setActivePage(scenario.page);
        setMockItem(scenario.item);
        await new Promise(r => setTimeout(r, 3500));
        if (!isMounted) break;

        // Step 5: Anything else?
        setAiResponse("Anything else?");
        setShowAction(false);
        await new Promise(r => setTimeout(r, 2500));
        
        scenarioIndex = (scenarioIndex + 1) % scenarios.length;
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
        <div className="text-center mb-16 space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#00E5FF]/20 bg-[#00E5FF]/5 text-[#00E5FF] text-sm font-bold uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(0,229,255,0.1)]">
            <Zap className="w-3.5 h-3.5" /> Conversational OS
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-display font-black text-white leading-[1.1] tracking-tight">
            Speak your workflow <br/> into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#00B4FF] to-[#0070FF]">existence.</span>
          </h2>
          <p className="text-white/50 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            The world's most advanced conversational productivity shell. Just talk, and let ResQ instantly orchestrate your calendar, habits, and tasks.
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
                    <Mic className="w-3.5 h-3.5 text-[#E5B842]" />
                    <span className="text-sm text-white/70 font-sans tracking-wide">
                      Say <strong className="text-white">"Hey ResQ"</strong> or <strong className="text-white">"ResQ"</strong> to activate
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Voice Assistant Preview instead of static image */}
              <div className="relative w-full h-[550px] bg-[#050505] overflow-hidden flex flex-col items-center justify-center">
                
                {/* Dashboard Image Background */}
                <div className="absolute inset-0 z-0">
                  <img src="/dashboard_preview.png" alt="Dashboard Background" className={`w-full h-full object-cover object-top transition-opacity duration-1000 ${activePage === 'home' ? 'opacity-100' : 'opacity-5'}`} />
                  
                  {/* Mock Page Overlays */}
                  {activePage === 'calendar' && (
                    <div className="absolute inset-0 bg-[#050505]/95 p-8 flex flex-col gap-6 animate-fade-in z-10">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <CalendarIcon className="w-6 h-6 text-[#E5B842]" />
                        <span className="text-2xl font-display font-black text-white tracking-tight">Calendar Planner</span>
                      </div>
                      <div className="flex-1 bg-[#090909] border border-white/5 rounded-2xl p-6 relative flex flex-col items-center justify-center">
                         <div className="w-full max-w-lg bg-[#E5B842]/10 border border-[#E5B842]/30 rounded-2xl p-5 animate-scale-up shadow-[0_0_40px_rgba(229,184,66,0.15)] flex flex-col items-center text-center">
                            <span className="text-sm font-bold tracking-widest text-[#E5B842] uppercase mb-2">AI Scheduled Event</span>
                            <span className="text-2xl font-black text-white">{mockItem}</span>
                         </div>
                      </div>
                    </div>
                  )}

                  {activePage === 'habits' && (
                    <div className="absolute inset-0 bg-[#050505]/95 p-8 flex flex-col gap-6 animate-fade-in z-10">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <Zap className="w-6 h-6 text-purple-400" />
                        <span className="text-2xl font-display font-black text-white tracking-tight">Daily Habits</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="h-28 rounded-2xl border border-white/5 bg-[#090909] opacity-50"></div>
                        <div className="h-28 rounded-2xl border border-purple-500/40 bg-purple-500/10 p-5 animate-scale-up shadow-[0_0_40px_rgba(168,85,247,0.15)] flex flex-col justify-center">
                           <span className="text-xs font-bold tracking-widest text-purple-400 uppercase mb-1 flex items-center gap-1">🔥 Active Habit</span>
                           <span className="text-xl font-black text-white">{mockItem}</span>
                        </div>
                        <div className="h-28 rounded-2xl border border-white/5 bg-[#090909] opacity-50"></div>
                      </div>
                    </div>
                  )}

                  {activePage === 'tasks' && (
                    <div className="absolute inset-0 bg-[#050505]/95 p-8 flex flex-col gap-6 animate-fade-in z-10">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <CheckCircle2 className="w-6 h-6 text-[#4A9EFF]" />
                        <span className="text-2xl font-display font-black text-white tracking-tight">Task Queue</span>
                      </div>
                      <div className="flex flex-col gap-3">
                        <div className="h-16 rounded-2xl border border-white/5 bg-[#090909] opacity-50"></div>
                        <div className="h-20 rounded-2xl border border-[#4A9EFF]/40 bg-[#4A9EFF]/10 p-5 animate-scale-up shadow-[0_0_40px_rgba(74,158,255,0.15)] flex items-center">
                           <div className="w-5 h-5 rounded-md border-2 border-[#4A9EFF] mr-4"></div>
                           <span className="text-xl font-bold text-white">{mockItem}</span>
                           <span className="ml-auto text-xs font-bold tracking-widest px-3 py-1 rounded-full bg-[#4A9EFF]/20 text-[#4A9EFF] uppercase">High Priority</span>
                        </div>
                        <div className="h-16 rounded-2xl border border-white/5 bg-[#090909] opacity-50"></div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Background Blur Overlay (Glass Effect) */}
                <div className={`absolute inset-0 transition-all duration-1000 z-0 ${demoState === 'idle' ? 'bg-transparent backdrop-blur-none' : 'bg-black/60 backdrop-blur-xl'}`}></div>
                
                {/* Idle Activation Pill */}
                <div className={`absolute inset-0 flex items-center justify-center z-10 transition-all duration-1000 transform ${demoState === 'idle' ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                   <div className="bg-[#0c0c0e]/95 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-[2rem] flex flex-col items-center gap-3 shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-pulse">
                      <div className="w-12 h-12 rounded-full bg-[#00E5FF]/10 flex items-center justify-center mb-1">
                        <Mic className="w-6 h-6 text-[#00E5FF]" />
                      </div>
                      <span className="text-white/80 font-medium text-lg tracking-wide text-center">
                        Say <span className="text-white font-black mx-1">"Hey ResQ"</span> or <span className="text-white font-black mx-1">"ResQ"</span>
                      </span>
                      <span className="text-[#00E5FF]/70 text-sm font-semibold tracking-widest uppercase">To Activate AI Assistant</span>
                   </div>
                </div>

                {/* Active States Wrapper */}
                <div className={`relative flex flex-col items-center justify-center w-full z-10 transition-all duration-700 transform ${demoState !== 'idle' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
                  {/* Center Mic & Waveform */}
                  <div className="relative flex items-center justify-center mb-8">
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
                      <Mic className={`w-10 h-10 transition-colors duration-300 ${demoState === 'processing' ? 'text-[#E5B842]' : 'text-[#00E5FF]'}`} />
                    </div>
                  </div>

                  <h2 className="text-2xl font-display font-black text-white mb-3 tracking-tight relative">
                    {demoState === 'processing' ? "I'm thinking..." : demoState === 'speaking' ? "I'm speaking" : "I'm listening"}
                  </h2>
                  <p className="text-xl text-white/80 mb-12 max-w-2xl text-center relative h-6 font-semibold tracking-wide">
                    {transcript}
                  </p>

                  {/* AI Response Box Mock */}
                  <div className="max-w-xl w-full mx-4 relative transition-all duration-500">
                    <div className="bg-[#0c0c0e]/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.4)] relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#00E5FF]/50 to-transparent"></div>
                       <div className="flex items-start gap-4 relative z-10">
                         <div className="w-10 h-10 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/20 flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(0,229,255,0.15)]">
                           <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00E5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                         </div>
                         <p className="text-white/90 text-lg leading-relaxed font-sans font-medium tracking-wide pt-1.5">{aiResponse}</p>
                       </div>
                       
                       {showAction && (
                         <div className="flex items-center gap-2 mt-6 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold w-max animate-fade-in-up">
                           <CalendarIcon className="w-3.5 h-3.5 text-[#00E5FF]" />
                           <span className="text-white/70">Action completed:</span>
                           <span className="text-white font-tech uppercase tracking-wider">{actionText}</span>
                         </div>
                       )}
                    </div>
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
            <div className="text-sm uppercase tracking-widest text-white/70 font-bold">Tasks Completed</div>
          </div>
          <div className="text-center space-y-2">
            <div className="text-3xl font-black text-white font-display">99.9%</div>
            <div className="text-sm uppercase tracking-widest text-white/70 font-bold">Uptime</div>
          </div>
          <div className="text-center space-y-2 flex flex-col items-center">
            <div className="mb-2">
              <ShieldCheck className="w-8 h-8 text-[#E5B842]/70" />
            </div>
            <div className="text-sm uppercase tracking-widest text-white/70 font-bold">Enterprise Security</div>
          </div>
          <div className="text-center space-y-2 flex flex-col items-center">
            <div className="mb-2">
              <Zap className="w-8 h-8 text-[#E5B842]/70" />
            </div>
            <div className="text-sm uppercase tracking-widest text-white/70 font-bold">Lightning Fast</div>
          </div>
        </div>
      </div>
    </section>
  );
}
