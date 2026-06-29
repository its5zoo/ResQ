import { MessageSquare, CheckCircle2, Mic, Mail, Plus } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

function PostMeetingAnimation() {
  const [phase, setPhase] = useState('idle'); // idle | recording | processing | results
  const [transcript, setTranscript] = useState('');
  const [tasks, setTasks] = useState([]);
  const [showEmail, setShowEmail] = useState(false);

  const fullTranscript = "Action items: John will finalize the API spec by Friday, I need to send the budget proposal to Sarah, and we should schedule a follow-up call next Tuesday.";

  const extractedTasks = [
    { title: "Finalize API specification", urgency: 8, due: '3 days', linked: 'Ship v2.0', risk: 6 },
    { title: "Send budget proposal to Sarah", urgency: 9, due: 'Today', linked: null, risk: 7 },
    { title: "Schedule follow-up call", urgency: 5, due: '1 week', linked: null, risk: 3 },
  ];

  useEffect(() => {
    let active = true;
    const run = async () => {
      while (active) {
        // idle
        setPhase('idle');
        setTranscript('');
        setTasks([]);
        setShowEmail(false);
        await delay(2000);
        if (!active) break;

        // recording
        setPhase('recording');
        let t = '';
        for (const char of fullTranscript) {
          if (!active) return;
          t += char;
          setTranscript(t);
          await delay(30);
        }
        await delay(800);
        if (!active) break;

        // processing
        setPhase('processing');
        await delay(2000);
        if (!active) break;

        // results — tasks appear one by one
        setPhase('results');
        for (let i = 0; i < extractedTasks.length; i++) {
          if (!active) return;
          await delay(600);
          setTasks(prev => [...prev, extractedTasks[i]]);
        }
        await delay(1000);
        setShowEmail(true);
        await delay(5000);
      }
    };
    run();
    return () => { active = false; };
  }, []);

  const riskColor = (r) => r >= 7 ? 'text-red-400' : r >= 4 ? 'text-[#E5B842]' : 'text-emerald-400';

  return (
    <div className="w-full bg-[#070709] rounded-2xl font-sans select-none">
      {/* Header — bottom sheet feel */}
      <div className="px-5 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full ${phase === 'recording' ? 'bg-red-500 animate-pulse' : phase === 'processing' ? 'bg-[#E5B842] animate-ping' : phase === 'results' ? 'bg-emerald-400' : 'bg-white/20'}`}></div>
            <span className="text-xs font-tech font-bold text-white/70 uppercase tracking-widest">
              {phase === 'idle' ? 'Weekly Sync — ended 30s ago' : phase === 'recording' ? 'Recording...' : phase === 'processing' ? 'Analyzing...' : 'Action Items Extracted'}
            </span>
          </div>
          <MessageSquare className="w-4 h-4 text-white/30" />
        </div>
        <p className="text-[10px] text-white/30 font-tech">Post-Meeting Intelligence</p>
      </div>

      <div className="p-5">
        {/* Mic button area */}
        {(phase === 'idle' || phase === 'recording') && (
          <div className="flex flex-col items-center py-4">
            <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 ${
              phase === 'recording'
                ? 'bg-red-500/15 border-2 border-red-500/40 shadow-[0_0_30px_rgba(239,68,68,0.2)]'
                : 'bg-white/5 border-2 border-white/10'
            }`}>
              {phase === 'recording' && (
                <>
                  <div className="absolute w-24 h-24 rounded-full border border-red-500/15 animate-ping" style={{ animationDuration: '2s' }}></div>
                  <div className="absolute w-20 h-20 rounded-full border border-red-500/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
                </>
              )}
              <Mic className={`w-7 h-7 z-10 ${phase === 'recording' ? 'text-red-400' : 'text-white/50'}`} />
            </div>
            {transcript ? (
              <p className="text-xs text-white/60 text-center leading-relaxed max-w-xs italic">"{transcript}"</p>
            ) : (
              <p className="text-sm text-white/40 font-tech uppercase tracking-widest">Speak your action items</p>
            )}
          </div>
        )}

        {/* Processing */}
        {phase === 'processing' && (
          <div className="py-6 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#E5B842]/30 animate-spin" style={{ animationDuration: '2s' }}></div>
            <p className="text-sm text-white/50 font-tech uppercase tracking-widest">Extracting action items...</p>
            <p className="text-xs text-white/30 font-tech">Linking to your goals · Scoring risk</p>
          </div>
        )}

        {/* Results */}
        {phase === 'results' && (
          <>
            <p className="text-[10px] font-tech text-white/40 uppercase tracking-widest mb-3">{tasks.length} Tasks Created</p>
            <div className="space-y-2 mb-4">
              {tasks.map((task, i) => (
                <div
                  key={i}
                  className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex items-start gap-3"
                  style={{ animation: 'fadeSlideIn 0.4s ease-out' }}
                >
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Plus className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-tight">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-[9px] font-tech text-white/40">Due: {task.due}</span>
                      {task.linked && (
                        <span className="text-[9px] font-tech text-[#E5B842] bg-[#E5B842]/10 px-1.5 py-0.5 rounded">→ {task.linked}</span>
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-bold font-mono shrink-0 ${riskColor(task.risk)}`}>{task.risk}/10</span>
                </div>
              ))}
            </div>

            {showEmail && (
              <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 flex items-center gap-3">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-blue-400">Follow-up email drafted</p>
                  <p className="text-[10px] text-white/40">Re: Weekly Sync action items</p>
                </div>
                <button className="text-[9px] font-tech font-bold uppercase tracking-widest text-blue-400 border border-blue-500/20 px-2 py-1 rounded-lg cursor-pointer hover:bg-blue-500/10 transition-colors">
                  Send
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function PostMeetingSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.postmeet-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });

      gsap.from('.postmeet-img', {
        scale: 0.95,
        opacity: 0,
        y: 30,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%',
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-16 lg:py-32 relative z-10 overflow-hidden bg-[#080808] border-b border-white/[0.02]">
      <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-[#E5B842]/[0.04] rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 postmeet-text">
              <MessageSquare className="w-4 h-4 text-[#E5B842]" />
              <span className="text-sm font-bold uppercase tracking-widest text-[#E5B842]">Post-Meeting Intelligence</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] postmeet-text">
              Meeting's over —<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] to-[#FCEABB]">
                ResQ handles the rest.
              </span>
            </h2>

            <p className="text-lg text-white/50 font-light leading-relaxed postmeet-text max-w-xl">
              30 seconds after every calendar event ends, a voice capture sheet slides up. Speak your action items. ResQ <strong className="text-white/80">creates tasks, links them to goals, schedules them, scores their risk</strong> — and drafts the follow-up email. Hands-free.
            </p>

            <div className="space-y-6 pt-4 postmeet-text">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <Mic className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Voice-First Capture</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    Speak naturally after your meeting. Gemini extracts every action item — even ones you phrased casually.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-[#E5B842]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Full Auto-Pipeline</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    Each task gets: urgency scoring, goal linking, calendar scheduling, and risk analysis — all within seconds of capture.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0 mt-1">
                  <Mail className="w-4 h-4 text-[#E5B842]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Follow-Up Email in One Tap</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    Gemini drafts a professional follow-up email summarizing the meeting and action items. Send with a single tap.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Animation */}
          <div className="relative postmeet-img">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E5B842]/20 to-transparent rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-sm p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05] relative bg-[#050505]">
                <PostMeetingAnimation />
              </div>
            </div>

            <div className="absolute -top-6 -right-6 bg-[#0B0B0B] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-bounce-slow" style={{ animationDelay: '0.6s' }}>
              <div className="w-10 h-10 rounded-full bg-[#E5B842]/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-[#E5B842]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#E5B842] uppercase tracking-widest mb-0.5">3 Tasks Created</p>
                <p className="text-sm font-semibold text-white/80">Auto-scheduled</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}
