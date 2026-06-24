import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CustomDatePicker({ value, onChange, placeholder = "Select target date" }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  // Parse current value (YYYY-MM-DD) or default to today
  const selectedDate = value ? new Date(value + 'T00:00:00') : new Date();
  
  // We keep track of the month/year currently viewed in the picker
  // Derive from prop to avoid setState-in-effect cascading render warnings
  const derivedViewDate = value ? new Date(value + 'T00:00:00') : selectedDate;
  const [currentViewDate, setCurrentViewDate] = useState(derivedViewDate);

  // Keep view in sync with external value changes
  const [prevValue, setPrevValue] = useState(value);
  if (prevValue !== value && value) {
    setPrevValue(value);
    setCurrentViewDate(new Date(value + 'T00:00:00'));
  }

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth(); // 0-11

  // Days in month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // First day of month (0 = Sunday, 1 = Monday, etc.)
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Prev month days to fill starting gap
  const prevMonthDays = new Date(year, month, 0).getDate();

  const monthsList = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentViewDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (e, day) => {
    e.preventDefault();
    e.stopPropagation();
    const newDate = new Date(year, month, day);
    // Format as YYYY-MM-DD locally without timezone shift
    const yyyy = newDate.getFullYear();
    const mm = String(newDate.getMonth() + 1).padStart(2, '0');
    const dd = String(newDate.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Generate calendar days
  const calendarCells = [];

  // Add empty/prev month cells for padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = prevMonthDays - i;
    calendarCells.push({
      day: prevDay,
      isCurrentMonth: false,
      dateObject: new Date(year, month - 1, prevDay)
    });
  }

  // Add current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      day: d,
      isCurrentMonth: true,
      dateObject: new Date(year, month, d)
    });
  }

  // Next month cells to fill grid (6 rows * 7 days = 42 cells)
  const remainingCells = 42 - calendarCells.length;
  for (let n = 1; n <= remainingCells; n++) {
    calendarCells.push({
      day: n,
      isCurrentMonth: false,
      dateObject: new Date(year, month + 1, n)
    });
  }

  // Format selection for display (e.g. "Jul 23, 2026")
  const formatDisplayDate = (val) => {
    if (!val) return placeholder;
    const d = new Date(val + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Input/Button */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0B0B0B] border border-white/10 hover:border-white/20 focus:border-[#E5B842]/40 rounded-xl px-4 py-3 text-xs text-white placeholder-white/30 cursor-pointer flex items-center justify-between transition-all duration-300 select-none group"
      >
        <span className={value ? "text-white" : "text-white/30"}>
          {formatDisplayDate(value)}
        </span>
        <Calendar className="w-4 h-4 text-white/45 group-hover:text-[#E5B842] transition-colors" />
      </div>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 md:left-0 top-full mt-2 w-[280px] bg-[#09090b]/98 border border-white/10 rounded-2xl p-4 shadow-2xl z-50 font-sans backdrop-blur-xl animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button 
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-white/5 rounded-lg text-white/50 hover:text-[#E5B842] transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-xs font-bold text-white tracking-wider font-display">
              {monthsList[month]} {year}
            </span>

            <button 
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-white/5 rounded-lg text-white/50 hover:text-[#E5B842] transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
              <span key={dayName} className="text-[9px] text-white/30 font-bold uppercase tracking-wider">
                {dayName}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell, idx) => {
              const isSelected = value && 
                selectedDate.getFullYear() === cell.dateObject.getFullYear() &&
                selectedDate.getMonth() === cell.dateObject.getMonth() &&
                selectedDate.getDate() === cell.dateObject.getDate();

              const isToday = (() => {
                const today = new Date();
                return today.getFullYear() === cell.dateObject.getFullYear() &&
                       today.getMonth() === cell.dateObject.getMonth() &&
                       today.getDate() === cell.dateObject.getDate();
              })();

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => cell.isCurrentMonth && handleDayClick(e, cell.day)}
                  disabled={!cell.isCurrentMonth}
                  className={`aspect-square text-[10px] rounded-lg flex items-center justify-center font-semibold transition-all select-none cursor-pointer ${
                    !cell.isCurrentMonth
                      ? 'text-white/10 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#E5B842] text-black font-bold shadow-[0_0_12px_rgba(229,184,66,0.4)] hover:bg-[#E5B842]'
                      : isToday
                      ? 'border border-[#E5B842]/40 text-[#E5B842] hover:bg-[#E5B842]/10'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
