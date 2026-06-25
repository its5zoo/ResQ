import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext.jsx';
import LogoutModal from '../Shared/LogoutModal.jsx';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const themeFromStorage = typeof window !== 'undefined' ? localStorage.getItem('resq-theme') : null;
  const [theme, setTheme] = useState(() => themeFromStorage || 'dark');
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuthContext();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'matrix');
    if (theme === 'light') {
      root.classList.add('light');
    } else if (theme === 'matrix') {
      root.classList.add('matrix');
    }
    localStorage.setItem('resq-theme', theme);
  }, [theme]);

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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  const handleNavClick = (e, section) => {
    e.preventDefault();
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { href: '#features', label: 'Features', section: 'features' },
    { href: '#voice', label: 'How It Works', section: 'voice' },
    { href: '#mobile', label: 'Mobile', section: 'mobile' },
  ];

  return (
    <>
      <nav className={`fixed top-0 left-0 w-full z-[100] transition-all duration-500 ${
        scrolled 
          ? 'py-3 md:py-5 bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/80' 
          : 'py-4 md:py-7 bg-transparent border-b border-white/[0.03]'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* ResQ Logo */}
          <Link to="/" className="flex items-center group" style={{ minHeight: 'auto' }}>
            <span className="font-display font-black text-2xl md:text-3xl tracking-tighter flex items-center transition-colors group-hover:text-white/90">
              <span className="text-silver-gradient text-shine-sweep">Res</span>
              <span className="text-gold-sweep text-glow-gold">Q</span>
            </span>
          </Link>

          {/* Center Links — Desktop Only */}
          <div className="hidden md:flex items-center gap-6 lg:gap-10">
            {navLinks.map(({ href, label, section }) => (
              <a 
                key={section}
                href={href} 
                onClick={(e) => handleNavClick(e, section)}
                className={`text-sm font-semibold tracking-wider uppercase transition-all duration-300 ${
                  activeSection === section 
                    ? 'text-[#E5B842] scale-105' 
                    : 'text-white/50 hover:text-[#E5B842]'
                }`}
              >
                {label}
              </a>
            ))}
            <Link 
              to="/dashboard" 
              className="text-sm font-semibold tracking-wider uppercase text-white/70 hover:text-[#E5B842] transition-colors duration-300"
            >
              Workspace
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(prev => (prev === 'light' ? 'dark' : 'light'))}
              className="p-2 sm:p-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-[#E5B842] transition-all duration-300 focus:outline-hidden cursor-pointer flex items-center justify-center html-light-btn-white"
              style={{ minHeight: 'auto' }}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 hover:rotate-12" />
              ) : (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 hover:rotate-45" />
              )}
            </button>

            {/* Desktop Auth Buttons */}
            {isAuthenticated ? (
              <button 
                onClick={() => setIsLogoutModalOpen(true)}
                className="hidden md:flex px-4 lg:px-5 py-2 lg:py-2.5 rounded-lg text-sm font-semibold tracking-wider uppercase text-white border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 focus:outline-hidden cursor-pointer"
                style={{ minHeight: 'auto' }}
              >
                Logout
              </button>
            ) : (
              <>
                <button 
                  onClick={() => navigate('/auth')}
                  className="hidden md:flex px-4 lg:px-5 py-2 lg:py-2.5 rounded-lg text-sm font-semibold tracking-wider uppercase text-white/60 hover:text-[#E5B842] transition-all duration-300 focus:outline-hidden cursor-pointer"
                  style={{ minHeight: 'auto' }}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => navigate('/auth')}
                  className="hidden md:flex px-4 lg:px-6 py-2 lg:py-3 rounded-lg text-sm font-semibold tracking-wider uppercase bg-transparent text-white border border-white/40 hover:border-[#E5B842] hover:text-[#E5B842] transition-all duration-500 hover:-translate-y-0.5 active:translate-y-0 focus:outline-hidden cursor-pointer"
                  style={{ minHeight: 'auto' }}
                >
                  Get Started
                </button>
              </>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-white/70 hover:text-white transition-colors"
              style={{ minHeight: 'auto' }}
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[200] md:hidden flex"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          
          {/* Panel */}
          <div
            className="relative ml-auto w-80 h-full bg-[#050505] border-l border-white/[0.06] flex flex-col animate-slide-in-right"
            onClick={e => e.stopPropagation()}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <span className="font-display font-black text-2xl tracking-tighter flex items-center">
                <span className="text-silver-gradient text-shine-sweep">Res</span>
                <span className="text-gold-sweep text-glow-gold">Q</span>
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-white/60 hover:text-white transition-colors"
                style={{ minHeight: 'auto' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-5 space-y-2">
              {navLinks.map(({ href, label, section }) => (
                <a
                  key={section}
                  href={href}
                  onClick={(e) => handleNavClick(e, section)}
                  className={`flex items-center px-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all ${
                    activeSection === section
                      ? 'bg-[#E5B842]/10 text-[#E5B842] border border-[#E5B842]/20'
                      : 'text-white/60 hover:text-white hover:bg-white/[0.03] border border-transparent'
                  }`}
                  style={{ minHeight: 'auto' }}
                >
                  {label}
                </a>
              ))}
              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center px-4 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider text-white/60 hover:text-white hover:bg-white/[0.03] border border-transparent transition-all"
                style={{ minHeight: 'auto' }}
              >
                Workspace
              </Link>
            </nav>

            {/* Auth Actions */}
            <div className="p-5 border-t border-white/5 space-y-3">
              {isAuthenticated ? (
                <button
                  onClick={() => { setIsMobileMenuOpen(false); setIsLogoutModalOpen(true); }}
                  className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider text-white border border-white/20 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer"
                  style={{ minHeight: 'auto' }}
                >
                  Logout
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/auth'); }}
                    className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider bg-[#E5B842] text-black hover:bg-[#FFF2CC] transition-all cursor-pointer"
                    style={{ minHeight: 'auto' }}
                  >
                    Get Started
                  </button>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); navigate('/auth'); }}
                    className="w-full py-3 rounded-xl text-sm font-semibold uppercase tracking-wider text-white/60 hover:text-white transition-all cursor-pointer"
                    style={{ minHeight: 'auto' }}
                  >
                    Sign In
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={async () => {
          await logout();
          navigate('/');
        }}
      />
    </>
  );
}
