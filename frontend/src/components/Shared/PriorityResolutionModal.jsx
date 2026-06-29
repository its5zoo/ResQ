import { useState, useEffect } from 'react';
import { Sparkles, X, AlertTriangle, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PriorityResolutionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [taskData, setTaskData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handlePrioritize = (e) => {
      if (e.detail && e.detail.taskId) {
        setTaskData(e.detail);
        setIsOpen(true);
      }
    };

    window.addEventListener('resq:prioritize-task', handlePrioritize);
    return () => window.removeEventListener('resq:prioritize-task', handlePrioritize);
  }, []);

  if (!isOpen || !taskData) return null;

  const handleStartFocus = () => {
    setIsOpen(false);
    // Navigate to tasks tab or trigger focus session
    window.dispatchEvent(new CustomEvent('resq:navigate', { detail: { target: 'tasks' } }));
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('resq:start-focus', { detail: { taskId: taskData.taskId, title: taskData.title } }));
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-[#050505]/80 backdrop-blur-md" 
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(229,184,66,0.15)] animate-fade-in-up">
        
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#E5B842] to-transparent opacity-50" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#E5B842]/20 blur-[50px] rounded-full pointer-events-none" />

        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-[#E5B842]" />
              </div>
              <div>
                <h2 className="text-white font-display font-black text-xl tracking-tight">Top Priority</h2>
                <p className="text-white/40 text-xs font-tech tracking-widest uppercase mt-0.5">AI Triage Active</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-2 text-white/40 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Task Info */}
          <div className="bg-[#111] border border-white/5 rounded-2xl p-5 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Most Critical Action</span>
            </div>
            <h3 className="text-xl text-white font-bold leading-snug">{taskData.title}</h3>
          </div>

          {/* AI Strategy */}
          <div className="relative z-10 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#E5B842]" />
              <span className="text-sm font-bold text-white">AI Strategy to Start</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed border-l-2 border-[#E5B842]/30 pl-4 py-1">
              {taskData.strategy}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button 
              onClick={handleStartFocus}
              className="flex-1 bg-white text-black px-6 py-4 rounded-xl font-bold text-sm hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer group"
            >
              <Zap className="w-4 h-4 text-[#E5B842] group-hover:scale-110 transition-transform" />
              Start Focus Session
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="px-6 py-4 rounded-xl font-bold text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
