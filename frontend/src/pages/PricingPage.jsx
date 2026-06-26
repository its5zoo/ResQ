import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { subscription as subscriptionApi } from '../services/api';
import {
  Check, X, Crown, Zap, Star, Shield, ArrowLeft,
  Mic, BarChart3, Brain, Clock, MessageSquare,
  Target, Infinity as InfinityIcon, Phone, Mail, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';

// ── Plan definitions ──────────────────────────────────────────────────────────
const PLANS = {
  free: {
    name: 'Free',
    price: '₹0',
    period: '',
    color: 'from-white/5 to-white/[0.02]',
    border: 'border-white/10',
    badge: null,
    features: [
      { label: '5 AI Chat messages/day', included: true },
      { label: '2 AI Summaries/day', included: true },
      { label: 'Manual Task & Goal Management', included: true },
      { label: 'Basic Productivity Tools', included: true },
      { label: 'AI Voice Conversations', included: false },
      { label: 'Unlimited AI Chat', included: false },
      { label: 'AI Goal Planning', included: false },
      { label: 'Advanced Analytics', included: false },
    ]
  },
  monthly: {
    name: 'Monthly',
    price: '₹299',
    period: '/month',
    color: 'from-white/[0.07] to-white/[0.02]',
    border: 'border-white/15',
    badge: null,
    features: [
      { label: 'Unlimited AI Chat', included: true },
      { label: 'Unlimited AI Summaries', included: true },
      { label: 'AI Voice Conversations', included: true },
      { label: 'AI Goal Planning & Timeline', included: true },
      { label: 'AI Task Breakdown', included: true },
      { label: 'Advanced Analytics', included: true },
      { label: 'Unlimited Tasks & Goals', included: true },
      { label: 'Priority AI Processing', included: true },
    ]
  },
  yearly: {
    name: 'Yearly',
    price: '₹2869',
    period: '/year',
    originalPrice: '₹3588',
    saving: 'Save ₹719/year',
    color: 'from-[#E5B842]/10 to-[#E5B842]/[0.02]',
    border: 'border-[#E5B842]/30',
    badge: '🔥 MOST POPULAR',
    features: [
      { label: 'Everything in Monthly', included: true },
      { label: '20% Annual Discount', included: true },
      { label: 'Save ₹719 Every Year', included: true },
      { label: 'Priority Customer Support', included: true },
      { label: 'Early Access to New Features', included: true },
      { label: 'Unlimited Everything', included: true },
      { label: 'Future AI Upgrades', included: true },
      { label: 'Premium Badge', included: true },
    ]
  }
};

const COMPARISON = [
  { feature: 'AI Chat', free: '5/day', monthly: 'Unlimited', yearly: 'Unlimited' },
  { feature: 'AI Summaries', free: '2/day', monthly: 'Unlimited', yearly: 'Unlimited' },
  { feature: 'AI Voice Conversations', free: false, monthly: true, yearly: true },
  { feature: 'AI Goal Planning', free: false, monthly: true, yearly: true },
  { feature: 'AI Timeline Generation', free: false, monthly: true, yearly: true },
  { feature: 'AI Task Breakdown', free: false, monthly: true, yearly: true },
  { feature: 'Advanced Analytics', free: false, monthly: true, yearly: true },
  { feature: 'Unlimited Goals & Tasks', free: false, monthly: true, yearly: true },
  { feature: 'Priority AI Processing', free: false, monthly: true, yearly: true },
  { feature: 'Annual Discount (20%)', free: false, monthly: false, yearly: true },
  { feature: 'Priority Support', free: false, monthly: false, yearly: true },
  { feature: 'Future AI Upgrades', free: false, monthly: true, yearly: true },
];

// ── Trial Claim Modal ─────────────────────────────────────────────────────────
function TrialModal({ onClose, onSuccess }) {
  const { user } = useAuthContext();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleClaim = async (e) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 10) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await subscriptionApi.claimTrial(phone.trim());
      setSuccess(true);
      setTimeout(() => {
        onSuccess(result);
      }, 1800);
    } catch (err) {
      setError(err?.message || 'Failed to activate trial. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Trial Activated! 🎉</h3>
            <p className="text-white/50 text-sm">Your 7-day free trial is now active. Enjoy full premium access!</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#E5B842]" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Start Free Trial</h3>
                <p className="text-xs text-white/40">7 days • No credit card required</p>
              </div>
            </div>

            <form onSubmit={handleClaim} className="space-y-4">
              {/* Email (pre-filled, read-only) */}
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <Mail className="w-4 h-4 text-white/30 shrink-0" />
                  <span className="text-sm text-white/60 truncate">{user?.email}</span>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 focus-within:border-[#E5B842]/40 transition-colors">
                  <Phone className="w-4 h-4 text-white/30 shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Enter your 10-digit number"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
                    maxLength={15}
                  />
                </div>
                <p className="text-xs text-white/30 mt-1.5">
                  Used to prevent trial abuse. One trial per phone number.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-[#E5B842] to-[#F0C84A] text-black hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? 'Activating...' : 'Activate Free Trial'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ── Razorpay Payment Handler ──────────────────────────────────────────────────
function useRazorpayCheckout({ onSuccess, onError }) {
  const loadRazorpayScript = useCallback(() => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }, []);

  const openCheckout = useCallback(async ({ orderData, user, planType }) => {
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      onError('Failed to load Razorpay checkout. Please check your internet connection.');
      return;
    }

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'ResQ AI',
      description: orderData.plan_label,
      order_id: orderData.order_id,
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: user?.phone || ''
      },
      theme: { color: '#E5B842' },
      modal: {
        confirm_close: true,
        ondismiss: () => {
          onError('Payment cancelled. You can try again anytime.');
        }
      },
      handler: async function (response) {
        // response contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
        try {
          const result = await subscriptionApi.verifyPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            plan_type: planType
          });
          onSuccess(result);
        } catch (err) {
          onError(err?.message || 'Payment verification failed. Contact support.');
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', function (response) {
      onError(`Payment failed: ${response.error?.description || 'Unknown error'}`);
    });
    rzp.open();
  }, [loadRazorpayScript, onSuccess, onError]);

  return { openCheckout };
}

