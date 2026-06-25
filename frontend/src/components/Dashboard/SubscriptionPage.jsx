import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Crown, Zap, Check, Clock, CreditCard, AlertCircle, 
  ChevronRight, RotateCcw, ExternalLink, Loader2, CheckCircle2,
  Calendar, Package, History, XCircle
} from 'lucide-react';
import { useAuthContext } from '../../context/AuthContext';
import { subscription as subscriptionApi } from '../../services/api';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

function StatusBadge({ status, plan, isPremiumActive, trialDays }) {
  if (isPremiumActive && plan === 'trial') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 border border-purple-500/20 text-purple-400">
        <Zap className="w-3 h-3" />
        Trial Active · {trialDays}d left
      </span>
    );
  }
  if (isPremiumActive) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E5B842]/10 border border-[#E5B842]/20 text-[#E5B842]">
        <Crown className="w-3 h-3" />
        Premium Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/5 border border-white/10 text-white/40">
      Free Plan
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SubscriptionPage({ setCurrentTab }) {
  const navigate = useNavigate();
  const { user, refreshSubscription } = useAuthContext();

  const [status, setStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [s, h] = await Promise.all([
          subscriptionApi.getStatus(),
          subscriptionApi.getHistory()
        ]);
        setStatus(s);
        setHistory(h || []);
      } catch (err) {
        console.error('[SubscriptionPage]', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCancel = async () => {
    setCancelLoading(true);
    try {
      const result = await subscriptionApi.cancel();
      showToast(result.message, 'success');
      const fresh = await subscriptionApi.getStatus();
      setStatus(fresh);
      await refreshSubscription();
      setShowCancelConfirm(false);
    } catch (err) {
      showToast(err?.message || 'Failed to cancel subscription.', 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  const goToPricing = () => navigate('/pricing');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    );
  }

  const isActive = status?.isPremiumActive;
  const isTrial = status?.plan === 'trial';
  const isPaid = status?.subscription_status === 'active' && !isTrial;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* ── Header ── */}
      <div>
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Crown className="w-6 h-6 text-[#E5B842]" />
          Subscription
        </h2>
        <p className="text-white/40 text-sm mt-1">Manage your ResQ premium plan and billing.</p>
      </div>

      {/* ── Current Plan Card ── */}
      <div className={`rounded-2xl border p-6 bg-gradient-to-b ${
        isActive
          ? isTrial
            ? 'from-purple-500/10 to-transparent border-purple-500/20'
            : 'from-[#E5B842]/10 to-transparent border-[#E5B842]/20'
          : 'from-white/[0.03] to-transparent border-white/10'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isActive ? 'bg-[#E5B842]/10 border border-[#E5B842]/20' : 'bg-white/5 border border-white/10'
            }`}>
              {isActive ? <Crown className="w-6 h-6 text-[#E5B842]" /> : <Package className="w-6 h-6 text-white/40" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-white text-lg">
                  {isTrial ? '7-Day Free Trial' : isPaid ? `${status.subscription_type === 'yearly' ? 'Yearly' : 'Monthly'} Premium` : 'Free Plan'}
                </h3>
                <StatusBadge
                  status={status?.subscription_status}
                  plan={status?.plan}
                  isPremiumActive={isActive}
                  trialDays={status?.trial_days_remaining}
                />
              </div>

              {isTrial && status?.trial_end_date && (
                <div className="flex items-center gap-1.5 text-sm text-purple-400/80">
                  <Clock className="w-3.5 h-3.5" />
                  Trial ends {formatDate(status.trial_end_date)}
                  {status.trial_days_remaining > 0 && ` · ${status.trial_days_remaining} days remaining`}
                </div>
              )}

              {isPaid && status?.subscription_end && (
                <div className="flex items-center gap-1.5 text-sm text-white/50">
                  <Calendar className="w-3.5 h-3.5" />
                  {status.subscription_status === 'cancelled'
                    ? `Access until ${formatDate(status.subscription_end)}`
                    : `Renews ${formatDate(status.subscription_end)} · ${status.subscription_days_remaining} days left`}
                </div>
              )}

              {!isActive && (
                <p className="text-sm text-white/40 mt-0.5">
                  {status?.trial_claimed
                    ? 'Your trial has ended. Upgrade to continue premium access.'
                    : 'Upgrade for unlimited AI, voice conversations, and more.'}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-2 shrink-0">
            {!isActive && (
              <button
                onClick={goToPricing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-[#E5B842] to-[#F0C84A] text-black hover:opacity-90 transition-all hover:scale-[1.02]"
              >
                <Crown className="w-4 h-4" />
                Upgrade
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            {isTrial && (
              <button
                onClick={goToPricing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[#E5B842]/10 border border-[#E5B842]/20 text-[#E5B842] hover:bg-[#E5B842]/20 transition-all"
              >
                <Crown className="w-4 h-4" />
                Subscribe Now
              </button>
            )}
            {isPaid && status?.subscription_status === 'active' && (
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white/40 hover:text-red-400 border border-transparent hover:border-red-500/20 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                Cancel Plan
              </button>
            )}
            {isPaid && (
              <button
                onClick={goToPricing}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {status.subscription_type === 'monthly' ? 'Switch to Yearly' : 'Manage Plan'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Premium Features Quick View ── */}
      {!isActive && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.02] p-6">
          <h4 className="text-sm font-black text-white/60 uppercase tracking-widest mb-4">What You Unlock with Premium</h4>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              'Unlimited AI Chat', 'AI Voice Conversations',
              'AI Goal Planning', 'AI Timeline Generator',
              'Unlimited Goals & Tasks', 'Advanced Analytics',
              'Priority AI Processing', 'Smart Insights'
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-white/50">
                <Check className="w-3.5 h-3.5 text-[#E5B842] shrink-0" />
                {f}
              </div>
            ))}
          </div>
          <button
            onClick={goToPricing}
            className="mt-5 flex items-center gap-2 text-sm font-bold text-[#E5B842] hover:text-[#F0C84A] transition-colors"
          >
            View all plans & pricing
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Payment History ── */}
      <div className="rounded-2xl border border-white/8 bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-white/40" />
            <h4 className="text-sm font-black text-white/60 uppercase tracking-widest">Payment History</h4>
          </div>
          {history.length > 0 && (
            <span className="text-xs text-white/30">{history.length} transaction{history.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {history.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <CreditCard className="w-8 h-8 text-white/20 mx-auto mb-3" />
            <p className="text-sm text-white/30">No payment history yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {history.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    payment.payment_status === 'paid'
                      ? 'bg-green-500/10 border border-green-500/20'
                      : payment.payment_status === 'failed'
                        ? 'bg-red-500/10 border border-red-500/20'
                        : 'bg-white/5 border border-white/10'
                  }`}>
                    {payment.payment_status === 'paid'
                      ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                      : payment.payment_status === 'failed'
                        ? <AlertCircle className="w-4 h-4 text-red-400" />
                        : <Clock className="w-4 h-4 text-white/40" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white capitalize">
                      {payment.plan_type} Premium
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {formatDate(payment.created_at)}
                      {payment.razorpay_payment_id && (
                        <span className="ml-2 font-mono">{payment.razorpay_payment_id.slice(-8)}</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">₹{payment.amount_inr}</p>
                  <p className={`text-xs mt-0.5 capitalize ${
                    payment.payment_status === 'paid' ? 'text-green-400' :
                    payment.payment_status === 'failed' ? 'text-red-400' :
                    'text-white/40'
                  }`}>
                    {payment.payment_status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cancel Confirmation Modal ── */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-lg font-black text-white text-center mb-2">Cancel Subscription?</h3>
            <p className="text-sm text-white/40 text-center mb-6">
              You'll retain premium access until <span className="text-white">{formatDate(status?.subscription_end)}</span>. After that, you'll revert to the free plan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-all"
              >
                Keep Plan
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelLoading}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-bold max-w-sm ${
          toast.type === 'success' ? 'bg-green-500/90 text-white border border-green-400/30' : 'bg-red-500/90 text-white border border-red-400/30'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
