import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Shield, Calendar } from 'lucide-react';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-24 lg:py-40 relative overflow-hidden bg-[#050505] bg-noise border-t border-white/[0.03]">
      
      {/* Background radial spotlights */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#E5B842]/[0.06] rounded-full blur-[140px] animate-ambient-glow"></div>
        <div className="absolute top-0 left-1/4 w-[300px] h-[300px] bg-[#E5B842]/[0.03] rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-white/[0.02] rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-10 relative z-10 text-center flex flex-col items-center">
        
        {/* Eyebrow badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#E5B842]/20 bg-[#E5B842]/5 mb-8">
          <Zap className="w-3.5 h-3.5 text-[#E5B842]" />
          <span className="text-xs font-tech font-bold tracking-[0.25em] text-[#E5B842] uppercase">Setup in under 60 seconds</span>
        </div>

        {/* Title */}
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-display font-black leading-[1.0] text-silver-gradient text-shine-sweep mb-6 sm:mb-8 max-w-3xl tracking-tight">
          Stop reacting<br />to chaos.
        </h2>
        <h2 className="text-4xl sm:text-6xl md:text-7xl font-display font-black leading-[1.0] mb-6 sm:mb-10 max-w-3xl tracking-tight">
          Start{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] via-[#FFF2CC] to-[#B8860B] text-glow-gold font-extrabold italic">
            commanding
          </span>{' '}
          <span className="text-silver-gradient text-shine-sweep">your time.</span>
        </h2>

        <p className="text-sm sm:text-base text-white/45 leading-relaxed max-w-lg font-normal mb-10 lg:mb-14 tracking-normal font-sans px-4">
          Sync your Google Calendar, build habits that stick, and let your AI companion protect every focus hour — automatically.
        </p>

        {/* Trust chips */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-12 text-white/35">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            <span className="text-xs font-tech uppercase tracking-widest">No credit card</span>
          </div>
          <span className="hidden sm:block w-px h-3 bg-white/10"></span>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs font-tech uppercase tracking-widest">Google Workspace sync</span>
          </div>
          <span className="hidden sm:block w-px h-3 bg-white/10"></span>
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            <span className="text-xs font-tech uppercase tracking-widest">AI-powered</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button 
            onClick={() => navigate('/auth')}
            className="group relative w-full sm:w-auto px-10 py-4 rounded-2xl text-sm font-bold tracking-widest uppercase bg-[#E5B842] text-black hover:bg-[#FFF2CC] shadow-[0_0_40px_rgba(229,184,66,0.25)] hover:shadow-[0_0_60px_rgba(229,184,66,0.45)] transition-all duration-500 hover:-translate-y-1 active:translate-y-0 flex items-center justify-center gap-3 cursor-pointer font-tech active:scale-[0.98] overflow-hidden"
          >
            {/* Shine sweep on button */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></span>
            <span className="relative z-10">Sign in with Google Workspace</span>
            <ArrowRight className="relative z-10 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>

          <button
            onClick={() => navigate('/auth')}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl text-sm font-bold tracking-wider uppercase bg-transparent text-white/60 border border-white/10 hover:border-white/25 hover:text-white transition-all duration-300 cursor-pointer font-tech html-light-btn-white"
          >
            Learn more
          </button>
        </div>

      </div>
    </section>
  );
}
