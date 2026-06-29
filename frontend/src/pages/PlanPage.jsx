/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckSquare, Square, Flame, Calendar, Clock, ChevronDown, ChevronUp, Pause, Play, Trash2, Bell, AlertTriangle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { API_BASE_URL } from '../config/apiConfig.js';

const token = () => localStorage.getItem('token');

const apiFetch = async (path, options = {}) => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const planTypeLabel = (t) => ({ study: '📚 Study', project: '🚀 Project', career: '💼 Career', fitness: '💪 Fitness', exam: '📝 Exam Prep', custom: '🎯 Custom' }[t] || '🎯 Plan');

const typeColor = (type) => ({ learn: 'text-sky-400', work: 'text-amber-400', review: 'text-purple-400', practice: 'text-emerald-400', project: 'text-orange-400', rest: 'text-white/30' }[type] || 'text-white/50');

export default function PlanPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDays, setExpandedDays] = useState({});
  const [completing, setCompleting] = useState(null);
  const [reminderTime, setReminderTime] = useState('09:00');
  const [showReminderEdit, setShowReminderEdit] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchPlan = useCallback(async () => {
    try {
      const data = await apiFetch(`/plans/${planId}`);
      setPlan(data);
      setReminderTime(data.reminderTime || '09:00');
    } catch (e) {
      setError('Plan not found or could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [planId]);

  useEffect(() => { fetchPlan(); }, [fetchPlan]);

  // Listen for plan reminder banner
  useEffect(() => {
    const handler = (e) => {
      if (e.detail.planId === planId) {
        showToast(`🔔 ${e.detail.message}`, 'reminder');
      }
    };
    window.addEventListener('resq:plan-reminder', handler);
    return () => window.removeEventListener('resq:plan-reminder', handler);
  }, [planId]);

  const handleComplete = async (dayNumber) => {
    setCompleting(dayNumber);
    try {
      const data = await apiFetch(`/plans/${planId}/days/${dayNumber}/complete`, { method: 'PATCH' });
      setPlan(data.plan);
      showToast('Day marked complete! 🎉');
    } catch (e) {
      showToast('Failed to mark complete.', 'error');
    } finally {
      setCompleting(null);
    }
  };

  const handlePause = async () => {
    try {
      const data = await apiFetch(`/plans/${planId}/pause`, { method: 'PATCH' });
      setPlan(prev => ({ ...prev, status: data.status }));
      showToast(data.status === 'paused' ? 'Plan paused.' : 'Plan resumed.');
    } catch { showToast('Failed.', 'error'); }
  };

  const handleUpdateReminder = async () => {
    try {
      await apiFetch(`/plans/${planId}/reminder-time`, { method: 'PATCH', body: JSON.stringify({ reminderTime }) });
      setShowReminderEdit(false);
      showToast(`Reminder set for ${reminderTime} daily.`);
    } catch { showToast('Failed to update reminder.', 'error'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this plan? This will also remove calendar events.')) return;
    try {
      await apiFetch(`/plans/${planId}`, { method: 'DELETE' });
      navigate('/dashboard');
    } catch { showToast('Failed to delete.', 'error'); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-2 border-[#E5B842]/30 border-t-[#E5B842] rounded-full animate-spin mx-auto" />
        <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Loading Plan...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-red-400 mx-auto" />
        <p className="text-white/60">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="text-[#E5B842] hover:underline text-sm">← Back to Dashboard</button>
      </div>
    </div>
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEntry = plan.days?.find(d => {
    const dDate = new Date(d.date);
    dDate.setHours(0, 0, 0, 0);
    return dDate.getTime() === today.getTime();
  });

  const daysBehind = plan.days?.filter(d => {
    const dDate = new Date(d.date);
    dDate.setHours(0, 0, 0, 0);
    return dDate.getTime() < today.getTime() && !d.completed && !d.skipped;
  }).length || 0;

  const daysRemaining = Math.max(0, Math.ceil((new Date(plan.endDate) - today) / (1000 * 60 * 60 * 24)));
  const progressPct = plan.durationDays > 0 ? Math.round((plan.completedDays / plan.durationDays) * 100) : 0;

  // Group days by phase
  const phases = [];
  let currentPhase = null;
  for (const day of (plan.days || [])) {
    if (day.phase !== currentPhase) {
      currentPhase = day.phase;
      phases.push({ phase: currentPhase, days: [] });
    }
    phases[phases.length - 1].days.push(day);
  }

  return (
    <div className="min-h-screen bg-[#080808] text-white font-sans pb-20">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-bold shadow-2xl border animate-fade-in-up
          ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-300' :
            toast.type === 'reminder' ? 'bg-[#E5B842]/20 border-[#E5B842]/30 text-[#E5B842]' :
            'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'}`}>
          {toast.msg}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 pt-8 space-y-6">
        {/* Back button */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-white/40 hover:text-white text-sm transition-colors cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#E5B842]">{planTypeLabel(plan.planType)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${
              plan.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' :
              plan.status === 'paused' ? 'bg-orange-500/10 text-orange-400' :
              plan.status === 'completed' ? 'bg-[#E5B842]/10 text-[#E5B842]' :
              'bg-white/5 text-white/30'
            }`}>{plan.status}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight leading-tight">{plan.topic}</h1>
          <div className="flex items-center gap-4 text-sm text-white/40">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(plan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(plan.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {plan.streakDays} day streak</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest">
            <span className="text-white/40">{plan.completedDays}/{plan.durationDays} days</span>
            <span className={daysBehind > 0 ? 'text-red-400' : 'text-emerald-400'}>
              {daysBehind > 0 ? `${daysBehind} DAYS BEHIND` : daysRemaining === 0 ? 'LAST DAY' : 'ON TRACK'}
            </span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-[#E5B842] to-amber-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-right text-xs text-white/30">{progressPct}% complete · {daysRemaining} days remaining</div>
        </div>

        {/* Today's Card */}
        {todayEntry && (
          <div className={`p-6 rounded-2xl border space-y-4 ${
            todayEntry.completed
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-[#E5B842]/5 border-[#E5B842]/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#E5B842]">
                TODAY — DAY {todayEntry.day}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-white/30">
                <Clock className="w-3 h-3" /> ~{todayEntry.estimatedMinutes} min
              </span>
            </div>

            <div>
              <h2 className="text-xl font-black leading-tight">{todayEntry.title}</h2>
              <p className="text-sm text-white/50 mt-2 leading-relaxed">{todayEntry.description}</p>
            </div>

            {todayEntry.resourceHint && (
              <div className="flex items-start gap-2 p-3 bg-white/[0.03] border border-white/5 rounded-xl">
                <span className="text-base">💡</span>
                <p className="text-xs text-white/50 leading-relaxed">{todayEntry.resourceHint}</p>
              </div>
            )}

            {todayEntry.completed ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Completed at {new Date(todayEntry.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            ) : (
              <button
                onClick={() => handleComplete(todayEntry.day)}
                disabled={completing === todayEntry.day}
                className="w-full py-4 bg-[#E5B842] hover:bg-amber-400 text-black font-black text-sm uppercase tracking-widest rounded-xl transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {completing === todayEntry.day ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Marking...</>
                ) : (
                  <><CheckSquare className="w-4 h-4" /> Mark Complete</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button onClick={handlePause} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-white/20 rounded-xl text-white/50 hover:text-white transition-all cursor-pointer">
            {plan.status === 'paused' ? <><Play className="w-3 h-3" /> Resume</> : <><Pause className="w-3 h-3" /> Pause</>}
          </button>

          <button onClick={() => setShowReminderEdit(!showReminderEdit)} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-white/10 hover:border-white/20 rounded-xl text-white/50 hover:text-white transition-all cursor-pointer">
            <Bell className="w-3 h-3" /> Reminder: {plan.reminderTime}
          </button>

          <button onClick={handleDelete} className="ml-auto flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider border border-red-500/20 hover:border-red-500/40 rounded-xl text-red-400/60 hover:text-red-400 transition-all cursor-pointer">
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>

        {showReminderEdit && (
          <div className="flex items-center gap-3 p-4 bg-[#090909] border border-white/5 rounded-xl animate-fade-in">
            <Bell className="w-4 h-4 text-[#E5B842]" />
            <span className="text-sm text-white/60">Daily reminder time:</span>
            <input
              type="time"
              value={reminderTime}
              onChange={e => setReminderTime(e.target.value)}
              className="bg-black border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#E5B842]/40"
            />
            <button onClick={handleUpdateReminder} className="px-4 py-1.5 bg-[#E5B842] text-black text-xs font-bold rounded-lg cursor-pointer hover:bg-amber-400 transition-colors">Save</button>
          </div>
        )}

        {/* Timeline */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-[0.25em] text-white/30">Full Plan Timeline</h3>

          {phases.map(({ phase, days: phaseDays }) => (
            <div key={phase} className="space-y-1">
              {/* Phase header */}
              <div className="sticky top-0 z-10 py-2 bg-[#080808]">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#E5B842]/60">{phase}</span>
              </div>

              {phaseDays.map(day => {
                const dayDate = new Date(day.date);
                dayDate.setHours(0, 0, 0, 0);
                const isToday = dayDate.getTime() === today.getTime();
                const isPast = dayDate.getTime() < today.getTime();
                const isFuture = dayDate.getTime() > today.getTime();
                const isExpanded = expandedDays[day.day];

                return (
                  <div
                    key={day.day}
                    className={`rounded-xl border transition-all duration-200 ${
                      isToday ? 'border-[#E5B842]/30 bg-[#E5B842]/5' :
                      day.completed ? 'border-emerald-500/10 bg-transparent' :
                      day.type === 'rest' ? 'border-white/[0.02] bg-transparent' :
                      isPast ? 'border-red-500/10 bg-red-500/[0.02]' :
                      'border-white/[0.03] bg-transparent'
                    }`}
                  >
                    <button
                      onClick={() => !isFuture && setExpandedDays(prev => ({ ...prev, [day.day]: !prev[day.day] }))}
                      className={`w-full flex items-center gap-3 p-3 text-left ${isFuture ? 'cursor-default' : 'cursor-pointer'}`}
                    >
                      {/* Day status icon */}
                      <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                        {day.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : isToday ? (
                          <div className="w-2 h-2 rounded-full bg-[#E5B842] animate-pulse" />
                        ) : isPast && !day.completed ? (
                          <div className="w-2 h-2 rounded-full bg-red-400/40" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                        )}
                      </div>

                      {/* Day number */}
                      <span className={`text-xs font-bold w-12 shrink-0 ${isToday ? 'text-[#E5B842]' : 'text-white/30'}`}>
                        Day {day.day}
                      </span>

                      {/* Title */}
                      <span className={`flex-1 text-sm ${
                        day.completed ? 'line-through text-white/25' :
                        isToday ? 'text-white font-bold' :
                        isFuture ? 'text-white/40' :
                        'text-white/70'
                      }`}>
                        {day.title}
                      </span>

                      {/* Type badge */}
                      <span className={`text-[10px] uppercase font-bold tracking-wider shrink-0 ${typeColor(day.type)}`}>
                        {day.type}
                      </span>

                      {/* Expand icon (only for past/today) */}
                      {!isFuture && (
                        isExpanded
                          ? <ChevronUp className="w-3 h-3 text-white/20 shrink-0" />
                          : <ChevronDown className="w-3 h-3 text-white/20 shrink-0" />
                      )}
                    </button>

                    {/* Expanded detail (past/today days) */}
                    {isExpanded && !isFuture && (
                      <div className="px-11 pb-4 space-y-3 animate-fade-in">
                        <p className="text-xs text-white/50 leading-relaxed">{day.description}</p>
                        {day.resourceHint && (
                          <p className="text-xs text-[#E5B842]/60">💡 {day.resourceHint}</p>
                        )}
                        {!day.completed && (
                          <button
                            onClick={() => handleComplete(day.day)}
                            disabled={completing === day.day}
                            className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg transition-colors cursor-pointer"
                          >
                            {completing === day.day ? 'Marking...' : '✅ Mark Complete'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
