import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Target, 
  Flame, 
  Mic, 
  Settings, 
  Bell, 
  LogOut, 
  Shield 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext.jsx';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const navigate = useNavigate();
  const { logout } = useAuthContext();

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'tasks', name: 'My Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'calendar', name: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'goals', name: 'Goals', icon: <Target className="w-4 h-4" /> },
    { id: 'habits', name: 'Habits', icon: <Flame className="w-4 h-4" /> },
    { id: 'voice', name: 'Voice AI', icon: <Mic className="w-4 h-4" /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'settings', name: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-64 bg-black border-r border-white/5 flex flex-col justify-between h-screen sticky top-0 shrink-0 select-none">
      
      {/* Top Section */}
      <div>
         {/* Brand */}
        <div 
          onClick={() => navigate('/')}
          className="p-6 border-b border-white/5 flex items-center cursor-pointer group"
        >
          <span className="font-display font-black text-4xl tracking-tighter flex items-center">
            <span className="text-silver-gradient text-shine-sweep">Res</span>
            <span className="text-gold-sweep text-glow-gold">Q</span>
          </span>
        </div>

        {/* Menu Nav */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold uppercase tracking-wider transition-all focus:outline-hidden cursor-pointer ${
                  isActive 
                    ? 'bg-white/[0.07] text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/[0.02]'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-white/5 space-y-4">
        {/* AI Status */}
        <div className="flex items-center justify-between p-3.5 bg-[#0a0a0a] border border-white/5 rounded-xl">
          <div>
            <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider block mb-0.5">AI Companion</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#E5B842] uppercase tracking-wider">Active</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#E5B842] shadow-[0_0_8px_rgba(229,184,66,0.8)]"></span>
            </div>
          </div>
          <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider">V1.0</span>
        </div>

        {/* User Profile Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-b from-white to-neutral-300 text-black flex items-center justify-center font-bold text-sm">
              FK
            </div>
            <div>
              <h5 className="text-sm font-bold text-white leading-none">Faizaan Khan</h5>
              <span className="text-xs text-white/40 leading-none font-sans">Developer Account</span>
            </div>
          </div>
          <button 
            onClick={async () => {
              await logout();
              navigate('/');
            }}
            className="text-white/40 hover:text-status-red transition-colors focus:outline-hidden cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
}

