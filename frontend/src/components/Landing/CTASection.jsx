import { useNavigate } from 'react-router-dom';

export default function CTASection() {
  const navigate = useNavigate();

  return (
    <section className="py-20 lg:py-44 relative overflow-hidden bg-[#050505] bg-noise border-t border-white/[0.03]">
      
      {/* Background radial spotlight */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#E5B842]/5 rounded-full blur-[130px] animate-ambient-glow"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 lg:px-10 relative z-10 text-center flex flex-col items-center">
        {/* Title */}
        <h2 className="text-3xl sm:text-5xl md:text-7xl font-display font-black leading-[1.0] text-silver-gradient text-shine-sweep mb-6 sm:mb-8 max-w-3xl tracking-tight">
          Stop reacting to chaos. <br />
          Start <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] via-[#FFF2CC] to-[#B8860B] text-glow-gold font-extrabold italic">commanding</span> your time.
        </h2>

        <p className="text-sm text-white/50 leading-relaxed max-w-xl font-normal mb-10 lg:mb-16 tracking-normal font-sans px-4">
          Sync your Google Calendar, connect your habits, and let your agentic companion protect your focus hours. Setup takes less than 60 seconds.
        </p>

        {/* Action Button */}
        <button 
          onClick={() => navigate('/auth')}
          className="w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold tracking-wider uppercase bg-transparent text-white border border-[#E5B842] hover:bg-[#E5B842] hover:text-black shadow-lg shadow-[#E5B842]/10 hover:shadow-[#E5B842]/30 transition-all duration-500 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 cursor-pointer font-tech active:scale-[0.98]"
        >
          Sign in with Google Workspace &rarr;
        </button>

      </div>
    </section>
  );
}
