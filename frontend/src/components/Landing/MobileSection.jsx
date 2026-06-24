import { Smartphone, Bell, Flame, Award, Inbox, TrendingUp, AlertTriangle, Sparkles, Calendar, CheckSquare, Target, MoreHorizontal, LayoutGrid, Zap } from 'lucide-react';

export default function MobileSection() {
  return (
    <section id="mobile" className="pt-16 pb-24 lg:pt-28 lg:pb-48 bg-[#050505] bg-noise relative overflow-hidden border-t border-white/[0.03]">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        
        {/* Left: CSS-Drawn Mobile mockup */}
        <div className="lg:col-span-5 flex justify-center">
          {/* Metallic Phone Outer Chassis */}
          <div className="relative w-[320px] h-[650px] bg-[#121214] rounded-[48px] p-[6px] ring-2 ring-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] hover:ring-white/25 transition-all duration-500 card-shine-sweep flex flex-col">
            {/* Inner Screen */}
            <div className="flex-grow bg-[#F9FAFB] rounded-[42px] overflow-hidden flex flex-col relative border border-black/10">
              {/* Camera notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30"></div>
 
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 pt-12 flex flex-col gap-4 text-left custom-scrollbar pb-6">
                {/* Greeting */}
                <div>
                  <span className="text-[10px] font-tech font-bold text-slate-500 uppercase tracking-widest block mb-1">Workspace Hub</span>
                  <h2 className="text-xl font-display font-black text-slate-900 leading-tight tracking-tight">
                    Welcome back! Here's your status.
                  </h2>
                </div>

                {/* 2x2 Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Card 1 */}
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Tasks Today</span>
                      <Inbox className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl font-black text-slate-900 mb-3">2 Pending</div>
                    <div className="text-[10px] font-bold text-[#E5B842] uppercase">View all tasks ?</div>
                  </div>

                  {/* Card 2 */}
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Completion Rate</span>
                      <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl font-black text-slate-900 mb-3">33%</div>
                    <div className="text-[10px] font-bold text-slate-600">Keep going! ??</div>
                  </div>

                  {/* Card 3 */}
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Deadline Risk</span>
                      <AlertTriangle className="w-3 h-3 text-[#E5B842]" />
                    </div>
                    <div className="text-lg font-black text-slate-900 mb-3">MODERATE</div>
                    <div className="text-[10px] font-bold text-[#E5B842] uppercase">Review now ?</div>
                  </div>

                  {/* Card 4 */}
                  <div className="bg-white rounded-2xl p-3.5 border border-slate-200/60 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-800">Habit Streak</span>
                      <Flame className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="text-xl font-black text-slate-900 mb-3">2 Days</div>
                    <div className="text-[10px] font-bold text-slate-600">Keep it up! ??</div>
                  </div>
                </div>

                {/* AI Priority Advisor */}
                <div className="bg-white rounded-3xl p-4 border border-slate-200/60 shadow-sm mt-1">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#E5B842]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900">AI Priority Advisor</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-600 font-medium mb-4">
                    "MD Faizaan Raza Khan, you have an overdue task to bring vegetables and a pending meeting today that must be your top priority. Please also ensure you complete your walking and gym habit to stay on track."
                  </p>
                  <button className="w-full bg-[#E5B842] text-black font-bold text-[11px] uppercase tracking-widest py-3 rounded-xl flex items-center justify-center gap-2">
                    <Calendar className="w-3.5 h-3.5" /> Open Calendar
                  </button>
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="bg-white border-t border-slate-200/60 pt-3 pb-6 px-4 flex items-center justify-between shrink-0">
                <div className="flex flex-col items-center gap-1">
                  <LayoutGrid className="w-5 h-5 text-[#E5B842]" />
                  <span className="text-[9px] font-bold text-slate-600 uppercase">Home</span>
                  <div className="w-1 h-1 rounded-full bg-[#E5B842]"></div>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                  <CheckSquare className="w-5 h-5 text-slate-500" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Tasks</span>
                  <div className="w-1 h-1 rounded-full bg-transparent"></div>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                  <Calendar className="w-5 h-5 text-slate-500" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Calendar</span>
                  <div className="w-1 h-1 rounded-full bg-transparent"></div>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                  <Target className="w-5 h-5 text-slate-500" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Goals</span>
                  <div className="w-1 h-1 rounded-full bg-transparent"></div>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                  <Flame className="w-5 h-5 text-slate-500" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase">Habits</span>
                  <div className="w-1 h-1 rounded-full bg-transparent"></div>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                  <MoreHorizontal className="w-5 h-5 text-slate-500" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase">More</span>
                  <div className="w-1 h-1 rounded-full bg-transparent"></div>
                </div>
              </div>

            </div>
          </div>
        </div>
 
        {/* Right: Feature grids & Download Badges */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <span className="text-sm font-tech font-bold tracking-[0.3em] uppercase text-white/50 block mb-3 font-sans">
            COMPANION APP
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-silver-gradient text-shine-sweep mb-5 leading-tight tracking-tight">
            The deadline guardian <br />
            in your pocket.
          </h2>
          <p className="text-sm sm:text-sm text-white/50 leading-relaxed font-normal mb-6 tracking-normal max-w-xl font-sans">
            Experience real-time sync with Google Calendar API, hands-free voice engine processing, and critical push notifications directly on Android and iOS devices.
          </p>

          {/* Mobile Browser Access Showcase */}
          <div className="flex mb-8">
            <div className="flex items-center justify-center gap-3 px-6 py-3.5 rounded-2xl bg-[#E5B842] shadow-[0_0_20px_rgba(229,184,66,0.2)] cursor-default select-none">
              <Smartphone className="w-5 h-5 text-black" />
              <span className="font-bold text-black uppercase tracking-widest text-sm">Experience it in mobile browser</span>
            </div>
          </div>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
            <div className="p-5 rounded-2xl border border-white/[0.04] bg-[#090909] hover:border-white/10 transition-colors duration-300 layered-shadow-lg">
              <Bell className="w-6 h-6 text-[#E5B842] mb-3" />
              <h4 className="text-sm font-bold text-white mb-1.5 uppercase tracking-wider">Easy Carry Notifications</h4>
              <p className="text-sm text-white/50 leading-relaxed font-normal">Get instant alerts and reminders directly to your mobile browser without installing heavy apps.</p>
            </div>
            <div className="p-5 rounded-2xl border border-white/[0.04] bg-[#090909] hover:border-white/10 transition-colors duration-300 layered-shadow-lg">
              <Zap className="w-6 h-6 text-[#E5B842] mb-3" />
              <h4 className="text-sm font-bold text-white mb-1.5 uppercase tracking-wider">Less Handling</h4>
              <p className="text-sm text-white/50 leading-relaxed font-normal">Experience full native-like capabilities with zero installation friction and less overhead.</p>
            </div>
            <div className="p-5 rounded-2xl border border-white/[0.04] bg-[#090909] hover:border-white/10 transition-colors duration-300 layered-shadow-lg">
              <Award className="w-6 h-6 text-white/60 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1.5 uppercase tracking-wider">Streaks Row</h4>
              <p className="text-sm text-white/50 leading-relaxed font-normal">Keep momentum with habit rings, achievement notifications, and weekly breakdowns.</p>
            </div>
            <div className="p-5 rounded-2xl border border-white/[0.04] bg-[#090909] hover:border-white/10 transition-colors duration-300 layered-shadow-lg">
              <Smartphone className="w-6 h-6 text-white/60 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1.5 uppercase tracking-wider">Home Widget</h4>
              <p className="text-sm text-white/50 leading-relaxed font-normal">Display current AI recommendations and deadline hazard meters on your home screen.</p>
            </div>
          </div>
        </div>
 
      </div>
    </section>
  );
}
