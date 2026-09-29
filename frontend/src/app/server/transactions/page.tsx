'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeftRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Smartphone,
  CreditCard,
  X,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function TransactionMonitorPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get('search') || '';

  // Filter States
  const [search, setSearch] = useState(initialSearch);
  const [decision, setDecision] = useState('ALL');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [minRisk, setMinRisk] = useState('');
  const [maxRisk, setMaxRisk] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Data States
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inspector Modal State
  const [selectedTx, setSelectedTx] = useState<any>(null);

  const fetchTransactions = async () => {
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
      if (decision !== 'ALL') q.set('decision', decision);
      if (minAmount) q.set('min_amount', minAmount);
      if (maxAmount) q.set('max_amount', maxAmount);
      if (minRisk) q.set('min_risk', minRisk);
      if (maxRisk) q.set('max_risk', maxRisk);

      const res = await api(`/server/transactions?${q.toString()}`);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, decision, sortBy, sortDir]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const stats = data?.stats || {};

  const getDecisionBadge = (d: string) => {
    switch (d) {
      case 'ALLOW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0] inline-flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />
            ALLOW
          </span>
        );
      case 'VERIFY':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            VERIFY
          </span>
        );
      case 'BLOCK':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" />
            BLOCK
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
            {d}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-amber-600" />
            <span>Central Transaction Journal & Audits</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Comprehensive audit journal of all payment evaluations, risk determinations, and autonomous security actions.
          </p>
        </div>
        <button
          onClick={() => fetchTransactions()}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-white dark:bg-[#111827] hover:bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : ''}`} />
          <span>Refresh Journal</span>
        </button>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-[20px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold text-slate-400">Total Journal Entries</span>
          <div className="mt-1 text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
            {stats.total_transactions ?? 0}
          </div>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            ₹{(stats.total_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })} volume
          </span>
        </div>

        <div className="p-4 rounded-[20px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold text-slate-400">Autonomous ALLOW</span>
          <div className="mt-1 text-2xl font-extrabold font-mono text-emerald-600">
            {stats.allowed_count ?? 0}
          </div>
          <span className="text-[11px] font-bold text-emerald-600">Instant Approved</span>
        </div>

        <div className="p-4 rounded-[20px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold text-slate-400">Step-Up VERIFY</span>
          <div className="mt-1 text-2xl font-extrabold font-mono text-amber-700">
            {stats.verify_count ?? 0}
          </div>
          <span className="text-[11px] font-bold text-amber-700">Challenged</span>
        </div>

        <div className="p-4 rounded-[20px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
          <span className="text-xs font-semibold text-slate-400">Security BLOCK</span>
          <div className="mt-1 text-2xl font-extrabold font-mono text-rose-700">
            {stats.blocked_count ?? 0}
          </div>
          <span className="text-[11px] font-bold text-rose-700">Autonomous Halted</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 space-y-3 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search TXN ID, merchant, customer, or device ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white dark:bg-[#111827] transition-all shadow-inner"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>Decision:</span>
              <select
                value={decision}
                onChange={(e) => {
                  setDecision(e.target.value);
                  setPage(1);
                }}
                className="px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">ALL Decisions</option>
                <option value="ALLOW">ALLOW</option>
                <option value="VERIFY">VERIFY</option>
                <option value="BLOCK">BLOCK</option>
              </select>
            </div>

            <input
              type="number"
              placeholder="Min ₹"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-20 px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />

            <input
              type="number"
              placeholder="Max ₹"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-20 px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
            />

            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl transition-all shadow-md shadow-amber-600/20"
            >
              Apply Filter
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Transactions Table */}
      <div className="rounded-[22px] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-[#f8fafc] text-slate-500 dark:text-slate-400 font-bold">
                <th className="py-3.5 px-4">Transaction ID</th>
                <th className="py-3.5 px-3">Timestamp</th>
                <th className="py-3.5 px-3">Customer</th>
                <th className="py-3.5 px-3">Merchant / Purpose</th>
                <th className="py-3.5 px-3 text-right">Amount</th>
                <th className="py-3.5 px-3 text-center">Decision</th>
                <th className="py-3.5 px-3 text-center">Risk Score</th>
                <th className="py-3.5 px-3">Hardware / IP</th>
                <th className="py-3.5 px-4 text-center">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && !data ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mx-auto mb-2" />
                    Loading transaction records...
                  </td>
                </tr>
              ) : data?.items?.length > 0 ? (
                data.items.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:bg-slate-800/60/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {tx.transaction_id_str}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                      {tx.created_at ? new Date(tx.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' }) : '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                          {(tx.customer_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{tx.customer_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{tx.customer_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{tx.merchant}</div>
                      <div className="text-[10px] text-slate-400">{tx.merchant_category || 'RETAIL'}</div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-sm text-slate-900 dark:text-white">
                      ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {getDecisionBadge(tx.decision)}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono">
                      <span className={`font-bold ${tx.risk_score >= 70 ? 'text-rose-600' : (tx.risk_score >= 35 ? 'text-amber-600' : 'text-emerald-600')}`}>
                        {tx.risk_score}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-[10px] text-slate-400">
                      <div className="font-medium text-slate-700 dark:text-slate-300">{tx.device_id || 'Browser'}</div>
                      <div>{tx.ip_address || '127.0.0.1'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-3 py-1 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          View
                        </button>
                        <Link
                          href={`/server/cross-check?entity_type=transaction&entity_id=${tx.transaction_id_str}`}
                          className="p-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 transition-colors"
                          title="Graph relationship"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-400">
                    No transactions match the selected criteria.
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
              Page {data.page} of {data.pages} ({data.total} total transactions)
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

      {/* Transaction Detail Inspector Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-[22px] shadow-2xl p-6 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Transaction Audit Record
                </h3>
                <p className="text-xs font-mono text-blue-600 mt-0.5">
                  {selectedTx.transaction_id_str}
                </p>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Amount</span>
                <p className="text-lg font-extrabold font-mono text-slate-900 dark:text-white mt-0.5">
                  ₹{selectedTx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Risk Index & Decision</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">{selectedTx.risk_score}/100</span>
                  {getDecisionBadge(selectedTx.decision)}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Customer</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedTx.customer_name}</p>
                <p className="font-mono text-[10px] text-slate-400">{selectedTx.customer_email}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Payee / Merchant</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedTx.merchant}</p>
                <p className="text-[10px] text-slate-400">{selectedTx.merchant_category || 'UPI Merchant'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Device Hardware ID</span>
                <p className="font-mono text-[11px] text-slate-900 dark:text-white mt-0.5 truncate">{selectedTx.device_id || 'Web'}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 font-medium">Network Origin</span>
                <p className="font-mono text-[11px] text-slate-900 dark:text-white mt-0.5">{selectedTx.ip_address || '127.0.0.1'}</p>
                <p className="text-[10px] text-slate-400">{selectedTx.location || 'Local'}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <Link
                href={`/soc?tab=transactions&search=${selectedTx.transaction_id_str}`}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20"
              >
                <span>Investigate in SOC Center</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
