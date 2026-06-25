/**
 * PremiumGuard.jsx
 * 
 * Wraps any component and conditionally renders a "locked" overlay
 * when the user does not have active premium access (trial or paid).
 * 
 * Usage:
 *   <PremiumGuard feature="voice_ai" onUpgrade={() => setCurrentTab('subscription')}>
 *     <VoiceAIPage />
 *   </PremiumGuard>
 */

import { Crown, Lock, Zap, Star } from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';

const FEATURE_LABELS = {
  voice_ai: { icon: '🎙️', title: 'AI Voice Conversations', desc: 'Talk to your AI assistant hands-free with natural voice commands.' },
  ai_chat: { icon: '🤖', title: 'Unlimited AI Chat', desc: 'Get unlimited AI responses, planning help, and smart recommendations.' },
  ai_summary: { icon: '📊', title: 'AI Summaries', desc: 'Let AI summarize your tasks, goals, and productivity insights.' },
  ai_planning: { icon: '🗺️', title: 'AI Goal Planning', desc: 'AI-powered timeline generation and task breakdown for your goals.' },
  advanced_analytics: { icon: '📈', title: 'Advanced Analytics', desc: 'Deep productivity insights and performance tracking.' },
  premium_dashboard: { icon: '✨', title: 'Premium Dashboard', desc: 'Access exclusive dashboard features and smart widgets.' },
  default: { icon: '🔒', title: 'Premium Feature', desc: 'This feature is available to premium subscribers.' }
};

export default function PremiumGuard({ feature = 'default', onUpgrade, children }) {
  const { isPremiumActive, user } = useAuthContext();

  if (isPremiumActive) {
    return children;
  }

  const featureInfo = FEATURE_LABELS[feature] || FEATURE_LABELS.default;
  const trialAvailable = !user?.trial_claimed;

  return (
    <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
      {/* Blurred preview of the actual content */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none opacity-30 blur-sm scale-95">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 py-10 max-w-md mx-auto">
        {/* Icon */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#E5B842]/20 to-[#E5B842]/5 border border-[#E5B842]/20 flex items-center justify-center text-4xl mb-0 shadow-lg shadow-[#E5B842]/10">
            {featureInfo.icon}
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-black border border-white/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-white/60" />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">
          {featureInfo.title}
        </h2>
        <p className="text-white/50 text-sm leading-relaxed mb-8">
          {featureInfo.desc}
        </p>

        {/* Plan badges */}
        <div className="flex items-center gap-2 mb-8 flex-wrap justify-center">
          {['Unlimited AI', 'Voice AI', 'Goal Planning', 'Priority Support'].map(badge => (
            <span
              key={badge}
              className="px-3 py-1 rounded-full text-xs font-bold bg-[#E5B842]/10 border border-[#E5B842]/20 text-[#E5B842]"
            >
              {badge}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3 w-full">
          {trialAvailable && (
            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#E5B842] to-[#F0C84A] text-black hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#E5B842]/20"
            >
              <Zap className="w-4 h-4" />
              Start 7-Day Free Trial
            </button>
          )}
          <button
            onClick={onUpgrade}
            className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm border transition-all hover:scale-[1.02] active:scale-[0.98] ${
              trialAvailable
                ? 'border-white/10 text-white/70 hover:border-white/20 hover:text-white bg-white/[0.03]'
                : 'bg-gradient-to-r from-[#E5B842] to-[#F0C84A] text-black hover:opacity-90 shadow-lg shadow-[#E5B842]/20 border-transparent'
            }`}
          >
            <Crown className="w-4 h-4" />
            {trialAvailable ? 'View Pricing Plans' : 'Upgrade to Premium'}
          </button>
        </div>

        {trialAvailable && (
          <p className="mt-4 text-xs text-white/30">
            No credit card required for the free trial
          </p>
        )}
      </div>
    </div>
  );
}
