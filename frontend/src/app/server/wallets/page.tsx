'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  TrendingUp,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function WalletMonitoringPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchWallets = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: '15',
      });
      if (search.trim()) q.set('search', search.trim());
      if (status !== 'ALL') q.set('status', status);

      const res = await api(`/server/wallets?${q.toString()}`);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load wallets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, [page, status]);

  const handleStatusToggle = async (walletId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
    const confirmed = confirm(`Change Wallet status to ${nextStatus}?`);
    if (!confirmed) return;

    setActionLoading(walletId);
    try {
      await api(`/server/wallets/${walletId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, reason: `Operator toggle to ${nextStatus}` }),
      });
      fetchWallets();
    } catch (err: any) {
      alert('Failed to update wallet status: ' + (err?.message || 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  const summary = data?.summary || {};

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-emerald-600" />
            <span>Digital Wallet Monitoring & Posture</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor client digital wallets, cryptographic security posture, and active balances across NexGuard.
          </p>
        </div>
        <button
          onClick={() => fetchWallets()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-[#111827] hover:bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-[20px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold text-slate-400">Total Wallets</span>
          <div className="mt-1 text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
            {summary.total ?? 0}
          </div>
          <span className="text-[11px] font-bold text-emerald-600">{summary.active ?? 0} Active</span>
        </div>

        <div className="p-4 rounded-[20px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold text-slate-400">Frozen Wallets</span>
          <div className="mt-1 text-2xl font-extrabold font-mono text-sky-700">
            {summary.frozen ?? 0}
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Security Lock</span>
        </div>

        <div className="p-4 rounded-[20px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold text-slate-400">Restricted Wallets</span>
          <div className="mt-1 text-2xl font-extrabold font-mono text-amber-700">
            {summary.restricted ?? 0}
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Under Review</span>
        </div>

        <div className="p-4 rounded-[20px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold text-slate-400">Total Wallets Float</span>
          <div className="mt-1 text-xl font-extrabold font-mono text-slate-900 dark:text-white">
            ₹{(summary.total_balance || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] font-medium text-emerald-600">Active Balance</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search customer name, email, or username..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:bg-[#111827] transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="FROZEN">FROZEN</option>
            <option value="RESTRICTED">RESTRICTED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Wallets Table */}
      <div className="rounded-[22px] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-[#f8fafc] text-slate-500 dark:text-slate-400 font-bold">
                <th className="py-3.5 px-4">Wallet ID</th>
                <th className="py-3.5 px-3">Customer</th>
                <th className="py-3.5 px-3 text-right">Available Balance</th>
                <th className="py-3.5 px-3 text-center">Security Trust Score</th>
                <th className="py-3.5 px-3 text-center">Lifetime Txns</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && !data ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
                    Loading wallets...
                  </td>
                </tr>
              ) : data?.items?.length > 0 ? (
                data.items.map((w: any) => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:bg-slate-800/60/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {w.wallet_id}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                          {(w.customer_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{w.customer_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{w.customer_id} · {w.customer_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white text-sm">
                      ₹{(w.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono text-[11px] font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>{w.security_score}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {w.transactions_count}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        w.status === 'ACTIVE'
                          ? 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleStatusToggle(w.id, w.status)}
                          disabled={actionLoading === w.id}
                          className={`px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1 transition-all ${
                            w.status === 'FROZEN'
                              ? 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] hover:bg-[#dcfce7]'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {w.status === 'FROZEN' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          <span>{w.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}</span>
                        </button>
                        <Link
                          href={`/server/cross-check?entity_type=wallet&entity_id=${w.id}`}
                          className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors"
                          title="View in Relational Graph"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-slate-400">
                    No digital wallets found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-[#f8fafc] flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Page {data.page} of {data.pages} ({data.total} total wallets)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono px-2 py-0.5 font-bold text-slate-900 dark:text-white">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="p-1.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-40 shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
