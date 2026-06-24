import { useState, useEffect } from 'react';
import { Clock, Plus, Plane, AlertTriangle } from 'lucide-react';

export default function CalendarAnimation() {
  const [phase, setPhase] = useState('idle'); // idle, clickBook1, typingFlight, savedFlight, clickBook2, typingDeadline, savedDeadline
  const [typedTitle, setTypedTitle] = useState('');
  
  const today = new Date();
  const day3 = new Date(today);
  day3.setDate(today.getDate() + 3);

  const formatDate = (date) => {
     return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    let isMounted = true;
    const runAnimation = async () => {
      while (isMounted) {
        setPhase('idle');
        setTypedTitle('');
        await new Promise(r => setTimeout(r, 1000));
        if (!isMounted) break;

        setPhase('clickBook1');
        await new Promise(r => setTimeout(r, 600));
        if (!isMounted) break;

        setPhase('typingFlight');
        const flightText = "Flight to NYC";
        for(let i=0; i<=flightText.length; i++){
           setTypedTitle(flightText.substring(0, i));
           await new Promise(r => setTimeout(r, 50));
           if (!isMounted) break;
        }
        await new Promise(r => setTimeout(r, 800));
        if (!isMounted) break;

        setPhase('savedFlight');
        setTypedTitle('');
        await new Promise(r => setTimeout(r, 1500));
        if (!isMounted) break;

        setPhase('clickBook2');
        await new Promise(r => setTimeout(r, 600));
        if (!isMounted) break;

        setPhase('typingDeadline');
        const deadlineText = "Assignment submission";
        for(let i=0; i<=deadlineText.length; i++){
           setTypedTitle(deadlineText.substring(0, i));
           await new Promise(r => setTimeout(r, 50));
           if (!isMounted) break;
        }
        await new Promise(r => setTimeout(r, 1000));
        if (!isMounted) break;

        setPhase('savedDeadline');
        await new Promise(r => setTimeout(r, 4500));
      }
    };
    runAnimation();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full bg-[#050505] text-white font-sans relative h-[450px] flex overflow-hidden select-none">
       {/* Main Calendar Grid */}
       <div className="flex-1 p-4 md:p-6 flex flex-col border-r border-white/5 relative z-0">
          <div className="flex justify-between items-center mb-4 md:mb-6">
             <span className="font-display font-bold text-lg md:text-xl tracking-tight">Chronos Auto-Pilot</span>
          </div>
          
          <div className="flex-1 flex gap-2 md:gap-4">
             {/* Day 1 (Today) */}
             <div className="flex-1 flex flex-col gap-2">
                <div className="text-center text-[10px] font-bold text-white/50 uppercase tracking-widest">{formatDate(today)}</div>
                <div className="flex-1 border border-white/5 rounded-xl bg-white/[0.02] p-1.5 flex flex-col gap-2 relative">
                   {/* Flight Block */}
                   {(phase === 'savedFlight' || phase === 'clickBook2' || phase === 'typingDeadline' || phase === 'savedDeadline') && (
                     <div className="animate-fade-in-down w-full bg-blue-500/10 border border-blue-500/30 rounded-lg p-2.5 flex flex-col gap-1.5 shadow-[0_0_20px_rgba(59,130,246,0.15)] absolute top-2 left-1 right-1">
                        <div className="flex items-center gap-1.5 opacity-70">
                           <Clock className="w-3.5 h-3.5 text-blue-400" />
                           <span className="text-[10px] font-bold text-blue-400">10:00 AM</span>
                        </div>
                        <span className="text-xs font-bold leading-tight text-white">Flight to NYC</span>
                        <div className="flex items-center gap-1.5 mt-1">
                           <Plane className="w-3 h-3 text-blue-400" />
                           <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Synced Event</span>
                        </div>
                     </div>
                   )}
                </div>
             </div>
             
             {/* Day 2 */}
             <div className="hidden sm:flex flex-1 flex-col gap-2 opacity-50">
                <div className="text-center text-[10px] font-bold text-white/50 uppercase tracking-widest">Tomorrow</div>
                <div className="flex-1 border border-white/5 rounded-xl bg-white/[0.02]"></div>
             </div>

             {/* Day 3 */}
             <div className="flex-1 flex flex-col gap-2">
                <div className="text-center text-[10px] font-bold text-white/50 uppercase tracking-widest">{formatDate(day3)}</div>
                <div className="flex-1 border border-white/5 rounded-xl bg-white/[0.02] p-1.5 flex flex-col gap-2 relative">
                   {/* Deadline Block */}
                   {phase === 'savedDeadline' && (
                     <div className="animate-scale-up w-full bg-red-500/10 border border-red-500/30 rounded-lg p-2.5 flex flex-col gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.15)] absolute top-24 left-1 right-1">
                        <div className="flex items-center gap-1.5 opacity-70">
                           <Clock className="w-3.5 h-3.5 text-red-400" />
                           <span className="text-[10px] font-bold text-red-400">11:59 PM</span>
                        </div>
                        <span className="text-xs font-bold leading-tight text-white">Assignment submission</span>
                        <div className="flex items-center gap-1.5 mt-1">
                           <AlertTriangle className="w-3 h-3 text-red-400" />
                           <span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Deadline</span>
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>
       </div>

       {/* Right Sidebar (Booking Panel) */}
       <div className="w-[160px] md:w-[220px] p-4 flex flex-col relative bg-[#090909] z-10 border-l border-white/5">
          <button className={`w-full py-3 rounded-xl border text-[10px] md:text-xs font-bold tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2 mb-6 ${
             (phase === 'clickBook1' || phase === 'clickBook2') ? 'bg-[#E5B842] text-black border-[#E5B842] scale-95 shadow-[0_0_20px_rgba(229,184,66,0.4)]' : 'bg-[#E5B842]/10 border-[#E5B842]/30 text-[#E5B842]'
          }`}>
             <Plus className="w-4 h-4" /> Book Slot
          </button>

          {/* Booking Form Overlay (slides in) */}
          <div className={`absolute top-[75px] left-3 right-3 md:left-4 md:right-4 bg-[#0A0A0A] border border-white/10 rounded-xl p-3 md:p-4 shadow-2xl transition-all duration-500 transform z-20 ${
             (phase === 'typingFlight' || phase === 'typingDeadline') ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95 pointer-events-none'
          }`}>
             <div className="text-xs font-bold text-white mb-4">Add to Calendar</div>
             
             <div className="space-y-3">
                <div className="bg-[#050505] border border-white/10 rounded-lg p-3 text-xs shadow-inner">
                   <span className={typedTitle ? 'text-white' : 'text-white/30'}>{typedTitle || 'Description...'}</span>
                   {(phase === 'typingFlight' || phase === 'typingDeadline') && <span className="animate-pulse text-[#E5B842]">|</span>}
                </div>
                
                <div className="flex gap-2">
                   <div className={`flex-1 text-center py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-colors ${phase === 'typingFlight' ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' : 'bg-white/5 border-white/10 text-white/50'}`}>
                      Event
                   </div>
                   <div className={`flex-1 text-center py-2 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-colors ${phase === 'typingDeadline' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-white/5 border-white/10 text-white/50'}`}>
                      Deadline
                   </div>
                </div>

                <div className="bg-[#050505] border border-white/10 rounded-lg p-2.5 flex justify-between items-center shadow-inner">
                   <span className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Date</span>
                   <span className="text-[10px] font-bold text-[#E5B842]">{phase === 'typingDeadline' ? formatDate(day3) : formatDate(today)}</span>
                </div>

                <button className="w-full bg-white text-black font-black text-[10px] uppercase tracking-widest py-2.5 rounded-lg mt-2 hover:bg-white/90 transition-colors">
                   Save Slot
                </button>
             </div>
          </div>

          {/* Dummy Sidebar Widgets */}
          <div className={`space-y-3 transition-all duration-500 transform ${(phase === 'typingFlight' || phase === 'typingDeadline') ? 'opacity-10 translate-y-2' : 'opacity-100 translate-y-0'}`}>
             <div className="border border-white/5 bg-white/[0.02] rounded-xl p-3.5 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                   <Clock className="w-4 h-4 text-[#E5B842]" />
                   <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Added Events</span>
                </div>
             </div>
             <div className="border border-white/5 bg-white/[0.02] rounded-xl p-3.5 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                   <AlertTriangle className="w-4 h-4 text-red-400" />
                   <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Deadlines</span>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
}
