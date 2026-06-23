import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play, CheckCircle2, Circle, Sparkles, Cpu, Bell, Calendar, Clock, Inbox, TrendingUp, AlertTriangle } from 'lucide-react';

export default function Hero() {
  const navigate = useNavigate();
  
  // Mouse Parallax States
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    // Normalize coordinates around the center (-0.5 to 0.5)
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    // Smoothly spring reset
    setMousePos({ x: 0, y: 0 });
  };

  // Scroll factor interpolation
  const scrollFactor = Math.min(Math.max(scrollY / 800, 0), 1);
  const titleScale = 1 - scrollFactor * 0.08;
  const titleTranslateY = scrollFactor * -30;
  const titleOpacity = Math.max(1 - scrollFactor * 0.8, 0.2);

  const dashboardTranslateY = scrollFactor * -80;
  const dashboardScale = 1 + scrollFactor * 0.06;

  // Live Activity Loop States
  const [activeStep, setActiveStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [telemetry, setTelemetry] = useState({ tasks: 8, done: 5, alerts: 2 });

  useEffect(() => {
    const loopInterval = setInterval(() => {
      setActiveStep((prevStep) => {
        const nextStep = (prevStep + 1) % 4;
        
        // Reset states
        setIsTyping(false);
        setTaskCompleted(false);
        setNotifVisible(false);

        if (nextStep === 1) {
          setIsTyping(true);
        } else if (nextStep === 2) {
          setTaskCompleted(true);
          setTelemetry({ tasks: 7, done: 6, alerts: 1 });
        } else if (nextStep === 3) {
          setTaskCompleted(true);
          setNotifVisible(true);
          setTelemetry({ tasks: 7, done: 6, alerts: 1 });
        } else {
          // Reset to initial
          setTelemetry({ tasks: 8, done: 5, alerts: 2 });
        }

        return nextStep;
      });
    }, 4500);

    return () => clearInterval(loopInterval);
  }, []);

  // Split title for stagger reveal
  const brandName = "ResQ".split("");

  return (
    <section 
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#050505] bg-noise select-none"
    >
      
      {/* BACKGROUND LAYERS */}

      {/* Layer 1: Subtle Grid Lines with Spotlight Mask (Cursor follows) */}
      <div 
        className="absolute inset-0 bg-grid-lines pointer-events-none z-0 opacity-80"
        style={{
          maskImage: `radial-gradient(circle 350px at ${50 + mousePos.x * 30}% ${50 + mousePos.y * 30}%, black, transparent)`,
          WebkitMaskImage: `radial-gradient(circle 350px at ${50 + mousePos.x * 30}% ${50 + mousePos.y * 30}%, black, transparent)`
        }}
      ></div>

      {/* Layer 2: Massive Radial Glow behind Logo */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] bg-white/[0.02] rounded-full blur-[250px] mix-blend-screen animate-ambient-glow"
          style={{
            transform: `translate(-50%, -50%) translate3d(${mousePos.x * -15}px, ${mousePos.y * -15}px, 0)`
          }}
        ></div>
      </div>

      {/* 12-Column Grid Container */}
      <div className="max-w-[1440px] w-full mx-auto px-5 sm:px-8 xl:px-20 relative z-10 pt-28 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-center w-full">
          
          {/* LEFT CONTENT COLUMN (5 Columns) */}
          <div 
            className="lg:col-span-5 flex flex-col items-center lg:items-start text-center lg:text-left transition-all duration-500 ease-spring"
            style={{
              transform: `translate3d(${mousePos.x * 4}px, ${mousePos.y * 4 + titleTranslateY}px, 0) scale(${titleScale})`,
              opacity: titleOpacity
            }}
          >
            {/* Tagline */}
            <div className="flex items-center gap-2.5 mb-6 opacity-0 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <span className="text-[9px] font-semibold tracking-[0.25em] uppercase text-white/30 font-tech">
                — AI PRODUCTIVITY COMPANION · WORKSPACE V1.0
              </span>
            </div>

            {/* Title with stagger letter reveals */}
            <h1 className="text-[90px] sm:text-[120px] lg:text-[140px] font-display font-black leading-[0.85] tracking-tight mb-8">
              {brandName.map((char, idx) => (
                <span 
                  key={idx}
                  className={`reveal-char ${char === 'Q' ? 'text-gold-gradient text-gold-sweep text-glow-gold' : 'text-silver-gradient text-shine-sweep'}`}
                  style={{ 
                    animationDelay: `${idx * 0.04}s`
                  }}
                >
                  {char}
                </span>
              ))}
            </h1>

            {/* Persuasive copy (Problem -> Transformation -> Outcome) */}
            <div 
              className="space-y-4 max-w-lg mb-10 opacity-0 animate-fade-in" 
              style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/75">
                Stop reacting to deadlines.
              </h3>
              <p className="text-base sm:text-lg text-white/60 font-normal leading-relaxed tracking-normal font-sans">
                ResQ predicts priorities, organizes chaos, and executes before problems become emergencies.
              </p>
            </div>

            {/* CTA buttons */}
            <div 
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto opacity-0 animate-fade-in"
              style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
            >
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-xs font-bold tracking-wider uppercase bg-transparent text-white border border-white hover:bg-white hover:text-black shadow-lg shadow-white/5 hover:shadow-white/20 transition-all duration-500 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer font-tech active:scale-[0.98]"
              >
                Get started free <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl text-xs font-bold tracking-wider uppercase border border-white/5 hover:border-white/20 text-white/70 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer font-tech active:scale-[0.98] group"
              >
                <Play className="w-3 h-3 fill-white/10 text-white/30 group-hover:scale-110 group-hover:text-white transition-all" /> 
                <span className="group-hover:hidden">Watch demo</span>
                <span className="hidden group-hover:inline">▶ Play Preview</span>
              </button>
            </div>

          </div>

          {/* RIGHT DASHBOARD PREVIEW COLUMN (7 Columns) */}
          <div 
            className="lg:col-span-7 flex justify-center lg:justify-end transition-all duration-500 ease-spring opacity-0 animate-fade-in"
            style={{
              transform: `translate3d(${mousePos.x * 8}px, ${mousePos.y * 8 + dashboardTranslateY}px, 0) scale(${dashboardScale})`,
              animationDelay: '0.3s',
              animationFillMode: 'forwards'
            }}
          >
            <div className="w-full max-w-[520px] bg-[#090909] border border-white/[0.06] rounded-3xl p-8 shadow-2xl relative overflow-hidden transition-all duration-500 hover:border-white/10 layered-shadow-xl card-shine-sweep">
              
              {/* Soft glow reflection edge */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent"></div>

              {/* Title bar */}
              <div className="flex items-center justify-between border-b border-white/5 pb-5 mb-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white/10"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-white/10"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-white/10"></span>
                </div>
                <span className="text-[9px] font-semibold tracking-widest uppercase text-white/20">resq // dashboard</span>
              </div>

              {/* AI Recommendation bubble (Living State Nudge) */}
              <div className="p-5 bg-white/[0.015] border border-white/10 rounded-2xl mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-5">
                  <Cpu className="w-16 h-16 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-white/60 animate-pulse" />
                  <span className="text-[9px] font-semibold text-white/60 uppercase tracking-wider">AI Recommendation</span>
                </div>
                <div className="min-h-[50px] flex flex-col justify-center">
                  {isTyping ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-white/60 font-light italic animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                      Analyzing priorities...
                    </div>
                  ) : notifVisible ? (
                    <p className="text-[11px] text-white/80 leading-relaxed font-light">
                      "I have scheduled a 45 min Focus block for 'Submit project report' in your calendar."
                    </p>
                  ) : taskCompleted ? (
                    <p className="text-[11px] text-status-green leading-relaxed font-light">
                      "Completed task checked off. Overdue hazard meter has dropped to Safe."
                    </p>
                  ) : (
                    <p className="text-[11px] text-white/70 leading-relaxed font-light">
                      "You have 2 deadlines today. I've 'Focus: UI designs' block scheduled on your calendar."
                    </p>
                  )}
                </div>
              </div>

              {/* Task list rows */}
              <div className="space-y-4 mb-8">
                {/* Task 1 */}
                <div className={`flex items-center justify-between p-4 bg-[#0F0F0F] border border-white/[0.04] rounded-2xl transition-all duration-500 ${
                  taskCompleted ? 'opacity-50' : ''
                }`}>
                  <div className="flex items-center gap-3.5">
                    {taskCompleted ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-status-green animate-bounce" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-white/20" />
                    )}
                    <span className={`text-xs text-white/80 font-medium font-sans transition-all ${
                      taskCompleted ? 'line-through text-white/40' : ''
                    }`}>Submit project report</span>
                  </div>
                  <span className={`text-[8px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                    taskCompleted 
                      ? 'bg-white/5 border-white/10 text-white/30'
                      : 'bg-status-red/10 border-status-red/20 text-status-red'
                  }`}>
                    {taskCompleted ? 'DONE' : 'URGENT'}
                  </span>
                </div>

                {/* Task 2 */}
                <div className="flex items-center justify-between p-4 bg-[#0F0F0F] border border-white/[0.04] rounded-2xl">
                  <div className="flex items-center gap-3.5">
                    <Circle className="w-4.5 h-4.5 text-white/20" />
                    <span className="text-xs text-white/80 font-medium font-sans">Clean out inbox priorities</span>
                  </div>
                  <span className="text-[8px] text-white/60 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full font-bold">MED</span>
                </div>

                {/* Task 3 */}
                <div className="flex items-center justify-between p-4 bg-[#0F0F0F] border border-white/[0.04] rounded-2xl opacity-40">
                  <div className="flex items-center gap-3.5">
                    <CheckCircle2 className="w-4.5 h-4.5 text-status-green" />
                    <span className="text-xs text-white/40 line-through font-sans">Renew member card details</span>
                  </div>
                  <span className="text-[8px] text-white/20 px-2 py-0.5 rounded-full font-bold">DONE</span>
                </div>
              </div>

              {/* Notification Overlay Slide-In (Micro-motion) */}
              <div className={`absolute bottom-28 left-6 right-6 p-4 bg-[#151515] border border-white/10 rounded-2xl shadow-2xl flex items-center gap-3 transition-all duration-700 ${
                notifVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0 pointer-events-none'
              }`}>
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                  <Bell className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-[10px] font-semibold text-white uppercase tracking-wider">AI focus scheduled</h5>
                  <p className="text-[9px] text-white/50 leading-none mt-1">Focus slot added: 4:00 PM today</p>
                </div>
              </div>

              {/* Telemetry rows */}
              <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6 transition-all duration-500">
                <div className="p-4 bg-[#0F0F0F] border border-white/[0.04] rounded-2xl">
                  <span className="text-2xl font-bold text-white block leading-none transition-all">{telemetry.tasks}</span>
                  <span className="text-[8px] text-white/30 uppercase tracking-wider mt-1.5 block">Tasks</span>
                </div>
                <div className="p-4 bg-[#0F0F0F] border border-white/[0.04] rounded-2xl">
                  <span className="text-2xl font-bold text-status-green block leading-none transition-all">{telemetry.done}</span>
                  <span className="text-[8px] text-white/30 uppercase tracking-wider mt-1.5 block">Done</span>
                </div>
                <div className="p-4 bg-[#0F0F0F] border border-white/[0.04] rounded-2xl">
                  <span className="text-2xl font-bold text-status-red block leading-none transition-all">{telemetry.alerts}</span>
                  <span className="text-[8px] text-white/30 uppercase tracking-wider mt-1.5 block">Alerts</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
