import { Smartphone, Bell, Flame, Award, Navigation, Fingerprint } from 'lucide-react';

export default function MobileSection() {
  return (
    <section id="mobile" className="pt-24 pb-40 lg:pt-28 lg:pb-48 bg-[#050505] bg-noise relative overflow-hidden border-t border-white/[0.03]">
      <div className="max-w-7xl mx-auto px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        
        {/* Left: CSS-Drawn Mobile mockup */}
        <div className="lg:col-span-5 flex justify-center">
          {/* Metallic Phone Outer Chassis */}
          <div className="relative w-[304px] h-[584px] bg-[#121214] rounded-[48px] p-[6px] ring-2 ring-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] hover:ring-white/25 transition-all duration-500 card-shine-sweep flex flex-col">
            {/* Inner Screen */}
            <div className="flex-grow bg-black rounded-[42px] overflow-hidden flex flex-col justify-between relative border border-white/5">
              {/* Camera notch */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5.5 bg-black border border-white/10 rounded-full z-30"></div>
 
              {/* Inner Content */}
              <div className="p-5 pt-11 flex-1 flex flex-col justify-between text-left">
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <span className="text-[10px] text-white/30 block">Good morning</span>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Faizaan Khan</h4>
                    </div>
                    <div className="relative">
                      <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-status-red animate-pulse"></span>
                      <Bell className="w-4 h-4 text-white/50" />
                    </div>
                  </div>
 
                  {/* AI Urgent Banner */}
                  <div className="p-4 bg-white/5 border border-white/10 rounded-2xl mb-6 space-y-1.5">
                    <span className="text-[8px] font-tech font-bold text-white/70 uppercase tracking-wider block font-display">AI Action Nudge</span>
                    <p className="text-[10px] text-white/60 leading-relaxed font-light">"2 deadlines approaching today. I have blocked a focus session for you at 4 PM."</p>
                  </div>
 
                  {/* Task Checklist Panel */}
                  <div className="space-y-3">
                    <span className="text-[8px] font-tech bg-white/5 border border-white/10 text-white/30 px-3 py-1 rounded-full font-bold uppercase tracking-widest inline-block mb-3">Today's Tasks</span>
                    <div className="p-3 bg-[#090909] rounded-xl border border-white/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-red"></span>
                        <span className="text-[10px] text-white/70">Submit Project Report</span>
                      </div>
                      <span className="text-[8px] bg-status-red/10 text-status-red px-2 py-0.5 rounded-full font-bold">2h</span>
                    </div>
                    <div className="p-3 bg-[#090909] rounded-xl border border-white/[0.04] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-status-blue"></span>
                        <span className="text-[10px] text-white/70">Design UI Assets</span>
                      </div>
                      <span className="text-[8px] bg-status-blue/10 text-status-blue px-2 py-0.5 rounded-full font-bold">4 PM</span>
                    </div>
                  </div>
                </div>
 
                {/* Bottom widget habit and Nav */}
                <div>
                  {/* Habit check */}
                  <div className="p-4 bg-[#090909] rounded-2xl border border-white/[0.04] flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <Flame className="w-4.5 h-4.5 text-white animate-pulse" />
                      <div>
                        <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Gym Workout</span>
                        <span className="text-[8px] text-white/30 block">🔥 7 Days Streak</span>
                      </div>
                    </div>
                    <span className="text-[8px] bg-white/5 border border-white/10 text-white px-2 py-0.5 rounded-full font-bold">DONE</span>
                  </div>
 
                  {/* Bottom Navigation mock */}
                  <div className="border-t border-white/5 pt-4 flex items-center justify-around text-white/20 text-[9px] font-bold uppercase tracking-wider">
                    <span className="text-white">Home</span>
                    <span>Tasks</span>
                    <span>Voice</span>
                    <span>Goals</span>
                  </div>
                </div>
 
              </div>
            </div>
          </div>
        </div>
 
        {/* Right: Feature grids & Download Badges */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <span className="text-xs font-tech font-bold tracking-[0.3em] uppercase text-white/50 block mb-3 font-sans">
            COMPANION APP
          </span>
          <h2 className="text-4xl sm:text-5xl font-display font-black text-silver-gradient text-shine-sweep mb-5 leading-tight tracking-tight">
            The deadline guardian <br />
            in your pocket.
          </h2>
          <p className="text-sm sm:text-base text-white/50 leading-relaxed font-normal mb-6 tracking-normal max-w-xl font-sans">
            Experience real-time sync with Google Calendar API, hands-free voice engine processing, and critical push notifications directly on Android and iOS devices.
          </p>

          {/* Premium App Download Badges */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Apple App Store */}
            <a 
              href="#app-store"
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black border border-white/10 hover:border-white/30 hover:bg-white/[0.03] transition-all duration-300 group cursor-pointer"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.26-.58 2.95-1.39z"/>
              </svg>
              <div className="text-left font-sans">
                <span className="block text-[8px] uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors leading-none mb-0.5">Download on the</span>
                <span className="block text-xs font-semibold text-white leading-tight">App Store</span>
              </div>
            </a>

            {/* Google Play Store */}
            <a 
              href="#play-store"
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-black border border-white/10 hover:border-white/30 hover:bg-white/[0.03] transition-all duration-300 group cursor-pointer"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 3.66c-.29.3-.43.7-.43 1.22v14.24c0 .52.14.92.43 1.22l.08.08L14.47 11.9v-.3L5.08 3.58 5 3.66z M18.42 8.35L15.02 11.75v.5l3.4 3.4.08-.05 4.04-2.29c1.15-.65 1.15-1.72 0-2.37l-4.04-2.29-.08-.39z M15.02 12L5.08 21.94c.3.31.81.35 1.39.02l12.69-7.2L15.02 12z M15.02 12l4.09-2.72-12.69-7.2c-.58-.33-1.09-.29-1.39.02L15.02 12z"/>
              </svg>
              <div className="text-left font-sans">
                <span className="block text-[8px] uppercase tracking-widest text-white/40 group-hover:text-white/60 transition-colors leading-none mb-0.5">Get it on</span>
                <span className="block text-xs font-semibold text-white leading-tight">Google Play</span>
              </div>
            </a>
          </div>
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-sans">
            <div className="p-5 rounded-2xl border border-white/[0.04] bg-[#090909] hover:border-white/10 transition-colors duration-300 layered-shadow-lg">
              <Fingerprint className="w-6 h-6 text-white/60 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1.5 uppercase tracking-wider">Biometric Auth</h4>
              <p className="text-sm text-white/50 leading-relaxed font-normal">Lock down your priorities with secure biometric or single-tap Google OAuth login.</p>
            </div>
            <div className="p-5 rounded-2xl border border-white/[0.04] bg-[#090909] hover:border-white/10 transition-colors duration-300 layered-shadow-lg">
              <Navigation className="w-6 h-6 text-white/60 mb-3" />
              <h4 className="text-sm font-bold text-white mb-1.5 uppercase tracking-wider">Location Alert</h4>
              <p className="text-sm text-white/50 leading-relaxed font-normal">Proactive GPS checking prompts you when you arrive near scheduled task locations.</p>
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
