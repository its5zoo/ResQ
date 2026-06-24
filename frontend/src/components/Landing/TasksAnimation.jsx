import { useState, useEffect } from 'react';
import { Calendar, Trash2, CheckCircle2, Circle } from 'lucide-react';

export default function TasksAnimation() {
  const [phase, setPhase] = useState('idle'); // idle, typing, adding, added, completing, rearranging
  const [typedText, setTypedText] = useState('');
  const targetText = "Assignment work";

  useEffect(() => {
    let isMounted = true;
    
    const runAnimation = async () => {
      while (isMounted) {
        // Reset
        setPhase('idle');
        setTypedText('');
        await new Promise(r => setTimeout(r, 1000));
        if (!isMounted) break;

        // Typing
        setPhase('typing');
        for (let i = 0; i <= targetText.length; i++) {
          setTypedText(targetText.substring(0, i));
          await new Promise(r => setTimeout(r, 100)); // typing speed
          if (!isMounted) break;
        }
        await new Promise(r => setTimeout(r, 500));
        if (!isMounted) break;

        // Adding
        setPhase('adding');
        await new Promise(r => setTimeout(r, 600)); // button press delay
        if (!isMounted) break;

        // Added
        setPhase('added');
        await new Promise(r => setTimeout(r, 1500)); // show result for a while
        if (!isMounted) break;

        // Completing
        setPhase('completing');
        await new Promise(r => setTimeout(r, 800)); // simulate click delay
        if (!isMounted) break;

        // Rearranging / Completed
        setPhase('rearranging');
        await new Promise(r => setTimeout(r, 2500)); // hold state before reset
      }
    };
    
    runAnimation();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full bg-[#050505] text-white p-6 font-sans flex flex-col gap-6 select-none relative overflow-hidden">
      
      {/* Quick Add Node section */}
      <div className="space-y-3 relative z-10">
        <span className="text-[10px] font-bold text-[#E5B842] uppercase tracking-[0.2em]">QUICK ADD PRIORITY NODE</span>
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Input field */}
          <div className="flex-1 bg-[#090909] border border-white/10 rounded-xl px-4 py-3 flex items-center shadow-inner">
             <span className={`text-sm ${typedText ? 'text-white' : 'text-white/30'}`}>
                {typedText || 'Enter task description...'}
                {phase === 'typing' && <span className="animate-pulse">|</span>}
             </span>
          </div>
          
          <div className="flex gap-3">
             <div className="bg-[#090909] border border-white/10 rounded-xl px-3 py-3 flex items-center justify-between min-w-[120px]">
                <span className="text-sm text-white/80">Urgency: 100</span>
                <span className="text-[10px] text-white/50 ml-2">▼</span>
             </div>
             
             <div className="bg-[#090909] border border-white/10 rounded-xl px-3 py-3 flex items-center justify-center gap-2 min-w-[120px]">
                <span className="text-sm text-white/80">Jun 24, 2026</span>
                <Calendar className="w-4 h-4 text-white/40" />
             </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-1">
          <div className={`px-5 py-2.5 rounded-xl border font-bold text-xs tracking-widest uppercase transition-all duration-300 flex items-center gap-2 ${phase === 'adding' ? 'bg-[#E5B842] text-black border-[#E5B842] scale-95 shadow-[0_0_15px_rgba(229,184,66,0.5)]' : 'bg-[#E5B842]/10 text-[#E5B842] border-[#E5B842]/30'}`}>
            + DEPLOY TASK
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/5 pb-3 relative z-10">
         <span className="text-xs font-bold text-[#E5B842] uppercase tracking-wider border-b-2 border-[#E5B842] pb-3 -mb-[14px]">ALL</span>
         <span className="text-xs font-bold text-white/40 uppercase tracking-wider">PENDING</span>
         <span className="text-xs font-bold text-white/40 uppercase tracking-wider">COMPLETED</span>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-3 relative z-10">
        
        {/* Animated newly added task */}
        {(phase === 'added' || phase === 'completing' || phase === 'rearranging') && (
          <div className="animate-fade-in-down border border-[#E5B842]/30 bg-[#E5B842]/5 rounded-xl p-4 flex items-center gap-4 shadow-[0_0_20px_rgba(229,184,66,0.1)] relative overflow-hidden transition-all duration-500">
             <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#E5B842]"></div>
             <Circle className="w-5 h-5 text-white/30 shrink-0" />
             <div className="flex-1">
                <p className="text-sm font-bold text-white mb-0.5">{targetText}</p>
                <p className="text-[10px] font-bold text-[#E5B842] uppercase tracking-wider">WORK</p>
             </div>
             <div className="px-3 py-1 bg-[#E5B842]/10 border border-[#E5B842]/20 rounded-md text-[#E5B842] text-[10px] font-black uppercase tracking-widest">
                Priority 100
             </div>
             <Trash2 className="w-4 h-4 text-white/20 ml-2" />
          </div>
        )}

        {/* Existing active task (Bring vegitable) */}
        <div 
          className={`transition-all duration-700 ease-out border rounded-xl p-4 flex items-center gap-4 ${
            phase === 'rearranging' ? 'border-white/5 bg-[#090909] opacity-70 translate-y-20 scale-95' : 'border-white/5 bg-[#090909]'
          }`}
          style={{ zIndex: phase === 'rearranging' ? 0 : 10 }}
        >
           {phase === 'rearranging' ? (
              <CheckCircle2 className="w-5 h-5 text-[#E5B842] shrink-0" />
           ) : (
              <Circle className={`w-5 h-5 shrink-0 transition-all duration-300 ${phase === 'completing' ? 'text-[#E5B842] scale-125 bg-[#E5B842]/20 rounded-full shadow-[0_0_15px_rgba(229,184,66,0.5)]' : 'text-white/30'}`} />
           )}
           <div className="flex-1">
              <p className={`text-sm font-bold mb-0.5 transition-all duration-500 ${phase === 'rearranging' ? 'text-white/50 line-through' : 'text-white'}`}>Bring vegitable</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${phase === 'rearranging' ? 'text-white/30' : 'text-white/40'}`}>WORK</p>
           </div>
           {phase === 'rearranging' ? (
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-white/40 text-[10px] font-black uppercase tracking-widest">
                Priority 60
              </div>
           ) : (
              <div className="relative px-3 py-1 bg-[#E5B842]/10 border border-[#E5B842]/20 rounded-md text-[#E5B842] text-[10px] font-black uppercase tracking-widest overflow-hidden">
                Priority 60
                {phase === 'completing' && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
              </div>
           )}
           <Trash2 className="w-4 h-4 text-white/20 ml-2" />
        </div>

        {/* Existing completed task (Buy fruits) */}
        <div 
          className={`transition-all duration-700 ease-out border border-white/5 bg-[#090909] rounded-xl p-4 flex items-center gap-4 opacity-70 ${
            phase === 'rearranging' ? '-translate-y-20' : ''
          }`}
          style={{ zIndex: 5 }}
        >
           <CheckCircle2 className="w-5 h-5 text-[#E5B842] shrink-0" />
           <div className="flex-1">
              <p className="text-sm font-bold text-white/50 line-through mb-0.5">Buy fruits</p>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider">GENERAL</p>
           </div>
           <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-white/40 text-[10px] font-black uppercase tracking-widest">
              Priority 50
           </div>
           <Trash2 className="w-4 h-4 text-white/20 ml-2" />
        </div>

      </div>
      
    </div>
  );
}
