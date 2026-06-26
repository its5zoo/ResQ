import { useState, useEffect } from 'react';
import { Calendar, Disc, CheckSquare, Square } from 'lucide-react';

export default function GoalsAnimation() {
  const [phase, setPhase] = useState('idle');
  const [typedTitle, setTypedTitle] = useState('');
  const [typedMilestone, setTypedMilestone] = useState('');
  
  const targetTitle = "Become a React Native Developer";
  const targetMilestone = "Learn React Native basics";

  useEffect(() => {
    let isMounted = true;
    
    const runAnimation = async () => {
      while (isMounted) {
        setPhase('idle');
        setTypedTitle('');
        setTypedMilestone('');
        await new Promise(r => setTimeout(r, 1000));
        if (!isMounted) break;

        setPhase('typingTitle');
        for (let i = 0; i <= targetTitle.length; i++) {
          setTypedTitle(targetTitle.substring(0, i));
          await new Promise(r => setTimeout(r, 40));
          if (!isMounted) break;
        }
        await new Promise(r => setTimeout(r, 500));
        if (!isMounted) break;

        setPhase('selectingDate');
        await new Promise(r => setTimeout(r, 800));
        if (!isMounted) break;

        setPhase('typingMilestone');
        for (let i = 0; i <= targetMilestone.length; i++) {
          setTypedMilestone(targetMilestone.substring(0, i));
          await new Promise(r => setTimeout(r, 50));
          if (!isMounted) break;
        }
        await new Promise(r => setTimeout(r, 800));
        if (!isMounted) break;

        setPhase('submitting');
        await new Promise(r => setTimeout(r, 1500));
        if (!isMounted) break;

        setPhase('scrolling');
        await new Promise(r => setTimeout(r, 800));
        if (!isMounted) break;

        setPhase('result');
        await new Promise(r => setTimeout(r, 5000));
      }
    };
    
    runAnimation();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="w-full bg-[#050505] text-white font-sans overflow-hidden relative h-[520px]">
      
      {/* STEP 1: FORM */}
      <div 
        className="absolute w-full h-full p-8 transition-transform duration-1000 ease-in-out flex flex-col gap-6"
        style={{ transform: (phase === 'scrolling' || phase === 'result') ? 'translateY(-100%)' : 'translateY(0)' }}
      >
         <div className="flex items-center gap-2 mb-2">
            <Disc className="w-5 h-5 text-[#E5B842]" />
            <span className="text-sm font-bold uppercase tracking-wider text-white/80">Define New Goal</span>
         </div>
         
         {/* Title Input */}
         <div className="space-y-2">
           <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Goal Target</label>
           <div className="w-full bg-[#090909] border border-white/10 rounded-xl px-4 py-4 shadow-inner text-sm">
             <span className={typedTitle ? 'text-white font-bold' : 'text-white/30'}>
               {typedTitle || 'What do you want to achieve?'}
               {phase === 'typingTitle' && <span className="animate-pulse font-normal">|</span>}
             </span>
           </div>
         </div>

         {/* Date Selection */}
         <div className="space-y-2">
           <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Target Date</label>
           <div className={`w-full max-w-[220px] border rounded-xl px-4 py-3.5 flex items-center justify-between shadow-inner transition-colors ${phase === 'selectingDate' || phase === 'typingMilestone' || phase === 'submitting' ? 'bg-[#090909] border-[#E5B842]/50 text-white' : 'bg-[#090909] border-white/10 text-white/40'}`}>
             <span className="text-sm font-bold">{(phase === 'selectingDate' || phase === 'typingMilestone' || phase === 'submitting') ? '22/07/2026' : 'Select Date'}</span>
             <Calendar className={`w-4 h-4 ${phase === 'selectingDate' ? 'text-[#E5B842]' : 'opacity-50'}`} />
           </div>
         </div>

         {/* Milestone Input */}
         <div className="space-y-2">
           <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Rough Milestones</label>
           <div className="w-full bg-[#090909] border border-white/10 rounded-xl px-4 py-4 shadow-inner flex items-start gap-4">
             <span className="text-[10px] font-bold text-white/30 mt-0.5">WK 1</span>
             <span className={`text-sm flex-1 ${typedMilestone ? 'text-white' : 'text-white/30'}`}>
               {typedMilestone || 'Type a rough step...'}
               {phase === 'typingMilestone' && <span className="animate-pulse">|</span>}
             </span>
           </div>
         </div>

         {/* Submit Button */}
         <div className="mt-4 flex justify-end">
           <div className={`px-6 py-3 rounded-xl border font-bold text-xs tracking-widest uppercase transition-all duration-300 flex items-center gap-2 ${phase === 'submitting' ? 'bg-[#E5B842] text-black border-[#E5B842] scale-95 shadow-[0_0_25px_rgba(229,184,66,0.5)]' : 'bg-[#E5B842]/10 text-[#E5B842] border-[#E5B842]/30'}`}>
              {phase === 'submitting' ? (
                 <>
                    <Disc className="w-4 h-4 animate-spin-slow" />
                    AI is Polishing...
                 </>
              ) : (
                 "Generate Plan"
              )}
           </div>
         </div>
      </div>

      {/* STEP 2: RESULT CARD */}
      <div 
        className="absolute w-full h-full p-4 md:p-6 transition-transform duration-1000 ease-in-out flex items-center justify-center"
        style={{ transform: (phase === 'scrolling' || phase === 'result') ? 'translateY(0)' : 'translateY(100%)' }}
      >
         <div className="w-full max-w-sm border border-[#E5B842]/20 bg-[#0A0A0A] rounded-[2rem] p-6 shadow-2xl relative">
            <div className="flex justify-between items-start mb-4">
               <div className="px-3 py-1 bg-[#E5B842]/10 border border-[#E5B842]/20 rounded-full text-[#E5B842] text-[10px] font-black uppercase tracking-widest">
                 PERSONAL
               </div>
               <div className="w-10 h-10 rounded-full border-2 border-[#E5B842]/30 flex items-center justify-center relative shadow-[0_0_15px_rgba(229,184,66,0.15)]">
                 <span className="text-xs font-bold text-[#E5B842]">25%</span>
               </div>
            </div>
            
            <h3 className="text-xl font-black text-white mb-3 tracking-tight">{targetTitle}</h3>
            
            <div className="flex items-center gap-2 text-white/50 mb-6">
               <Calendar className="w-3.5 h-3.5" />
               <span className="text-[10px] font-bold uppercase tracking-widest">TARGET: 22/07/2026</span>
            </div>

            <div className="space-y-4">
               <h4 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">MILESTONES CHECKLIST</h4>
               
               <div className="flex items-start gap-3 opacity-40">
                  <CheckSquare className="w-4 h-4 text-[#E5B842] mt-0.5 shrink-0" />
                  <p className="text-xs text-white/80 leading-relaxed line-through">
                    Week 1: Master React Native fundamentals and develop three distinct UI screens. 
                    <strong className="text-[#E5B842] ml-1">(MEDIUM EFFORT)</strong>
                  </p>
               </div>
               
               <div className="flex items-start gap-3 bg-white/[0.03] p-2.5 -mx-2.5 rounded-xl border border-white/5">
                  <Square className="w-4 h-4 text-white/30 mt-0.5 shrink-0" />
                  <p className="text-xs text-white/90 leading-relaxed">
                    Week 2: Implement screen navigation, integrate external APIs, and manage state. 
                    <strong className="text-[#E5B842] ml-1">(MEDIUM EFFORT)</strong>
                  </p>
               </div>
            </div>

            <div className="mt-6 border border-[#E5B842]/30 bg-[#E5B842]/5 rounded-2xl p-4 shadow-inner relative overflow-hidden">
               <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#E5B842]"></div>
               <div className="flex items-center gap-2 mb-2 ml-1">
                 <Disc className="w-3.5 h-3.5 text-[#E5B842]" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-[#E5B842]">AI TIMELINE BREAKDOWN</span>
               </div>
               <p className="text-xs text-white/70 leading-relaxed italic ml-1">
                 "You're making steady progress. You have 4 weeks left to complete the remaining milestones."
               </p>
            </div>
         </div>
      </div>

    </div>
  );
}