// ── Plan Card ─────────────────────────────────────────────────────────────────
function PlanCard({ planKey, plan, onSelectPlan, loading, userStatus }) {
  const isYearly = planKey === 'yearly';
  const isFree = planKey === 'free';
  const isCurrentPlan = userStatus?.plan === planKey || 
    (planKey === 'free' && !userStatus?.isPremiumActive && userStatus?.plan === 'free');

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-gradient-to-b p-6 transition-all duration-300 ${plan.color} ${plan.border} ${
        isYearly ? 'shadow-2xl shadow-[#E5B842]/10 scale-[1.02] lg:scale-105' : ''
      }`}
    >
      {/* Badge */}
      {plan.badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-[#E5B842] to-[#F0C84A] text-black whitespace-nowrap shadow-lg">
          {plan.badge}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-black uppercase tracking-widest text-white/40">{plan.name}</span>
          {isYearly && <span className="text-xs font-bold text-[#E5B842] bg-[#E5B842]/10 px-2 py-0.5 rounded-full">20% OFF</span>}
        </div>

        <div className="flex items-end gap-1.5 mb-1">
          <span className="text-4xl font-black text-white tracking-tight">{plan.price}</span>
          <span className="text-white/40 text-sm pb-1">{plan.period}</span>
        </div>

        {plan.originalPrice && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-white/30 line-through">{plan.originalPrice}</span>
            <span className="text-xs font-bold text-green-400">{plan.saving}</span>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-8 flex-1">
        {plan.features.map((f, i) => (
          <li key={i} className={`flex items-start gap-2.5 text-sm ${f.included ? 'text-white/80' : 'text-white/25 line-through'}`}>
            <span className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-xs ${
              f.included
                ? isYearly ? 'bg-[#E5B842]/20 text-[#E5B842]' : 'bg-white/10 text-white'
                : 'bg-white/5 text-white/20'
            }`}>
              {f.included ? '✓' : '✕'}
            </span>
            {f.label}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {isFree ? (
        <button
          disabled
          className="w-full py-3 rounded-xl text-sm font-bold border border-white/10 text-white/30 cursor-default"
        >
          {isCurrentPlan ? 'Current Plan' : 'Free Forever'}
        </button>
      ) : (
        <button
          onClick={() => onSelectPlan(planKey)}
          disabled={loading === planKey || isCurrentPlan}
          className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 ${
            isYearly
              ? 'bg-gradient-to-r from-[#E5B842] to-[#F0C84A] text-black shadow-lg shadow-[#E5B842]/20'
              : 'bg-white text-black hover:bg-white/90'
          }`}
        >
          {loading === planKey ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isCurrentPlan ? (
            'Current Plan'
          ) : (
            <>
              <Crown className="w-4 h-4" />
              Get {plan.name} Premium
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── Main Pricing Page ─────────────────────────────────────────────────────────
export default function PricingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshSubscription } = useAuthContext();

  const [userStatus, setUserStatus] = useState(null);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Fetch subscription status
  useEffect(() => {
    if (isAuthenticated) {
      subscriptionApi.getStatus()
        .then(setUserStatus)
        .catch(console.error);
    }
  }, [isAuthenticated]);

  const { openCheckout } = useRazorpayCheckout({
    onSuccess: async (result) => {
      showToast(result.message || '🎉 Subscription activated!', 'success');
      await refreshSubscription();
      const fresh = await subscriptionApi.getStatus();
      setUserStatus(fresh);
      setLoadingPlan(null);
    },
    onError: (msg) => {
      if (!msg.includes('cancelled')) {
        showToast(msg, 'error');
      }
      setLoadingPlan(null);
    }
  });

  const handleSelectPlan = async (planKey) => {
    if (!isAuthenticated) {
      navigate('/auth');
      return;
    }

    setLoadingPlan(planKey);
    try {
      const orderData = await subscriptionApi.createOrder(planKey);
      await openCheckout({ orderData, user, planType: planKey });
    } catch (err) {
      showToast(err?.message || 'Failed to create order. Please try again.', 'error');
      setLoadingPlan(null);
    }
  };

  const handleTrialSuccess = async (result) => {
    setShowTrialModal(false);
    showToast(result.message || '🎉 Trial activated!', 'success');
    await refreshSubscription();
    const fresh = await subscriptionApi.getStatus();
    setUserStatus(fresh);
  };

  const trialAvailable = isAuthenticated && userStatus && !userStatus.trial_claimed && !userStatus.isPremiumActive;

  return (
    <div className="min-h-screen bg-[#060606] text-white font-sans overflow-x-hidden">
      {/* ── Background Glow ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E5B842]/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-purple-500/3 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-blue-500/3 rounded-full blur-[100px]" />
      </div>

      {/* ── Nav ── */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5 border-b border-white/5">
        <button
          onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {isAuthenticated ? 'Dashboard' : 'Home'}
        </button>
        <span className="font-black text-xl tracking-tight">
          <span className="text-white">Res</span>
          <span className="text-[#E5B842]">Q</span>
          <span className="text-white/40 font-light text-sm ml-2">Premium</span>
        </span>
        {!isAuthenticated && (
          <button
            onClick={() => navigate('/auth')}
            className="text-sm font-bold text-white/60 hover:text-white transition-colors"
          >
            Sign In
          </button>
        )}
        {isAuthenticated && (
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm font-bold text-[#E5B842] hover:text-[#F0C84A] transition-colors"
          >
            Go to Dashboard
          </button>
        )}
      </nav>

      <div className="relative z-10 px-4 sm:px-6 lg:px-12 py-16 max-w-7xl mx-auto">

        {/* ── Hero ── */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 text-[#E5B842] text-xs font-bold uppercase tracking-widest mb-6">
            <Crown className="w-3.5 h-3.5" />
            ResQ Premium
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 leading-tight">
            Unlock Your Full
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5B842] to-[#F0C84A]">
              AI Potential
            </span>
          </h1>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
            Unlimited AI, voice conversations, and advanced productivity tools.
            Start with a free trial — no credit card needed.
          </p>

          {/* Active subscription badge */}
          {userStatus?.isPremiumActive && (
            <div className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold">
              <CheckCircle2 className="w-4 h-4" />
              You have active premium access
              {userStatus.subscription_days_remaining > 0 && ` · ${userStatus.subscription_days_remaining} days remaining`}
              {userStatus.trial_days_remaining > 0 && ` · Trial: ${userStatus.trial_days_remaining} days left`}
            </div>
          )}
        </div>

        {/* ── Trial Banner ── */}
        {trialAvailable && (
          <div className="mb-12 rounded-2xl border border-[#E5B842]/20 bg-gradient-to-r from-[#E5B842]/10 via-[#E5B842]/5 to-transparent p-6 lg:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start mb-2">
                <Zap className="w-5 h-5 text-[#E5B842]" />
                <span className="font-black text-lg text-white">Start Your 7-Day Free Premium Trial</span>
              </div>
              <p className="text-white/50 text-sm">
                No Credit Card Required &nbsp;·&nbsp; Unlock All Premium Features Instantly &nbsp;·&nbsp; One trial per account
              </p>
            </div>
            <button
              onClick={() => setShowTrialModal(true)}
              className="shrink-0 flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-[#E5B842] to-[#F0C84A] text-black hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#E5B842]/20 whitespace-nowrap"
            >
              <Zap className="w-4 h-4" />
              Get Free Trial
            </button>
          </div>
        )}

        {/* ── Plan Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-20 mt-8">
          {Object.entries(PLANS).map(([key, plan]) => (
            <PlanCard
              key={key}
              planKey={key}
              plan={plan}
              onSelectPlan={handleSelectPlan}
              loading={loadingPlan}
              userStatus={userStatus}
            />
          ))}
        </div>

        {/* ── Feature Comparison Table ── */}
        <div className="mb-20">
          <h2 className="text-2xl font-black text-white text-center mb-2">Compare Plans</h2>
          <p className="text-white/40 text-center text-sm mb-10">Everything you get with each plan</p>

          <div className="rounded-2xl border border-white/8 overflow-hidden bg-white/[0.02]">
            {/* Table header */}
            <div className="grid grid-cols-4 px-6 py-4 bg-white/[0.03] border-b border-white/8">
              <div className="text-xs font-bold text-white/40 uppercase tracking-wider">Feature</div>
              <div className="text-xs font-bold text-white/40 uppercase tracking-wider text-center">Free</div>
              <div className="text-xs font-bold text-white/40 uppercase tracking-wider text-center">Monthly</div>
              <div className="text-xs font-bold text-[#E5B842] uppercase tracking-wider text-center flex items-center justify-center gap-1">
                <Crown className="w-3 h-3" /> Yearly
              </div>
            </div>

            {COMPARISON.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-4 px-6 py-4 border-b border-white/[0.04] last:border-0 ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}
              >
                <div className="text-sm text-white/70">{row.feature}</div>
                {['free', 'monthly', 'yearly'].map(col => (
                  <div key={col} className="flex items-center justify-center">
                    {typeof row[col] === 'boolean' ? (
                      row[col] ? (
                        <Check className={`w-4 h-4 ${col === 'yearly' ? 'text-[#E5B842]' : 'text-green-400'}`} />
                      ) : (
                        <X className="w-4 h-4 text-white/20" />
                      )
                    ) : (
                      <span className={`text-xs font-bold ${col === 'yearly' ? 'text-[#E5B842]' : 'text-white/60'}`}>
                        {row[col]}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Premium Features Grid ── */}
        <div className="mb-20">
          <h2 className="text-2xl font-black text-white text-center mb-2">Everything Premium Includes</h2>
          <p className="text-white/40 text-center text-sm mb-10">Unlock the full power of ResQ AI</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { icon: MessageSquare, label: 'Unlimited AI Chat', color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { icon: Mic, label: 'Voice AI Conversations', color: 'text-purple-400', bg: 'bg-purple-400/10' },
              { icon: Brain, label: 'AI Goal Planning', color: 'text-pink-400', bg: 'bg-pink-400/10' },
              { icon: Clock, label: 'AI Timeline Generator', color: 'text-orange-400', bg: 'bg-orange-400/10' },
              { icon: Target, label: 'Unlimited Goals', color: 'text-green-400', bg: 'bg-green-400/10' },
              { icon: BarChart3, label: 'Advanced Analytics', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
              { icon: Brain, label: 'Smart Insights', color: 'text-[#E5B842]', bg: 'bg-[#E5B842]/10' },
              { icon: InfinityIcon, label: 'Future AI Upgrades', color: 'text-white', bg: 'bg-white/10' },
            ].map(({ icon: Icon, label, color, bg }) => (
              <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/10 transition-colors">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${color}`} />
                </div>
                <span className="text-sm text-white/70 font-medium leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Trust / Security ── */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 mb-16 opacity-60">
          {[
            { icon: Shield, text: 'Secure Payment via Razorpay' },
            { icon: Star, text: 'Cancel Anytime' },
            { icon: Zap, text: 'Instant Activation' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-sm text-white/50">
              <Icon className="w-4 h-4 text-white/30" />
              {text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Trial Modal ── */}
      {showTrialModal && (
        <TrialModal
          onClose={() => setShowTrialModal(false)}
          onSuccess={handleTrialSuccess}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold max-w-sm text-center transition-all ${
          toast.type === 'success'
            ? 'bg-green-500/90 text-white border border-green-400/30'
            : 'bg-red-500/90 text-white border border-red-400/30'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
