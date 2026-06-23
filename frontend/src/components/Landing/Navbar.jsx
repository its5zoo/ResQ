import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      const sections = ['features', 'voice', 'mobile'];
      let currentSection = '';

      if (window.scrollY < 200) {
        setActiveSection('');
        return;
      }

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            currentSection = sectionId;
            break;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
      scrolled 
        ? 'py-5 bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/80' 
        : 'py-7 bg-transparent border-b border-white/[0.03]'
    }`}>
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between">
        
        {/* ResQ Logo */}
        <Link to="/" className="flex items-center group">
          <span className="font-display font-black text-3xl tracking-tighter flex items-center transition-colors group-hover:text-white/90">
            <span className="text-silver-gradient text-shine-sweep">Res</span>
            <span className="text-gold-sweep text-glow-gold">Q</span>
          </span>
        </Link>

        {/* Center Links */}
        <div className="hidden md:flex items-center gap-10">
          <a 
            href="#features" 
            className={`text-sm font-semibold tracking-wider uppercase transition-all duration-300 ${
              activeSection === 'features' 
                ? 'text-[#E5B842] scale-105' 
                : 'text-white/50 hover:text-[#E5B842]'
            }`}
          >
            Features
          </a>
          <a 
            href="#voice" 
            className={`text-sm font-semibold tracking-wider uppercase transition-all duration-300 ${
              activeSection === 'voice' 
                ? 'text-[#E5B842] scale-105' 
                : 'text-white/50 hover:text-[#E5B842]'
            }`}
          >
            How It Works
          </a>
          <a 
            href="#mobile" 
            className={`text-sm font-semibold tracking-wider uppercase transition-all duration-300 ${
              activeSection === 'mobile' 
                ? 'text-[#E5B842] scale-105' 
                : 'text-white/50 hover:text-[#E5B842]'
            }`}
          >
            Mobile
          </a>
          <Link 
            to="/dashboard" 
            className="text-sm font-semibold tracking-wider uppercase text-white/70 hover:text-[#E5B842] transition-colors duration-300"
          >
            Workspace
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-5">
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold tracking-wider uppercase text-white/60 hover:text-[#E5B842] transition-all duration-300 focus:outline-hidden cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-lg text-sm font-semibold tracking-wider uppercase bg-transparent text-white border border-white/40 hover:border-[#E5B842] hover:text-[#E5B842] transition-all duration-500 hover:-translate-y-0.5 active:translate-y-0 focus:outline-hidden cursor-pointer"
          >
            Get Started
          </button>
        </div>

      </div>
    </nav>
  );
}
