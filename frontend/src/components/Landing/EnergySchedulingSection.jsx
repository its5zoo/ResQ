import { Hourglass, Zap, Clock } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8AM to 7PM
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TASK_TYPES = ['creative', 'technical', 'communication', 'administrative'];

// Simulated energy data: efficiency ratio (lower = better/faster)
const energyData = {
  creative:       [0.2, 0.1, 0.15, 0.3, 0.8, 1.4, 1.6, 1.8, 1.5, 1.6, 1.3, 1.5], // peak 8-10AM Mon-Wed
  technical:      [0.3, 0.25, 0.2, 0.4, 1.2, 0.9, 1.1, 0.8, 0.7, 1.4, 1.3, 1.2], // peak 8-11AM
  communication:  [1.2, 1.1, 0.4, 0.3, 0.2, 0.25, 0.3, 0.5, 0.9, 1.1, 1.4, 1.2], // peak 11AM-1PM
  administrative: [1.5, 1.4, 1.2, 1.0, 0.5, 0.3, 0.25, 0.3, 0.5, 0.4, 0.6, 0.8], // peak 1-4PM
};

function cellColor(ratio) {
  if (ratio <= 0.3) return 'bg-[#E5B842]'; // peak — amber
  if (ratio <= 0.6) return 'bg-[#E5B842]/50';
  if (ratio <= 1.0) return 'bg-white/10';
  if (ratio <= 1.3) return 'bg-white/[0.04]';
  return 'bg-red-900/20'; // dead zone
}

function cellLabel(ratio) {
  if (ratio <= 0.3) return 'Peak zone';
  if (ratio <= 0.6) return 'High energy';
  if (ratio <= 1.0) return 'Neutral';
  if (ratio <= 1.3) return 'Below average';
  return 'Dead zone';
}

