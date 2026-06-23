import React from 'react';
import { 
  BrainCircuit, 
  Calendar, 
  Hourglass, 
  Brain,
  BellRing, 
  Flame, 
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Zap
} from 'lucide-react';
import taskPrioritizationPreview from '../../assets/task_prioritization_preview.png';
import calendarSyncPreview from '../../assets/calendar_sync_preview.png';

export default function FeaturesGrid() {
  const features = [
    {
      icon: <BrainCircuit className="w-6 h-6 text-white" />,
      title: "Intelligent Task Prioritization",
      desc: "Our Agentic engine scores your workload using task urgency, personal energy cycles, and historical task completion rates. The most critical items stay floating at the top of your stack.",
      plainMockup: true,
      renderMockup: () => (
        <img 
          src={taskPrioritizationPreview} 
          alt="Intelligent Task Prioritization Stack" 
          className="w-full h-auto rounded-3xl border border-white/10 shadow-2xl transition-transform duration-700 hover:scale-[1.02] select-none"
        />
      )
    },
    {
      icon: <Calendar className="w-6 h-6 text-white" />,
      title: "AI-Powered Scheduling",
      desc: "Automatically syncs with Google Calendar. The AI searches for open slots, negotiates conflicts, and blocks focused sessions for you.",
      plainMockup: true,
      renderMockup: () => (
        <img 
          src={calendarSyncPreview} 
          alt="AI-Powered Scheduling Calendar" 
          className="max-w-[420px] w-full h-auto rounded-3xl border border-white/10 shadow-2xl transition-transform duration-700 hover:scale-[1.02] select-none mx-auto"
        />
      )
    },
    {
      icon: <Flame className="w-6 h-6 text-white" />,
      title: "Goal & Habit Tracking",
      desc: "Connect habits directly to major goals. Track daily progress, lock in habit streaks, and receive reactive AI nudges when a habit begins to slip.",
      renderMockup: () => (
        <div className="w-full h-full flex flex-col justify-between bg-[#0b0b0b] border border-white/[0.04] rounded-2xl p-6 layered-shadow-lg font-sans">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <span className="text-[8px] font-tech text-white/40 uppercase tracking-widest">Momentum Tracker</span>
            <span className="text-[7px] font-tech bg-white/5 border border-white/10 text-white/50 px-2 py-0.5 rounded-full">Streaks</span>
          </div>
          <div className="space-y-3.5">
            <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
              <div className="flex items-center gap-2.5">
                <Flame className="w-4 h-4 text-white animate-pulse" />
                <div>
                  <span className="text-[10px] font-bold text-white block">Gym Workout</span>
                  <span className="text-[8px] text-white/40 block">🔥 7 Days Streak</span>
                </div>
              </div>
              <span className="text-[8px] bg-white/10 border border-white/20 text-white px-2.5 py-0.5 rounded-full font-bold">DONE</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {['M','T','W','T','F','S','S'].map((day, dIdx) => (
                <div key={dIdx} className={`p-1.5 rounded-lg border flex flex-col items-center justify-center ${dIdx < 5 ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-white/20'}`}>
                  <span className="text-[8px] font-bold">{day}</span>
                  <div className={`w-1 h-1 rounded-full mt-1 ${dIdx < 5 ? 'bg-white' : 'bg-white/10'}`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <Sparkles className="w-6 h-6 text-white" />,
      title: "Autonomous Task Execution",
      desc: "Let your assistant write response drafts, break complex goals into structured sub-steps, create sub-tasks on the fly, and resolve workflows entirely in the background.",
      renderMockup: () => (
        <div className="w-full h-full flex flex-col justify-between bg-[#0b0b0b] border border-white/[0.04] rounded-2xl p-6 layered-shadow-lg font-sans">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <span className="text-[8px] font-tech text-white/40 uppercase tracking-widest">Agent Checklist</span>
            <span className="text-[7px] font-tech bg-white/5 border border-white/10 text-white/50 px-2 py-0.5 rounded-full">Executing</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 p-2 bg-white/5 border border-white/10 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-status-green" />
              <span className="text-[10px] text-white/80">Deconstruct project requirements</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 bg-white/[0.02] border border-white/5 rounded-lg">
              <span className="w-3.5 h-3.5 rounded-full border border-white/35 animate-spin border-t-transparent shrink-0"></span>
              <span className="text-[10px] text-white/70">Formulate core structure</span>
            </div>
            <div className="flex items-center gap-2.5 p-2 bg-transparent opacity-40 rounded-lg">
              <Circle className="w-3.5 h-3.5 text-white/20" />
              <span className="text-[10px] text-white/40">Audit code performance</span>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <Hourglass className="w-6 h-6 text-white" />,
      title: "Energy-Aware Recommendations",
      desc: "Instead of strict schedules, receive prompts tailored to your current cognitive energy level (e.g. suggesting deep work in the morning and administrative tasks post-lunch).",
      renderMockup: () => (
        <div className="w-full h-full flex flex-col justify-between bg-[#0b0b0b] border border-white/[0.04] rounded-2xl p-6 layered-shadow-lg font-sans">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <span className="text-[8px] font-tech text-white/40 uppercase tracking-widest">Cognitive State</span>
            <span className="text-[7px] font-tech bg-white/5 border border-white/10 text-white/50 px-2 py-0.5 rounded-full">Synced</span>
          </div>
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between items-center text-[10px] mb-1.5">
                <span className="text-white/50 font-medium">Cognitive Focus capacity:</span>
                <span className="text-white font-bold">85% (High Focus)</span>
              </div>
              <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full w-[85%]"></div>
              </div>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2.5">
              <Zap className="w-4 h-4 text-white animate-pulse" />
              <div>
                <span className="text-[10px] font-bold text-white block">Suggested: Deep Work block</span>
                <span className="text-[8px] text-white/40 block">Ideal time for React architecture</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      icon: <BellRing className="w-6 h-6 text-white" />,
      title: "Contextual Deadlines",
      desc: "Say goodbye to standard time-based reminders. Get smart alerts that calculate traffic, calendar schedule density, and your historical velocity before warning you.",
      renderMockup: () => (
        <div className="w-full h-full flex flex-col justify-between bg-[#0b0b0b] border border-white/[0.04] rounded-2xl p-6 layered-shadow-lg font-sans">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <span className="text-[8px] font-tech text-white/40 uppercase tracking-widest">Hazard Radar</span>
            <span className="text-[7px] font-tech bg-white/5 border border-white/10 text-white/50 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div className="space-y-3">
            <div className="p-3.5 bg-status-red/5 border border-status-red/20 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-red opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-status-red"></span>
                </span>
                <div>
                  <span className="text-[10px] font-bold text-white block">Submission Hazard Alert</span>
                  <span className="text-[8px] text-white/40 block">Overdue risk level: CRITICAL</span>
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-white/50 px-1">
              <span>Timeline buffer:</span>
              <span className="text-status-red font-bold font-tech">45 mins remaining</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="features" className="pt-24 pb-44 relative bg-[#050505] bg-noise overflow-hidden border-t border-white/[0.03]">
      {/* Decorative side glow */}
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-white/[0.015] rounded-full blur-[130px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        
        {/* Section Header with generous bottom margin */}
        <div className="text-center max-w-3xl mx-auto mb-32 font-sans">
          <span className="text-xs font-tech font-bold tracking-[0.3em] uppercase text-white/50 block mb-5">
            SYSTEM ENGINE
          </span>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-display font-black text-silver-gradient text-shine-sweep mb-6 leading-tight tracking-tight">
            Custom built to combat <br />
            <span className="text-[#E5B842]" style={{ background: 'none', WebkitTextFillColor: '#E5B842', WebkitBackgroundClip: 'initial' }}>cognitive</span> overload.
          </h2>
          <p className="text-sm sm:text-base text-white/50 leading-relaxed font-normal max-w-xl mx-auto tracking-normal">
            No templates. No simple checklists. We designed ResQ around cognitive neuroscience and agentic automation principles.
          </p>
        </div>

        {/* Alternating Feature Rows */}
        <div className="space-y-36 lg:space-y-48">
          {features.map((feat, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div 
                key={idx}
                className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center border-b border-white/[0.02] pb-24 lg:pb-32 last:border-0"
              >
                {/* Text Column */}
                <div 
                  className={`lg:col-span-5 space-y-6 ${
                    isEven ? '' : 'lg:order-2'
                  }`}
                >
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 transition-all duration-300">
                    {feat.icon}
                  </div>
                  <div className="space-y-3 font-sans">
                    <span className="text-xs font-tech text-white/45 uppercase tracking-[0.2em] block">
                      RQ-ENG-0{idx+1} // Core Node
                    </span>
                    <h3 className="text-2xl lg:text-3xl font-display font-black text-white tracking-tight leading-snug">
                      {feat.title}
                    </h3>
                    <p className="text-sm sm:text-base text-white/50 leading-relaxed font-normal tracking-wide font-sans">
                      {feat.desc}
                    </p>
                  </div>
                </div>

                {/* Graphic Mockup Column */}
                <div 
                  className={
                    feat.plainMockup 
                      ? `lg:col-span-7 flex items-center justify-center relative ${isEven ? '' : 'lg:order-1'}`
                      : `lg:col-span-7 bg-[#090909] border border-white/[0.04] rounded-3xl layered-shadow-lg card-shine-sweep flex items-center justify-center relative overflow-hidden ${
                          feat.containerPadding || "p-8 lg:p-10"
                        } ${
                          feat.containerHeight || "h-[320px]"
                        } ${
                          isEven ? '' : 'lg:order-1'
                        }`
                  }
                >
                  {feat.renderMockup()}
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
