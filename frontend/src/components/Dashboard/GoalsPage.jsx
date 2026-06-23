import React, { useState } from 'react';
import { Target, Plus, Sparkles, CheckSquare, Calendar, Trash2 } from 'lucide-react';

export default function GoalsPage() {
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: 'Submit High-Quality Hackathon Project',
      category: 'Hackathon',
      progress: 65,
      targetDate: 'June 25, 2026',
      milestones: [
        { id: 10, title: 'Establish core React layout', done: true },
        { id: 11, title: 'Connect calendar auto-block scheduling', done: true },
        { id: 12, title: 'Record Android/iOS UI flows', done: false },
        { id: 13, title: 'Audit code performance & bundle sizes', done: false }
      ],
      aiInsight: "Vibe2Ship Hackathon submission requires clean demonstration assets. Priority focus: complete the recordings before June 24."
    },
    {
      id: 2,
      title: 'Construct High-Performance backend strategy',
      category: 'Development',
      progress: 30,
      targetDate: 'July 15, 2026',
      milestones: [
        { id: 20, title: 'Scaffold Node Express server', done: true },
        { id: 21, title: 'Initialize MongoDB schema strategies', done: false },
        { id: 22, title: 'Incorporate passport strategies for security OAuth', done: false }
      ],
      aiInsight: "Database migration strategies are still in planning. Resolve express setups first."
    }
  ]);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [targetDate, setTargetDate] = useState('June 30, 2026');

  const toggleMilestone = (goalId, milestoneId) => {
    setGoals(goals.map(g => {
      if (g.id !== goalId) return g;
      const updated = g.milestones.map(m => m.id === milestoneId ? { ...m, done: !m.done } : m);
      const doneCount = updated.filter(m => m.done).length;
      const computedProgress = Math.round((doneCount / updated.length) * 100);
      return {
        ...g,
        milestones: updated,
        progress: computedProgress
      };
    }));
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newGoal = {
      id: Date.now(),
      title,
      category,
      progress: 0,
      targetDate,
      milestones: [
        { id: Date.now() + 1, title: 'Draft milestone requirements', done: false }
      ],
      aiInsight: "Goal successfully initialized. Write sub-steps to calculate priority timelines."
    };
    setGoals([...goals, newGoal]);
    setTitle('');
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <span className="text-xs font-tech font-bold tracking-[0.3em] text-[#E5B842] block mb-2">TARGET MODULES</span>
          <h2 className="text-3xl font-display font-black tracking-tight text-white leading-none">
            Strategic Goals & Milestones
          </h2>
        </div>
      </div>

      {/* Add Goal Panel */}
      <form onSubmit={handleAddGoal} className="p-6 bg-[#090909] border border-white/[0.04] rounded-2xl space-y-4 layered-shadow-lg">
        <h3 className="text-[10px] font-bold text-[#E5B842] tracking-widest uppercase font-display">Launch Strategic Target</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <input 
            type="text"
            placeholder="Name your goal (e.g. Master React Native)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="md:col-span-6 bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-hidden transition-all duration-300"
            required
          />
          <input 
            type="text"
            placeholder="Category (e.g. Health, Work)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="md:col-span-3 bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-hidden transition-all duration-300"
            required
          />
          <input 
            type="text"
            placeholder="Target Date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="md:col-span-3 bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 focus:outline-hidden transition-all duration-300"
            required
          />
        </div>
        <div className="flex justify-end">
          <button 
            type="submit"
            className="px-6 py-3 bg-transparent text-[#E5B842] border border-[#E5B842]/40 hover:bg-[#E5B842] hover:text-black hover:border-transparent text-xs font-bold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center gap-1.5 cursor-pointer font-sans active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Create Goal
          </button>
        </div>
      </form>

      {/* Grid of Goal Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {goals.map((goal) => (
          <div key={goal.id} className="p-6 bg-[#090909] border border-white/[0.04] rounded-3xl space-y-6 flex flex-col justify-between layered-shadow-lg">
            <div className="space-y-4">
              
              {/* Header card details */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-[10px] bg-[#E5B842]/5 border border-[#E5B842]/20 text-[#E5B842] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    {goal.category}
                  </span>
                  <h3 className="text-sm font-bold text-white mt-2 leading-snug">{goal.title}</h3>
                </div>
                
                {/* SVG Progress Ring */}
                <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.05)" strokeWidth="3" fill="transparent" />
                    <circle 
                      cx="24" 
                      cy="24" 
                      r="20" 
                      stroke="#E5B842" 
                      strokeWidth="3" 
                      fill="transparent" 
                      strokeDasharray="125.6" 
                      strokeDashoffset={125.6 - (125.6 * goal.progress) / 100}
                    />
                  </svg>
                  <span className="absolute text-[9px] font-bold text-[#E5B842]">{goal.progress}%</span>
                </div>
              </div>

              {/* Target date indicator */}
              <div className="flex items-center gap-1 text-[10px] text-white/40 uppercase font-bold">
                <Calendar className="w-3.5 h-3.5 text-[#E5B842]/80" /> Target: {goal.targetDate}
              </div>

              {/* Milestones list */}
              <div className="space-y-2">
                <h4 className="text-[10px] uppercase font-bold text-white/30 tracking-widest">Milestones Checklist</h4>
                {goal.milestones.map((milestone) => (
                  <div 
                    key={milestone.id}
                    onClick={() => toggleMilestone(goal.id, milestone.id)}
                    className="flex items-center gap-2.5 p-2.5 bg-black/40 border border-white/[0.03] rounded-xl cursor-pointer hover:border-white/10 transition-all duration-300"
                  >
                    {milestone.done ? (
                      <CheckSquare className="w-4 h-4 text-[#E5B842]" />
                    ) : (
                      <div className="w-4 h-4 rounded-sm border border-white/20"></div>
                    )}
                    <span className={`text-xs ${milestone.done ? 'line-through text-white/35' : 'text-white/70'}`}>
                      {milestone.title}
                    </span>
                  </div>
                ))}
              </div>

            </div>

            {/* AI Review Insight */}
            <div className="p-4 bg-white/[0.01] border border-[#E5B842]/20 rounded-2xl relative overflow-hidden card-shine-sweep mt-4">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E5B842]" />
                <span className="text-[9px] font-bold text-white uppercase tracking-wider font-display">AI Weekly Review</span>
              </div>
              <p className="text-[11px] text-white/70 font-light leading-relaxed">
                "{goal.aiInsight}"
              </p>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

