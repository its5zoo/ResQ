import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import dashboardPreview from '../../assets/dashboard_preview.png';

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
            <div className="w-full max-w-[840px] relative mx-auto group select-none">
              
              {/* Laptop Screen Lid / Bezel */}
              <div className="relative bg-black rounded-t-2xl p-[10px] pb-1 border border-white/10 shadow-2xl overflow-hidden">
                {/* Webcam dot */}
                <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#1e2022] border border-white/5 flex items-center justify-center">
                  <span className="w-0.5 h-0.5 rounded-full bg-blue-500/80 animate-pulse"></span>
                </div>
                
                {/* Dashboard Image */}
                <div className="relative overflow-hidden rounded-lg bg-black aspect-[1920/1009] border border-white/5">
                  <img 
                    src={dashboardPreview} 
                    alt="ResQ Dashboard Preview" 
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-[1.015]"
                  />
                </div>
              </div>

              {/* Hinge Connection */}
              <div className="w-[102%] -ml-[1%] h-[4px] bg-[#1c1d1f] relative z-10 border-b border-black/20"></div>

              {/* Laptop Base (Space Gray / Matte Black Metallic Plate) */}
              <div className="w-[106%] -ml-[3%] h-[12px] bg-gradient-to-r from-[#1e1f22] via-[#3a3c42] to-[#1e1f22] rounded-b-xl border-t border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] relative z-20 flex justify-center">
                {/* Trackpad Notch cutout */}
                <div className="w-20 h-[3px] bg-[#121315] rounded-b-sm border-t border-black/40"></div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
