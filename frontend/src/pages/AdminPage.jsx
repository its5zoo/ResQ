/**
 * AdminPage.jsx
 *
 * Secret admin dashboard — only accessible to the owner (ADMIN_EMAIL).
 * Route: /admin
 *
 * Features:
 *  - Revenue & user stats overview
 *  - Full user table with plan status, voice usage
 *  - Search & filter by plan
 *  - Grant / Revoke Premium manually
 *  - Pagination
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Crown, Zap, DollarSign, Search, RefreshCw,
  ShieldCheck, ShieldOff, ChevronLeft, ChevronRight,
  TrendingUp, Clock, CheckCircle, XCircle, AlertTriangle,
  Mic, MicOff, Eye
} from 'lucide-react';
import { admin as adminApi } from '../services/api.js';
import { useAuthContext } from '../context/AuthContext.jsx';

const ADMIN_EMAIL = 'faisalkhan786@gmail.com';

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color = '#E5B842' }) {
  return (
    <div className="bg-[#090909] border border-white/[0.06] rounded-2xl p-5 flex items-start gap-4 hover:border-white/10 transition-all">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-white/40 font-tech tracking-widest uppercase mb-1">{label}</p>
        <p className="text-2xl font-black text-white font-display">{value}</p>
        {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Plan Badge ────────────────────────────────────────────────────────────────
function PlanBadge({ plan, isPremiumActive }) {
  if (plan === 'premium' && isPremiumActive) {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E5B842]/15 text-[#E5B842] border border-[#E5B842]/30">
        💎 Premium
      </span>
    );
  }
  if (plan === 'trial') {
    return (
      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
        ⚡ Trial
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/5 text-white/40 border border-white/10">
      Free
    </span>
  );
}

// ── Voice Usage Bar ───────────────────────────────────────────────────────────
function VoiceBar({ used, limit }) {
  if (limit === -1) {
    return <span className="text-xs text-emerald-400 font-bold">∞ Unlimited</span>;
  }
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const color = pct >= 90 ? '#ef4444' : pct >= 60 ? '#f97316' : '#22c55e';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs text-white/50">{used}/{limit}</span>
    </div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // userId being actioned
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Gate: only admin can see this page
  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    const data = await adminApi.getStats();
    if (data?.stats) setStats(data);
    setStatsLoading(false);
  }, []);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const data = await adminApi.getUsers({ page, limit: 20, search: search || undefined, plan: planFilter || undefined });
    if (data?.users) {
      setUsers(data.users);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    }
    setLoading(false);
  }, [page, search, planFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleGrant = async (userId, userName) => {
    if (!window.confirm(`Grant 30 days Premium to ${userName}?`)) return;
    setActionLoading(userId);
    const result = await adminApi.grantPremium(userId, 30);
    if (result?.success) {
      showToast(`✅ Premium granted to ${userName}`);
      fetchUsers();
      fetchStats();
    } else {
      showToast(result?.message || 'Failed to grant premium', 'error');
    }
    setActionLoading(null);
  };

  const handleRevoke = async (userId, userName) => {
    if (!window.confirm(`Revoke Premium from ${userName}? They'll be moved to Free plan.`)) return;
    setActionLoading(userId);
    const result = await adminApi.revokePremium(userId);
    if (result?.success) {
      showToast(`🔒 Premium revoked from ${userName}`);
      fetchUsers();
      fetchStats();
    } else {
      showToast(result?.message || 'Failed to revoke premium', 'error');
    }
    setActionLoading(null);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const daysLeft = (end) => {
    if (!end) return null;
    const diff = Math.ceil((new Date(end) - Date.now()) / 86400000);
    return diff > 0 ? diff : 0;
  };

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-white text-xl font-bold">Access Denied</h1>
          <p className="text-white/40 text-sm mt-2">This page is restricted to admin users only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-[999] flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold shadow-2xl animate-fade-in ${
          toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-tech font-bold tracking-[0.3em] text-[#E5B842] uppercase block mb-1">Owner Dashboard</span>
            <h1 className="text-3xl font-black font-display tracking-tight">
              ResQ Admin <span className="text-[#E5B842]">⚡</span>
            </h1>
            <p className="text-white/30 text-sm mt-1">Premium subscriptions, user tracking, and revenue overview.</p>
          </div>
          <button
            onClick={() => { fetchStats(); fetchUsers(); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        {statsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-[#090909] border border-white/[0.06] rounded-2xl p-5 h-24 animate-pulse" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Total Users" value={stats.stats.totalUsers} color="#6366f1" />
            <StatCard icon={Crown} label="Premium Active" value={stats.stats.premiumUsers} sub={`${stats.stats.trialUsers} on trial`} color="#E5B842" />
            <StatCard icon={TrendingUp} label="Free Users" value={stats.stats.freeUsers} color="#64748b" />
            <StatCard icon={DollarSign} label="Total Revenue" value={`₹${parseFloat(stats.stats.totalRevenue_inr).toLocaleString('en-IN')}`} sub="All-time paid" color="#22c55e" />
          </div>
        ) : null}

        {/* Recent Payments */}
        {stats?.recentPayments?.length > 0 && (
          <div className="bg-[#090909] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#E5B842]" />
              <h2 className="text-sm font-bold text-white tracking-wide">Recent Payments</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.04]">
                    {['User', 'Amount', 'Plan', 'Payment ID', 'Date'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-[10px] font-tech tracking-widest text-white/30 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPayments.map(p => (
                    <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3">
                        <div>
                          <p className="text-white font-medium text-xs">{p.user?.name || 'Unknown'}</p>
                          <p className="text-white/30 text-[10px]">{p.user?.email || '—'}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-emerald-400 font-bold text-xs">₹{p.amount_inr}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#E5B842]/15 text-[#E5B842] border border-[#E5B842]/30">
                          {p.plan_type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-white/30 text-[10px] font-mono">{p.razorpay_payment_id || '—'}</td>
                      <td className="px-5 py-3 text-white/40 text-xs">{formatDate(p.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-[#090909] border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Table Header Controls */}
          <div className="px-5 py-4 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#E5B842]" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                All Users <span className="text-white/30 font-normal">({total})</span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={e => { setPlanFilter(e.target.value); setPage(1); }}
                className="bg-[#0B0B0B] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-[#E5B842]/40 focus:outline-none cursor-pointer"
              >
                <option value="">All Plans</option>
                <option value="free">Free</option>
                <option value="trial">Trial</option>
                <option value="premium">Premium</option>
              </select>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setPage(1); }}
                  placeholder="Search name / email..."
                  className="bg-[#0B0B0B] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-white/20 focus:border-[#E5B842]/40 focus:outline-none w-48"
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.04]">
                  {['User', 'Plan', 'Subscription Ends', 'Voice Usage', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-tech tracking-widest text-white/30 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="border-b border-white/[0.03]">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-5 py-4">
                          <div className="h-3 bg-white/5 rounded-full animate-pulse w-20" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-white/30 text-sm">
                      No users found matching your filters.
                    </td>
                  </tr>
                ) : users.map(u => {
                  const days = daysLeft(u.subscription_end || u.trial_end_date);
                  const isExpiring = days !== null && days <= 5;
                  return (
                    <tr key={u.id} className="border-b border-white/[0.03] hover:bg-white/[0.015] transition-colors group">
                      {/* User */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#E5B842]/10 border border-[#E5B842]/20 flex items-center justify-center text-xs font-bold text-[#E5B842]">
                            {u.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-white font-medium text-xs">{u.name}</p>
                            <p className="text-white/30 text-[10px]">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      {/* Plan */}
                      <td className="px-5 py-3.5">
                        <PlanBadge plan={u.plan} isPremiumActive={u.isPremiumActive} />
                      </td>
                      {/* Subscription Ends */}
                      <td className="px-5 py-3.5">
                        {(u.subscription_end || u.trial_end_date) ? (
                          <div>
                            <p className={`text-xs font-medium ${isExpiring ? 'text-amber-400' : 'text-white/60'}`}>
                              {formatDate(u.subscription_end || u.trial_end_date)}
                            </p>
                            {days !== null && (
                              <p className={`text-[10px] ${isExpiring ? 'text-amber-400/70' : 'text-white/30'}`}>
                                {days === 0 ? '⚠️ Expired today' : `${days}d left`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/20 text-xs">—</span>
                        )}
                      </td>
                      {/* Voice Usage */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {u.voiceEnabled
                            ? <Mic className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            : <MicOff className="w-3 h-3 text-red-400 flex-shrink-0" />
                          }
                          <VoiceBar used={u.voiceCommandsUsed} limit={u.voiceLimit} />
                        </div>
                      </td>
                      {/* Joined */}
                      <td className="px-5 py-3.5 text-white/30 text-xs whitespace-nowrap">
                        {formatDate(u.joinedAt)}
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {u.isPremiumActive ? (
                            <button
                              onClick={() => handleRevoke(u.id, u.name)}
                              disabled={actionLoading === u.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wide hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-40"
                            >
                              <ShieldOff className="w-3 h-3" />
                              {actionLoading === u.id ? '...' : 'Revoke'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleGrant(u.id, u.name)}
                              disabled={actionLoading === u.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#E5B842]/10 border border-[#E5B842]/20 text-[#E5B842] text-[10px] font-bold uppercase tracking-wide hover:bg-[#E5B842]/20 transition-all cursor-pointer disabled:opacity-40"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              {actionLoading === u.id ? '...' : 'Grant'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-4 border-t border-white/[0.04] flex items-center justify-between">
              <p className="text-xs text-white/30">
                Page {page} of {totalPages} · {total} users
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
