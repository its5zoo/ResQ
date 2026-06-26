import { Mail, MapPin, User, FileText, Compass, ChevronRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-14 lg:py-24 border-t border-white/[0.04] bg-[#050505] bg-noise relative z-20 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-x-8 lg:gap-x-12 gap-y-10 lg:gap-y-16 pb-12 lg:pb-20 border-b border-white/5">
          
          {/* Brand Info (3 Cols) */}
          <div className="lg:col-span-3 space-y-8 pr-4">
            <div className="flex items-center">
              <span className="font-display font-black text-2xl tracking-tighter flex items-center">
                <span className="text-silver-gradient text-shine-sweep">Res</span>
                <span className="text-gold-sweep text-glow-gold">Q</span>
              </span>
            </div>
            <p className="text-sm text-white/50 leading-relaxed font-light max-w-sm tracking-wide">
              An agentic, energy-aware productivity companion built to combat cognitive overload, prioritize task stacks, and automate schedule blocks dynamically.
            </p>
            <div className="text-sm text-white/70 font-light space-y-1.5 pt-2">
              <p className="tracking-wider uppercase text-white/60 font-semibold text-sm font-tech">Built for Vibe2Ship Hackathon</p>
              <p>Coding Ninjas &times; Google for Developers</p>
            </div>
          </div>

          {/* Home Pages & Navigation (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <h4 className="text-sm font-tech font-bold uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
              <Compass className="w-4 h-4 text-white/45" /> Workspace
            </h4>
            <ul className="space-y-3.5 text-sm text-white/45 font-medium">
              <li>
                <a href="/dashboard?tab=dashboard" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Workspace Hub</span>
                </a>
              </li>
              <li>
                <a href="/dashboard?tab=tasks" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Priority Tasks</span>
                </a>
              </li>
              <li>
                <a href="/dashboard?tab=calendar" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Calendar Sync</span>
                </a>
              </li>
              <li>
                <a href="/dashboard?tab=goals" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Strategic Goals</span>
                </a>
              </li>
              <li>
                <a href="/dashboard?tab=habits" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Habit Streaks</span>
                </a>
              </li>
              <li>
                <a href="/dashboard?tab=focus" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Focus Session</span>
                </a>
              </li>
              <li>
                <a href="/dashboard?tab=voice" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Voice AI Assistant</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Docs & Resources (3 Cols) */}
          <div className="lg:col-span-3 space-y-6">
            <h4 className="text-sm font-tech font-bold uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
              <FileText className="w-4 h-4 text-white/45" /> Documentation
            </h4>
            <ul className="space-y-3.5 text-sm text-white/35 font-medium">
              <li>
                <a href="/docs#introduction" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Introduction</span>
                </a>
              </li>
              <li>
                <a href="/docs#getting-started" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Getting Started</span>
                </a>
              </li>
              <li>
                <a href="/docs#ai-assistant" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>AI Priority Engine</span>
                </a>
              </li>
              <li>
                <a href="/docs#voice-mode" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Voice AI Commands</span>
                </a>
              </li>
              <li>
                <a href="/docs#productivity-features" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Productivity Features</span>
                </a>
              </li>
              <li>
                <a href="/docs#faq" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Frequently Asked Questions</span>
                </a>
              </li>
              <li>
                <a href="/docs#privacy-security" className="flex items-center gap-1 group hover:text-white transition-all duration-300 hover:translate-x-1">
                  <ChevronRight className="w-3 h-3 opacity-0 -ml-3 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 text-[#E5B842]" />
                  <span>Privacy Safeguards</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Creator Credentials (4 Cols) */}
          <div className="lg:col-span-4 space-y-6 pl-0 lg:pl-8 border-t lg:border-t-0 lg:border-l border-white/5 pt-12 lg:pt-0">
            <h4 className="text-sm font-tech font-bold uppercase tracking-[0.2em] text-white/50 flex items-center gap-2">
              <User className="w-4 h-4 text-white/45" /> Creator Credentials
            </h4>
            <div className="space-y-4 text-sm text-white/50 font-light">
              <div className="flex items-start gap-3">
                <User className="w-4.5 h-4.5 text-white/70 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-white/85 text-[15px]">MD Faizaan Raza Khan</span>
                  <span className="block text-sm font-tech uppercase tracking-wider text-[#E5B842] mt-1">Lead Developer</span>
                </div>
              </div>
              <div className="flex items-start gap-3 pt-2">
                <MapPin className="w-4.5 h-4.5 text-white/70 shrink-0 mt-0.5" />
                <div className="leading-relaxed tracking-wide text-white/55">
                  <p>Hostel-NC-07, Room-Block-No 21</p>
                  <p>D/R: 2, GIET University</p>
                  <p>Gunupur, Odisha, India</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <Mail className="w-4.5 h-4.5 text-[#E5B842] shrink-0" />
                <a href="mailto:faizaan@giet.edu" className="text-sm text-white/70 tracking-wider hover:text-white transition-colors duration-300">
                  faizaan@giet.edu <span className="text-white/40 text-xs font-tech font-bold uppercase tracking-widest pl-1">(Developer Contact)</span>
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom copyright details */}
        <div className="pt-8 lg:pt-10 flex flex-col sm:flex-row items-center justify-between gap-4 lg:gap-6 text-sm text-white/60 font-light tracking-wider uppercase font-tech text-center">
          <p>&copy; {new Date().getFullYear()} ResQ AI. All rights reserved.</p>
          <div className="flex gap-6 lg:gap-8">
            <a href="/privacy.html" target="_blank" className="hover:text-white/50 transition-colors cursor-pointer duration-300 no-underline">Privacy Policy</a>
            <a href="/terms.html" target="_blank" className="hover:text-white/50 transition-colors cursor-pointer duration-300 no-underline">Terms of Operation</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
