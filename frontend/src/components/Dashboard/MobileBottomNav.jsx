import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Target, 
  Flame,
  MoreHorizontal
} from 'lucide-react';

const primaryTabs = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: Calendar },
  { id: 'goals', label: 'Goals', icon: Target },
  { id: 'habits', label: 'Habits', icon: Flame },
];

export default function MobileBottomNav({ currentTab, setCurrentTab, onMoreOpen }) {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 mobile-nav-glass pb-safe">
      <div className="flex items-center justify-around h-16 px-2">
        {primaryTabs.map(({ id, label, icon: Icon }) => {
          const active = currentTab === id;
          return (
            <button
              key={id}
              onClick={() => setCurrentTab(id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 cursor-pointer group"
              style={{ minHeight: 'auto' }}
              aria-label={label}
            >
              <Icon
                className={`w-5 h-5 transition-all duration-200 ${
                  active
                    ? 'text-[#E5B842] scale-110'
                    : 'text-white/40 group-hover:text-white/70'
                }`}
              />
              <span
                className={`text-[10px] font-bold uppercase tracking-wider transition-all duration-200 leading-none ${
                  active ? 'text-[#E5B842]' : 'text-white/35 group-hover:text-white/60'
                }`}
              >
                {label}
              </span>
              {active && <span className="mobile-nav-active-dot" />}
            </button>
          );
        })}

        {/* More button */}
        <button
          onClick={onMoreOpen}
          className="relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-all duration-200 cursor-pointer group"
          style={{ minHeight: 'auto' }}
          aria-label="More options"
        >
          <MoreHorizontal className="w-5 h-5 text-white/40 group-hover:text-white/70 transition-colors duration-200" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-white/35 group-hover:text-white/60 leading-none transition-colors duration-200">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
