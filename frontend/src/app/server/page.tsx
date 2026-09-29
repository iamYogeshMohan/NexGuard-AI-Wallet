'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Server,
  Activity,
  Users,
  CreditCard,
  Landmark,
  Wallet,
  Smartphone,
  KeyRound,
  Network,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  Radio,
  Cpu,
  Database,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  ChevronRight,
  ArrowLeftRight,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function ServerOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api('/server/overview');
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch server operations status');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading Server Operations & Controls...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const decisions = data?.decisions || {};
  const health = data?.health || {};
  const recentActivity = data?.recent_activity || [];

  return (
    <div className="space-y-6">
      {/* ── Page Title Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight m-0">
            System Operations & Controls
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Platform Infrastructure • Simulated NG Bank Ledger • 10 AI Agents
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>All Systems Active</span>
          </div>

          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600 dark:text-blue-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 rounded-xl flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Hero Platform Operations Card (Modeled after Customer Profile Card in Image 2) ── */}
      <div className="bg-white dark:bg-[#111827] rounded-[22px] p-6 border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5 transition-colors duration-150">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* 54px Avatar Circle with Blue Gradient matching Image 2 */}
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 to-blue-700 text-white font-extrabold flex items-center justify-center text-xl shadow-md shrink-0">
              <Server className="w-6 h-6" />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111827]" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white m-0">
                  NexGuard Core Platform
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                  v2.0 Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Central Operations Ledger • Post-Quantum Cryptography • Real-Time SOC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/server/users"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Customer Profiles</span>
            </Link>
            <Link
              href="/soc"
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all border border-slate-200 dark:border-slate-700 flex items-center gap-1.5"
            >
              <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>SOC Center</span>
            </Link>
          </div>
        </div>

        {/* Clean Info Sub-Grid matching the profile contact box in Image 2 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-400 font-medium text-[11px]">Customers Registered</span>
            <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5 flex items-center gap-1">
              <span>{kpis.total_users ?? 0}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">({kpis.active_users ?? 0} Active)</span>
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-medium text-[11px]">NG Bank Accounts</span>
            <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">
              {kpis.total_accounts ?? 0} Linked
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-medium text-[11px]">Digital Float Wallets</span>
            <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">
              {kpis.total_wallets ?? 0} (100% Kyber-1024)
            </p>
          </div>

          <div>
            <span className="text-slate-400 font-medium text-[11px]">Hardware Devices</span>
            <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">
              {kpis.connected_devices ?? 0} Fingerprinted
            </p>
          </div>
        </div>
      </div>

      {/* ── NG Bank Liquidity & Volume Card (Modeled after NG Bank Card in Image 2) ── */}
      <div className="bg-white dark:bg-[#111827] rounded-[22px] p-6 border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4 transition-colors duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white m-0">
                NG Bank (Simulated Settlement)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                Central Reserve Ledger • Instant Settlement
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
            <span>Operational Active</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Cumulative Platform Throughput
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              ₹{(kpis.total_transaction_value || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Average ticket: ₹{(kpis.average_transaction_value || 0).toLocaleString('en-IN', { maximumFractionDigits: 1 })} across {kpis.total_transactions ?? 0} lifetime payments
            </p>
          </div>

          <Link
            href="/server/transactions"
            className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>View Payments Journal</span>
          </Link>
        </div>
      </div>

      {/* ── Section Title ── */}
      <div className="pt-2">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          AI Risk Engine & Autonomous Decision Breakdown
        </h3>
      </div>

      {/* ── Decision Breakdown Cards (Clean Light & Dark Fintech Style) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ALLOW */}
        <div className="bg-white dark:bg-[#111827] rounded-[20px] p-5 border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">ALLOW</span>
                <p className="text-[10px] text-slate-400 font-medium">Instant Clearance</p>
              </div>
            </div>
            <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
              {decisions.allow_pct ?? 0}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${decisions.allow_pct || 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {decisions.allow ?? 0} transactions approved seamlessly
          </p>
        </div>

        {/* VERIFY */}
        <div className="bg-white dark:bg-[#111827] rounded-[20px] p-5 border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">VERIFY</span>
                <p className="text-[10px] text-slate-400 font-medium">Step-Up Challenge</p>
              </div>
            </div>
            <span className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
              {decisions.verify_pct ?? 0}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${decisions.verify_pct || 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {decisions.verify ?? 0} challenged with OTP/biometrics
          </p>
        </div>

        {/* BLOCK */}
        <div className="bg-white dark:bg-[#111827] rounded-[20px] p-5 border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-3 transition-colors duration-150">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">BLOCK</span>
                <p className="text-[10px] text-slate-400 font-medium">Autonomous Halt</p>
              </div>
            </div>
            <span className="text-xl font-extrabold font-mono text-rose-600 dark:text-rose-400">
              {decisions.block_pct ?? 0}%
            </span>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all"
              style={{ width: `${decisions.block_pct || 0}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {decisions.block ?? 0} halted autonomously by Sentinel
          </p>
        </div>
      </div>

      {/* ── Infrastructure Health & Recent Platform Activity Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core Infrastructure Health (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#111827] rounded-[22px] p-6 border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4 transition-colors duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Core Infrastructure Status</span>
              </h3>
              <p className="text-[11px] text-slate-400">FastAPI, SQLite, WS, AI & Cryptography</p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              100% ONLINE
            </span>
          </div>

          <div className="space-y-2.5">
            {/* FastAPI Engine */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">FastAPI Core Engine</p>
                  <p className="text-[10px] text-slate-400">v{health.api?.version || '2.0.0'} · Latency {health.api?.response_time_ms || 11}ms</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            {/* SQLite Ledger */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">SQLite Ledger Database</p>
                  <p className="text-[10px] text-slate-400">Ping &lt;1ms · Instant Settlement</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ACTIVE
              </span>
            </div>

            {/* WebSocket Stream */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">WebSocket Broadcaster</p>
                  <p className="text-[10px] text-slate-400">Live SOC & Device Streams</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                BROADCASTING
              </span>
            </div>

            {/* AI Agents */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">AI Multi-Agent Engine</p>
                  <p className="text-[10px] text-slate-400">10 Autonomous Agents Running</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                PROTECTING
              </span>
            </div>

            {/* PQC Auth */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Post-Quantum Auth</p>
                  <p className="text-[10px] text-slate-400">NIST FIPS 203 ML-KEM Kyber-1024</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                ENCRYPTED
              </span>
            </div>
          </div>
        </div>

        {/* Recent Platform Operations Table (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#111827] rounded-[22px] p-6 border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4 flex flex-col justify-between transition-colors duration-150">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Recent Platform Operations</span>
                </h3>
                <p className="text-[11px] text-slate-400">Live operational ledger of logins, authorizations, and audits</p>
              </div>
              <Link
                href="/server/activity"
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold flex items-center gap-1 transition-colors"
              >
                <span>Full Ledger</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto mt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="py-3 px-3 whitespace-nowrap">Time</th>
                    <th className="py-3 px-3">Event</th>
                    <th className="py-3 px-3">Actor</th>
                    <th className="py-3 px-3">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentActivity.length > 0 ? (
                    recentActivity.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:bg-slate-800/60/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            {log.event}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {log.user}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={log.description}>
                          {log.description}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-xs text-slate-400">
                        No recent operational activity recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub-Modules Quick Navigation ── */}
      <div className="pt-2 space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
          Server Operations Modules
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <Link
            href="/server/users"
            className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">User Management</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Customer 360°</p>
            </div>
            <span className="mt-3 text-[10px] font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
              <span>Inspect</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            href="/server/accounts"
            className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 hover:border-purple-500/40 dark:hover:border-purple-500/40 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Landmark className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">Account Monitoring</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">NG Bank Accounts</p>
            </div>
            <span className="mt-3 text-[10px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
              <span>Inspect</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            href="/server/wallets"
            className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Wallet className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">Wallet Monitoring</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Balances & Posture</p>
            </div>
            <span className="mt-3 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span>Inspect</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            href="/server/transactions"
            className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 hover:border-amber-500/40 dark:hover:border-amber-500/40 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">Transaction Monitor</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Central Journal</p>
            </div>
            <span className="mt-3 text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span>Inspect</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </Link>

          <Link
            href="/server/devices"
            className="p-4 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                <Smartphone className="w-5 h-5" />
              </div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">Device Monitor</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">Hardware Registry</p>
            </div>
            <span className="mt-3 text-[10px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1">
              <span>Inspect</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
