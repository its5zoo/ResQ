import { useState } from 'react';
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
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext.jsx';
import LogoutModal from '../Shared/LogoutModal.jsx';

export default function Sidebar({ currentTab, setCurrentTab }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthContext();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'tasks', name: 'My Tasks', icon: <CheckSquare className="w-4 h-4" /> },
    { id: 'calendar', name: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { id: 'goals', name: 'Goals', icon: <Target className="w-4 h-4" /> },
    { id: 'habits', name: 'Habits', icon: <Flame className="w-4 h-4" /> },
    { id: 'voice', name: 'Voice AI', icon: <Mic className="w-4 h-4" /> },
    { id: 'notifications', name: 'Notifications', icon: <Bell className="w-4 h-4" /> },
  ];

  return (
    // Hidden on mobile/tablet — shown only on lg+ (1024px+)
    <aside className={`hidden lg:flex bg-black border-r border-white/5 flex-col justify-between h-screen sticky top-0 shrink-0 select-none transition-all duration-300 ${isSidebarOpen ? 'w-64 xl:w-64 2xl:w-72' : 'w-20'}`}>
      
      {/* Top Section */}
      <div>
        {/* Brand */}
        <div className={`p-5 xl:p-6 border-b border-white/5 flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center flex-col gap-4'}`}>
          <div 
            onClick={() => navigate('/')}
            className="cursor-pointer group flex items-center justify-center"
          >
            {isSidebarOpen ? (
              <span className="font-display font-black text-3xl xl:text-4xl tracking-tighter flex items-center">
                <span className="text-silver-gradient text-shine-sweep">Res</span>
                <span className="text-gold-sweep text-glow-gold">Q</span>
              </span>
            ) : (
              <span className="font-display font-black text-2xl tracking-tighter flex items-center">
                <span className="text-gold-sweep text-glow-gold">Q</span>
              </span>
            )}
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
            style={{ minHeight: 'auto' }}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        {/* Menu Nav */}
        <nav className="p-3 xl:p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                title={!isSidebarOpen ? item.name : undefined}
                style={{ minHeight: 'auto' }}
                className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all focus:outline-hidden cursor-pointer ${
                  isActive 
                    ? 'bg-white/[0.07] text-white shadow-sm' 
                    : 'text-white/60 hover:text-white hover:bg-white/[0.02]'
                } ${isSidebarOpen ? 'px-3' : 'justify-center px-0'}`}
              >
                <div className={`shrink-0 ${isActive ? 'text-[#E5B842]' : ''}`}>{item.icon}</div>
                {isSidebarOpen && <span className="truncate">{item.name}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className="p-3 xl:p-4 border-t border-white/5 space-y-3">

        {/* User Profile Info */}
        <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center flex-col gap-3'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {user?.picture ? (
              <img src={user.picture} alt="Profile" className="w-8 h-8 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-b from-white to-neutral-300 text-black flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                {user?.name ? user.name.substring(0, 2) : 'FK'}
              </div>
            )}
            {isSidebarOpen && (
              <div className="truncate min-w-0">
                <h5 className="text-sm font-bold text-white leading-none truncate">{user?.name || 'User'}</h5>
                <span className="text-xs text-white/50 leading-none font-sans truncate block mt-0.5">Developer Account</span>
              </div>
            )}
          </div>
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="text-white/70 hover:text-status-red transition-colors focus:outline-hidden cursor-pointer shrink-0"
            style={{ minHeight: 'auto' }}
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setCurrentTab('settings')}
          title={!isSidebarOpen ? "Settings" : undefined}
          style={{ minHeight: 'auto' }}
          className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-semibold uppercase tracking-wider transition-all focus:outline-hidden cursor-pointer ${
            currentTab === 'settings' 
              ? 'bg-white/[0.07] text-white' 
              : 'text-white/60 hover:text-white hover:bg-white/[0.02]'
          } ${isSidebarOpen ? 'px-3' : 'justify-center px-0'}`}
        >
          <div className={`shrink-0 ${currentTab === 'settings' ? 'text-[#E5B842]' : ''}`}><Settings className="w-4 h-4" /></div>
          {isSidebarOpen && <span>Settings</span>}
        </button>
      </div>

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={async () => {
          await logout();
          navigate('/');
        }}
      />
    </aside>
  );
}
