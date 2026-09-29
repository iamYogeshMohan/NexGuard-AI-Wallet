'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  Users,
  CreditCard,
  ShieldAlert,
  Smartphone,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  PieChart,
  Activity,
  Calendar,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function UsageAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api('/server/analytics');
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load platform analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const userStats = data?.user_analytics || {};
  const txStats = data?.transaction_analytics || {};
  const secStats = data?.security_analytics || {};
  const platStats = data?.platform_analytics || {};
  const categories = txStats.categories || [];

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto text-slate-800 dark:text-slate-200">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-[#111827] rounded-[22px] p-6 border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Platform Usage & Throughput</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              Live Metrics
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Aggregate statistics, category volumes, risk profiles, and throughput calculated directly from live records.
          </p>
        </div>
        <button
          onClick={() => fetchAnalytics()}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Top 4 Metrics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-[22px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Customer Base</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {userStats.total_users ?? 0}
          </div>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {userStats.active_users ?? 0} Active (
            {userStats.total_users > 0 ? Math.round((userStats.active_users / userStats.total_users) * 100) : 0}%)
          </span>
        </div>

        <div className="p-5 rounded-[22px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cumulative Volume</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            ₹{(txStats.total_volume || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            Across {txStats.total_transactions ?? 0} transactions
          </span>
        </div>

        <div className="p-5 rounded-[22px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Average Risk Score</span>
          <div className="mt-2 text-2xl font-black text-blue-600">
            {secStats.average_risk_score ?? 0} / 100
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1 block">
            {secStats.high_risk_transactions ?? 0} High-risk events
          </span>
        </div>

        <div className="p-5 rounded-[22px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Active Concurrency</span>
          <div className="mt-2 text-2xl font-black text-slate-900 dark:text-white">
            {platStats.active_sessions ?? 0}
          </div>
          <span className="text-[11px] text-blue-600 font-bold flex items-center gap-1 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {platStats.connected_devices ?? 0} Devices Online
          </span>
        </div>
      </div>

      {/* Decision Distribution Breakdown */}
      <div className="p-6 rounded-[22px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Autonomous Payment Approvals vs Enforcement
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">ALLOW (Seamless)</span>
              <span className="font-mono font-black text-emerald-600">{txStats.allow_percentage ?? 0}%</span>
            </div>
            <div className="mt-2.5 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${txStats.allow_percentage || 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {txStats.allow_count ?? 0} allowed seamlessly
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">VERIFY (Step-Up)</span>
              <span className="font-mono font-black text-amber-600">{txStats.verify_percentage ?? 0}%</span>
            </div>
            <div className="mt-2.5 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${txStats.verify_percentage || 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {txStats.verify_count ?? 0} challenged with OTP/biometrics
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600">BLOCK (Halt)</span>
              <span className="font-mono font-black text-rose-600">{txStats.block_percentage ?? 0}%</span>
            </div>
            <div className="mt-2.5 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{ width: `${txStats.block_percentage || 0}%` }}
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {txStats.block_count ?? 0} flagged and halted by Sentinel
            </p>
          </div>
        </div>
      </div>

      {/* Category Volume & Security Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Merchant Category Distribution (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-[22px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Merchant Category Distribution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Transaction throughput by merchant classification</p>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
              {categories.length} Categories
            </span>
          </div>

          {categories.length > 0 ? (
            <div className="space-y-3">
              {categories.map((cat: any, idx: number) => {
                const totalVol = txStats.total_volume || 1;
                const pct = Math.round((cat.value / totalVol) * 100);
                return (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200 uppercase">
                        {cat.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 dark:text-white">₹{cat.value.toLocaleString('en-IN')}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">({cat.count} txns · {pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 font-medium">
              No transaction categories recorded yet.
            </div>
          )}
        </div>

        {/* Security & Incident Posture (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-[22px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
          <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Security Operations Posture
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Incident alerts and hardware isolation status</p>
          </div>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Total Security Incidents</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Generated by Autonomous AI Sentinel</p>
              </div>
              <span className="text-base font-black text-purple-700">
                {secStats.total_incidents ?? 0}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Open / Active Incidents</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Requiring analyst resolution</p>
              </div>
              <span className="text-base font-black text-rose-600">
                {secStats.open_incidents ?? 0}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Suspicious Devices</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Currently placed in Quarantine</p>
              </div>
              <span className="text-base font-black text-amber-600">
                {secStats.suspicious_devices ?? 0}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Blocked Devices</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Hardware IDs rejected</p>
              </div>
              <span className="text-base font-black text-rose-600">
                {secStats.blocked_devices ?? 0}
              </span>
            </div>

            <div className="pt-2">
              <Link
                href="/soc"
                className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Open Security Operations Center</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
