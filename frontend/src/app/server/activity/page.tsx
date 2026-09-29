'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Radio,
  Search,
  Filter,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  Trash2,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Server,
} from 'lucide-react';
import { api, WS_SOC_URL } from '@/lib/api';

export default function LiveActivityPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initial fetch from backend REST audit log
  const fetchInitialLogs = async () => {
    setLoading(true);
    try {
      const res = await api('/server/activity?limit=50');
      setEvents(res.items || []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialLogs();
  }, []);

  // WebSocket Live Connection
  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_SOC_URL);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        if (isPaused) return;
        try {
          const payload = JSON.parse(event.data);
          const newEntry = {
            id: Date.now() + Math.random(),
            timestamp: payload.timestamp || new Date().toISOString(),
            event: payload.type || payload.event || 'SYSTEM_EVENT',
            user: payload.actor || payload.user || 'SYSTEM',
            role: payload.role || 'CORE',
            resource_type: payload.resource_type || 'EVENT',
            resource_id: payload.resource_id || payload.device_id || payload.transaction_id || '',
            description: payload.message || payload.description || JSON.stringify(payload.data || payload),
            metadata: payload,
          };
          setEvents((prev) => [newEntry, ...prev.slice(0, 199)]);
        } catch {
          // ignore non-json
        }
      };
    } catch (e) {
      console.error('WS Error:', e);
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isPaused]);

  const filteredEvents = events.filter((ev) => {
    if (filterType !== 'ALL' && !ev.event?.toUpperCase().includes(filterType)) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchEvent = ev.event?.toLowerCase().includes(q);
      const matchDesc = ev.description?.toLowerCase().includes(q);
      const matchUser = ev.user?.toLowerCase().includes(q);
      const matchResource = ev.resource_id?.toString().toLowerCase().includes(q);
      if (!matchEvent && !matchDesc && !matchUser && !matchResource) return false;
    }
    return true;
  });

  const getEventBadge = (action: string) => {
    const act = action?.toUpperCase() || '';
    if (act.includes('BLOCK') || act.includes('QUARANTINE') || act.includes('ATTACK')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (act.includes('VERIFY') || act.includes('WARNING') || act.includes('RESTRICT')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (act.includes('ALLOW') || act.includes('RESTORE') || act.includes('ACTIVE') || act.includes('SUCCESS')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto text-slate-800 dark:text-slate-200">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-[#111827] rounded-[22px] p-6 border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Live Activity Event Ledger</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Stream
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Real-time WebSocket event ledger recording operational state changes, threat actions, and administrative commands.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-all shadow-sm ${
              isPaused
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Stream' : 'Pause Stream'}</span>
          </button>

          {/* Clear Button */}
          <button
            onClick={() => setEvents([])}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 hover:text-rose-600 border border-slate-200 dark:border-slate-800 transition-colors shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-[20px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter event name, user, or description text..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:bg-[#111827] transition-colors"
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {['ALL', 'TRANSACTION', 'DEVICE', 'SESSION', 'ACCOUNT', 'USER'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm ${
                filterType === type
                  ? 'bg-blue-600 text-white shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Stream Feed Table */}
      <div className="rounded-[22px] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60/70 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4 w-32">Timestamp</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Actor / Operator</th>
                <th className="py-3 px-4">Resource Target</th>
                <th className="py-3 px-4">Event Description</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading && events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                    Connecting to live activity stream...
                  </td>
                </tr>
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((ev: any) => (
                  <React.Fragment key={ev.id}>
                    <tr className="hover:bg-slate-50 dark:bg-slate-800/60/80 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase border ${getEventBadge(ev.event)}`}>
                          {ev.event}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {ev.user}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {ev.resource_type ? `${ev.resource_type}: ` : ''}{ev.resource_id || '—'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {ev.description}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                          <button
                            onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-blue-600 transition-colors"
                          >
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedId === ev.id ? 'rotate-180 text-blue-600' : ''}`} />
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Metadata JSON Drawer */}
                    {expandedId === ev.id && (
                      <tr className="bg-slate-50 dark:bg-slate-800/60/70">
                        <td colSpan={6} className="p-4">
                          <pre className="text-[11px] font-mono text-slate-800 dark:text-slate-200 bg-white dark:bg-[#111827] p-4 rounded-xl overflow-x-auto max-h-56 border border-slate-200 dark:border-slate-800 shadow-inner">
                            {JSON.stringify(ev.metadata, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-medium">
                    No activity events match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
