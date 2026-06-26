import { 
  BookOpen, Rocket, LayoutDashboard, CheckSquare, Calendar, 
  Flame, Target, Bot, Mic, Bell, Zap, Brain, 
  Lightbulb, HelpCircle, AlertTriangle, Shield, ChevronRight
} from 'lucide-react';

const sections = [
  { id: 'introduction', label: 'Introduction', icon: BookOpen },
  { id: 'getting-started', label: 'Getting Started', icon: Rocket },
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'habits', label: 'Habits', icon: Flame },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'ai-assistant', label: 'AI Assistant', icon: Bot },
  { id: 'voice-mode', label: 'Voice Mode', icon: Mic },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'productivity-features', label: 'Productivity Features', icon: Zap },
  { id: 'ai-features', label: 'AI Features', icon: Brain },
  { id: 'best-practices', label: 'Best Practices', icon: Lightbulb },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'troubleshooting', label: 'Troubleshooting', icon: AlertTriangle },
  { id: 'privacy-security', label: 'Privacy & Security', icon: Shield },
];

export default function DocsSidebar({ activeSection, setActiveSection, closeMobileSidebar }) {
  const handleClick = (id) => {
    if (setActiveSection) {
      setActiveSection(id);
    }
    // Scroll window back to top when switching pages/sections
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (closeMobileSidebar) closeMobileSidebar();
  };

  return (
    <div className="w-full">
      {/* Docs Label */}
      <div className="mb-6 hidden lg:block">
        <p className="text-[10px] font-tech font-bold uppercase tracking-[0.25em] text-[#E5B842]/70 mb-1">Documentation</p>
        <h2 className="text-lg font-display font-black text-white/90">ResQ Docs</h2>
      </div>

      <nav className="space-y-0.5">
        {sections.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => handleClick(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left transition-all duration-200 group cursor-pointer
                ${isActive 
                  ? 'bg-[#E5B842]/10 text-[#E5B842] border border-[#E5B842]/20' 
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-[#E5B842]' : 'text-white/30 group-hover:text-white/60'}`} />
              <span className="flex-1 truncate">{label}</span>
              {isActive && <ChevronRight className="w-3 h-3 shrink-0 text-[#E5B842]/60" />}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-white/5 hidden lg:block">
        <p className="text-xs text-white/30 leading-relaxed">
          ResQ AI Productivity Assistant<br />
          <span className="text-[#E5B842]/50">v1.0 Documentation</span>
        </p>
      </div>
    </div>
  );
}