function EnergyHeatmapAnimation() {
  const [activeType, setActiveType] = useState('creative');
  const [hoveredCell, setHoveredCell] = useState(null);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveType(prev => {
        const idx = TASK_TYPES.indexOf(prev);
        return TASK_TYPES[(idx + 1) % TASK_TYPES.length];
      });
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const data = energyData[activeType];
  const hourRatios = HOURS.map((_, i) => data[i] ?? 1.0);

  const typeColors = {
    creative: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    technical: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    communication: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    administrative: 'text-[#E5B842] bg-[#E5B842]/10 border-[#E5B842]/20',
  };

  return (
    <div className="w-full bg-[#070709] rounded-2xl font-sans select-none p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] font-tech text-white/40 uppercase tracking-widest mb-0.5">Energy Map</p>
          <p className="text-sm font-bold text-white">Your Peak Performance Windows</p>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-tech font-bold uppercase tracking-widest transition-all duration-300 ${typeColors[activeType]}`}>
          <span>{activeType}</span>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {TASK_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-2.5 py-1 rounded-lg text-[9px] font-tech font-bold uppercase tracking-widest border transition-all duration-300 cursor-pointer ${
              activeType === type ? typeColors[type] : 'bg-white/[0.02] border-white/5 text-white/30 hover:text-white/60'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[340px]">
          {/* Hour labels */}
          <div className="grid gap-0.5 mb-0.5" style={{ gridTemplateColumns: `28px repeat(12, 1fr)` }}>
            <div></div>
            {HOURS.map(h => (
              <div key={h} className="text-center text-[8px] font-tech text-white/30">
                {h > 12 ? `${h-12}p` : `${h}a`}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {DAYS.map((day, di) => (
            <div key={day} className="grid gap-0.5 mb-0.5" style={{ gridTemplateColumns: `28px repeat(12, 1fr)` }}>
              <div className="text-[8px] font-tech text-white/30 flex items-center">{day}</div>
              {HOURS.map((h, hi) => {
                const ratio = hourRatios[hi];
                const cellKey = `${di}-${hi}`;
                return (
                  <div
                    key={h}
                    className={`h-5 rounded-sm transition-all duration-500 cursor-default relative ${cellColor(ratio)} ${hoveredCell === cellKey ? 'ring-1 ring-white/30' : ''}`}
                    onMouseEnter={() => setHoveredCell(cellKey)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {hoveredCell === cellKey && (
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#1a1a1f] border border-white/10 rounded px-2 py-1 z-10 whitespace-nowrap pointer-events-none">
                        <p className="text-[9px] font-tech text-white/70">{day} {h}:00 — {cellLabel(ratio)}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-[#E5B842]"></div>
          <span className="text-[9px] font-tech text-white/40">Peak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-white/10"></div>
          <span className="text-[9px] font-tech text-white/40">Neutral</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-900/20"></div>
          <span className="text-[9px] font-tech text-white/40">Dead zone</span>
        </div>
      </div>
    </div>
  );
}

export default function EnergySchedulingSection() {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.energy-text', {
        y: 40,
        opacity: 0,
        duration: 1,
        stagger: 0.1,
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 80%',
        }
      });

      gsap.from('.energy-img', {
        scale: 0.95,
        opacity: 0,
        y: 30,
        duration: 1.2,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top 70%',
        }
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={containerRef} className="py-16 lg:py-32 relative z-10 overflow-hidden bg-[#050505] border-b border-white/[0.02]">
      <div className="absolute top-0 right-1/4 w-[700px] h-[700px] bg-[#E5B842]/[0.04] rounded-full blur-[120px] pointer-events-none -translate-y-1/2"></div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* Left: Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 energy-text">
              <Hourglass className="w-4 h-4 text-[#E5B842]" />
              <span className="text-sm font-bold uppercase tracking-widest text-[#E5B842]">Energy-Aware Scheduling</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-display font-black text-white leading-[1.1] energy-text">
              Schedule smarter,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] to-[#FCEABB]">
                not just earlier.
              </span>
            </h2>

            <p className="text-lg text-white/50 font-light leading-relaxed energy-text max-w-xl">
              ResQ passively tracks <em>when</em> you complete different types of tasks and how long they actually take vs. estimated. Over time it builds your personal <strong className="text-white/80">Energy Map</strong> — placing creative work in your peak windows, admin in your valleys.
            </p>

            <div className="space-y-6 pt-4 energy-text">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 flex items-center justify-center shrink-0 mt-1">
                  <Clock className="w-4 h-4 text-white/60" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Passive Data Collection</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    Zero setup. Every task completion records hour, day, actual vs. estimated time. You never have to rate your energy.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0 mt-1">
                  <Zap className="w-4 h-4 text-[#E5B842]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Auto-Scheduler Integration</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    When auto-scheduling tasks, peak windows score +30 priority. Dead zones score -50. The right task, in the right moment.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center shrink-0 mt-1">
                  <Hourglass className="w-4 h-4 text-[#E5B842]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">7×12 Energy Heatmap</h4>
                  <p className="text-sm text-white/70 leading-relaxed mt-1">
                    View your personal performance map by day and hour. Hover any cell to see your efficiency score for that window.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Animation */}
          <div className="relative energy-img">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#E5B842]/20 to-transparent rounded-3xl blur-2xl opacity-30"></div>
            <div className="relative rounded-3xl border border-white/10 bg-black/50 overflow-hidden shadow-2xl backdrop-blur-sm p-2">
              <div className="rounded-2xl overflow-hidden border border-white/[0.05] relative bg-[#050505]">
                <EnergyHeatmapAnimation />
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 bg-[#0B0B0B] border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-4 animate-bounce-slow">
              <div className="w-10 h-10 rounded-full bg-[#E5B842]/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#E5B842]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#E5B842] uppercase tracking-widest mb-0.5">Peak Hour</p>
                <p className="text-sm font-semibold text-white/80">40% faster work</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
