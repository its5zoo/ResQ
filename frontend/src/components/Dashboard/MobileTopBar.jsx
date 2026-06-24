import { Menu, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const pageTitles = {
  dashboard: 'Dashboard',
  tasks: 'My Tasks',
  calendar: 'Calendar',
  goals: 'Goals',
  habits: 'Habits',
  voice: 'Voice AI',
  notifications: 'Notifications',
  settings: 'Settings',
};

export default function MobileTopBar({ currentTab, setCurrentTab, onMenuOpen }) {
  const navigate = useNavigate();
  const title = pageTitles[currentTab] || 'ResQ';

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 mobile-topbar-glass h-14 flex items-center justify-between px-4">
      {/* Brand */}
      <button
        onClick={() => navigate('/')}
        className="font-display font-black text-2xl tracking-tighter flex items-center cursor-pointer notranslate"
        style={{ minHeight: 'auto' }}
      >
        <span className="text-silver-gradient text-shine-sweep">Res</span>
        <span className="text-gold-sweep text-glow-gold">Q</span>
      </button>

      {/* Current Page Title */}
      <span className="absolute left-1/2 -translate-x-1/2 text-sm font-bold uppercase tracking-[0.2em] text-white/60 font-tech pointer-events-none">
        {title}
      </span>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentTab('notifications')}
          className="p-2.5 text-white/60 hover:text-white transition-colors relative"
          style={{ minHeight: 'auto' }}
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
        </button>
        <button
          onClick={onMenuOpen}
          className="p-2.5 text-white/60 hover:text-white transition-colors"
          style={{ minHeight: 'auto' }}
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
