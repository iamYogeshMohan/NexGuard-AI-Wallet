'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Landmark,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  ExternalLink,
  Shield,
  CreditCard,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function AccountMonitoringPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        sort_by: sortBy,
        sort_dir: sortDir,
      });
      if (search.trim()) q.set('search', search.trim());
      if (status !== 'ALL') q.set('status', status);

      const res = await api(`/server/accounts?${q.toString()}`);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [page, status, sortBy, sortDir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchAccounts();
  };

  const handleStatusToggle = async (accId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'FROZEN' ? 'ACTIVE' : 'FROZEN';
    const confirmed = confirm(`Change Account status to ${nextStatus}?`);
    if (!confirmed) return;

    setActionLoading(accId);
    try {
      await api(`/server/accounts/${accId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, reason: `Admin operational toggle to ${nextStatus}` }),
      });
      fetchAccounts();
    } catch (err: any) {
      alert('Failed to update account status: ' + (err?.message || 'Error'));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Landmark className="w-6 h-6 text-purple-600" />
            <span>Account Monitoring & Liquidity</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulated NG Bank accounts inventory, ledger balances, and operational status controls.
          </p>
        </div>
        <button
          onClick={() => fetchAccounts()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-[#111827] hover:bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-600' : ''}`} />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search account number, account holder, or customer email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white dark:bg-[#111827] transition-all shadow-inner"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all shadow-md shadow-purple-600/20"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Status:</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="FROZEN">FROZEN</option>
            <option value="RESTRICTED">RESTRICTED</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Accounts Table */}
      <div className="rounded-[22px] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-[#f8fafc] text-slate-500 dark:text-slate-400 font-bold">
                <th className="py-3.5 px-4">Account ID</th>
                <th className="py-3.5 px-3">Account Number</th>
                <th className="py-3.5 px-3">Account Holder</th>
                <th className="py-3.5 px-3">Bank Details</th>
                <th className="py-3.5 px-3 text-right">Balance</th>
                <th className="py-3.5 px-3 text-center">Status</th>
                <th className="py-3.5 px-3 text-center">Risk Score</th>
                <th className="py-3.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && !data ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-600 mx-auto mb-2" />
                    Loading bank accounts...
                  </td>
                </tr>
              ) : data?.items?.length > 0 ? (
                data.items.map((acc: any) => (
                  <tr key={acc.id} className="hover:bg-slate-50 dark:bg-slate-800/60/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-purple-600">
                      {acc.account_id}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                      {acc.account_number}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                          {(acc.customer_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{acc.customer_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{acc.customer_id} · {acc.customer_email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-slate-900 dark:text-white font-semibold">{acc.bank_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">IFSC: {acc.branch_ifsc}</div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600 text-sm">
                      ₹{(acc.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.status === 'ACTIVE'
                          ? 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className={`font-bold ${acc.risk_score >= 70 ? 'text-rose-600' : (acc.risk_score >= 35 ? 'text-amber-600' : 'text-emerald-600')}`}>
                        {acc.risk_score}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleStatusToggle(acc.id, acc.status)}
                          disabled={actionLoading === acc.id}
                          className={`px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1 transition-all ${
                            acc.status === 'FROZEN'
                              ? 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] hover:bg-[#dcfce7]'
                              : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          {acc.status === 'FROZEN' ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          <span>{acc.status === 'FROZEN' ? 'Unfreeze' : 'Freeze'}</span>
                        </button>
                        <Link
                          href={`/server/cross-check?entity_type=account&entity_id=${acc.account_number}`}
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
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400">
                    No accounts found matching search criteria.
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
              Page {data.page} of {data.pages} ({data.total} total accounts)
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
