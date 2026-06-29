import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Flame, CheckCircle2, Clock, Plus, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '../../config/apiConfig.js';

const token = () => localStorage.getItem('token');

const apiFetch = async (path) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Authorization': `Bearer ${token()}` }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const planTypeEmoji = (t) => ({ study: '📚', project: '🚀', career: '💼', fitness: '💪', exam: '📝', custom: '🎯' }[t] || '🎯');

const statusColor = (s) => ({
  active: 'text-emerald-400 bg-emerald-500/10',
  paused: 'text-orange-400 bg-orange-500/10',
  completed: 'text-[#E5B842] bg-[#E5B842]/10',
  abandoned: 'text-white/30 bg-white/5'
}[s] || 'text-white/30 bg-white/5');

export default function PlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [generatingTopic, setGeneratingTopic] = useState('');

  const fetchPlans = async () => {
    try {
      const data = await apiFetch('/plans');
      setPlans(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Failed to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  // Listen for plan:created to refresh list and navigate
  useEffect(() => {
    const handler = (e) => {
      const { planId, topic } = e.detail || {};
      setGenerating(false);
      fetchPlans();
      if (planId) setTimeout(() => navigate(`/plans/${planId}`), 400);
    };
    const errorHandler = (e) => {
      setGenerating(false);
      setGeneratingTopic('');
    };
    window.addEventListener('resq:plan-created', handler);
    window.addEventListener('resq:plan-error', errorHandler);
    return () => {
      window.removeEventListener('resq:plan-created', handler);
      window.removeEventListener('resq:plan-error', errorHandler);
    };
  }, [navigate]);

  // Listen for voice creating a plan
  useEffect(() => {
    const handler = (e) => {
      const topic = e.detail?.topic || 'your plan';
      setGenerating(true);
      setGeneratingTopic(topic);
    };
    window.addEventListener('resq:plan-generating', handler);
    return () => window.removeEventListener('resq:plan-generating', handler);
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-[#E5B842]/30 border-t-[#E5B842] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">My Plans</h1>
          <p className="text-white/40 text-sm mt-1">
            Voice-triggered smart plans — study, work, career, fitness & more
          </p>
        </div>
        <div className="text-xs text-white/30 font-bold uppercase tracking-widest text-right">
          <span className="block">Say to ResQ:</span>
          <span className="text-[#E5B842]">"Plan me 90 days Python"</span>
        </div>
      </div>

      {/* Generating state banner */}
      {generating && (
        <div className="p-4 rounded-xl border border-[#E5B842]/20 bg-[#E5B842]/5 flex items-center gap-4">
          <div className="w-5 h-5 border-2 border-[#E5B842]/30 border-t-[#E5B842] rounded-full animate-spin shrink-0" />
          <div>
            <p className="text-sm font-bold text-[#E5B842]">Building your plan...</p>
            <p className="text-xs text-white/40">{generatingTopic} — Gemini is generating your day-by-day roadmap. This takes about 15–30 seconds.</p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 flex items-center gap-3 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && plans.length === 0 && !generating && (
        <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center">
            <BookOpen className="w-10 h-10 text-[#E5B842]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black">No plans yet</h2>
            <p className="text-white/40 text-sm max-w-xs leading-relaxed">
              Ask ResQ to create a plan for you — learning, projects, career, fitness, or anything else.
            </p>
          </div>
          <div className="space-y-2 w-full max-w-sm">
            {[
              '"Hey ResQ, plan me 90 days Python programming"',
              '"ResQ, help me plan my product launch in 60 days"',
              '"Plan my Data Science learning journey"',
            ].map((example, i) => (
              <div key={i} className="px-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-left">
                <p className="text-xs text-[#E5B842]/70 font-mono">{example}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      {plans.length > 0 && (
        <div className="space-y-3">
          {plans.map(plan => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysRemaining = Math.max(0, Math.ceil((new Date(plan.endDate) - today) / (1000 * 60 * 60 * 24)));
            const progressPct = plan.durationDays > 0
              ? Math.round((plan.completedDays / plan.durationDays) * 100)
              : 0;

            return (
              <button
                key={plan._id}
                onClick={() => navigate(`/plans/${plan._id}`)}
                className="w-full p-5 bg-[#090909] border border-white/[0.05] hover:border-white/10 rounded-2xl text-left group transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Top row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">{planTypeEmoji(plan.planType)}</span>
                      <h3 className="font-black text-white truncate">{plan.topic}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${statusColor(plan.status)}`}>
                        {plan.status}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1">
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#E5B842] to-amber-500 transition-all duration-700"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-white/30 font-bold uppercase tracking-wider">
                        <span>{plan.completedDays}/{plan.durationDays} days · {progressPct}%</span>
                        <span>{daysRemaining} days left</span>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4">
                      {plan.streakDays > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-400 font-bold">
                          <Flame className="w-3 h-3" /> {plan.streakDays} streak
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-white/30">
                        <Clock className="w-3 h-3" /> {plan.dailyMinutes} min/day
                      </span>
                      {plan.calendarSynced && (
                        <span className="flex items-center gap-1 text-xs text-emerald-400/60">
                          <CheckCircle2 className="w-3 h-3" /> Calendar synced
                        </span>
                      )}
                      <span className="text-xs text-white/20">
                        {new Date(plan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(plan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/40 shrink-0 mt-1 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* How it works footer */}
      {plans.length > 0 && (
        <div className="pt-4 border-t border-white/5">
          <p className="text-xs text-white/20 text-center">
            Say <span className="text-[#E5B842]">"Hey ResQ, plan me..."</span> to create a new plan — any topic, any duration.
          </p>
        </div>
      )}
    </div>
  );
}
