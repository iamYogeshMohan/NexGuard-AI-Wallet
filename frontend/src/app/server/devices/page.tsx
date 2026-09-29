'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Smartphone,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  ExternalLink,
  Ban,
  Activity,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function DeviceMonitorPage() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get('search') || '';

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('last_seen');
  const [sortDir, setSortDir] = useState('desc');

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDevices = async () => {
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

      const res = await api(`/server/devices?${q.toString()}`);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Failed to load device inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [page, status, sortBy, sortDir]);

  const handleDeviceAction = async (deviceId: string, action: 'quarantine' | 'block' | 'restore' | 'force_logout') => {
    const actionLabels: Record<string, string> = {
      quarantine: 'QUARANTINE device (mark SUSPICIOUS)',
      block: 'BLOCK device (reject all transactions & terminate sessions)',
      restore: 'RESTORE device to TRUSTED status',
      force_logout: 'FORCE LOGOUT all active sessions for this device',
    };

    const confirmed = confirm(`Are you sure you want to ${actionLabels[action]} for device ${deviceId}?`);
    if (!confirmed) return;

    setActionLoading(deviceId);
    try {
      await api(`/server/devices/${deviceId}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, reason: `Operator manual enforcement: ${action}` }),
      });
      fetchDevices();
    } catch (err: any) {
      alert('Action failed: ' + (err?.message || 'Error executing action'));
    } finally {
      setActionLoading(null);
    }
  };

  const getTrustBadge = (trust: string) => {
    switch (trust?.toUpperCase()) {
      case 'TRUSTED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            TRUSTED
          </span>
        );
      case 'SUSPICIOUS':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            SUSPICIOUS
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            BLOCKED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-800">
            {trust || 'UNKNOWN'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto text-slate-800 dark:text-slate-200">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-[#111827] rounded-[22px] p-6 border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Hardware Device Monitor</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Fingerprinted device registry, hardware trust ratings, and autonomous access enforcement actions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchDevices()}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh Devices</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-[20px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search device ID, device name, model, customer name, or IP..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:bg-[#111827] transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Trust Level:</span>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="ALL">All Trust Levels</option>
            <option value="TRUSTED">TRUSTED</option>
            <option value="SUSPICIOUS">SUSPICIOUS</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Devices Table */}
      <div className="rounded-[22px] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60/70 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Device ID</th>
                <th className="py-3 px-4">Device Name & Model</th>
                <th className="py-3 px-4">OS / Platform</th>
                <th className="py-3 px-4">Linked Customer</th>
                <th className="py-3 px-4">Network & IP</th>
                <th className="py-3 px-4 text-center">Trust Level</th>
                <th className="py-3 px-4 text-center">Trust Score</th>
                <th className="py-3 px-4 text-center">Enforcement Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && !data ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                    Loading devices...
                  </td>
                </tr>
              ) : data?.items?.length > 0 ? (
                data.items.map((d: any) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:bg-slate-800/60/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">
                      {d.device_id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">{d.device_name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{d.device_model || 'Standard Client'}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-slate-300">
                      {d.os || 'Unknown OS'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                          {(d.customer_name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{d.customer_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{d.customer_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      <div className="font-bold">{d.ip_address}</div>
                      <div className="text-[10px] text-slate-400">{d.ip_type || 'Internal'} · {d.location || 'Localhost'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getTrustBadge(d.trust_level)}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-black text-sm">
                      <span className={d.trust_score >= 80 ? 'text-emerald-600' : (d.trust_score >= 40 ? 'text-amber-600' : 'text-rose-600')}>
                        {d.trust_score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {d.trust_level !== 'SUSPICIOUS' && (
                          <button
                            onClick={() => handleDeviceAction(d.device_id, 'quarantine')}
                            disabled={actionLoading === d.device_id}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
                            title="Quarantine device"
                          >
                            Quarantine
                          </button>
                        )}
                        {d.trust_level !== 'BLOCKED' && (
                          <button
                            onClick={() => handleDeviceAction(d.device_id, 'block')}
                            disabled={actionLoading === d.device_id}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                            title="Block device hardware"
                          >
                            Block
                          </button>
                        )}
                        {d.trust_level !== 'TRUSTED' && (
                          <button
                            onClick={() => handleDeviceAction(d.device_id, 'restore')}
                            disabled={actionLoading === d.device_id}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            title="Restore trust"
                          >
                            Restore
                          </button>
                        )}
                        <button
                          onClick={() => handleDeviceAction(d.device_id, 'force_logout')}
                          disabled={actionLoading === d.device_id}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Invalidate sessions on this device"
                        >
                          Logout
                        </button>
                        <Link
                          href={`/server/cross-check?entity_type=device&entity_id=${d.device_id}`}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-blue-600 transition-colors"
                          title="View device graph"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-slate-400 font-medium">
                    No devices registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.pages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Page {data.page} of {data.pages} ({data.total} total devices)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono font-bold px-2 py-0.5 text-slate-800 dark:text-slate-200">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                disabled={page >= data.pages}
                className="p-1.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 disabled:opacity-40"
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
