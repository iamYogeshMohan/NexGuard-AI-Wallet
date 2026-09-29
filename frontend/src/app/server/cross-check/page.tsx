'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Network,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Users,
  Landmark,
  Wallet,
  Smartphone,
  KeyRound,
  CreditCard,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function CrossCheckPage() {
  const searchParams = useSearchParams();
  const initialType = searchParams?.get('entity_type') || 'customer';
  const initialId = searchParams?.get('entity_id') || '1';

  const [entityType, setEntityType] = useState(initialType);
  const [entityId, setEntityId] = useState(initialId);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCrossCheck = async (type = entityType, id = entityId) => {
    if (!id.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api(`/server/cross-check?entity_type=${encodeURIComponent(type)}&entity_id=${encodeURIComponent(id.trim())}`);
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'Entity cross-check query failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCrossCheck(initialType, initialId);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCrossCheck();
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'customer':
        return <Users className="w-4 h-4 text-blue-600" />;
      case 'account':
        return <Landmark className="w-4 h-4 text-purple-600" />;
      case 'wallet':
        return <Wallet className="w-4 h-4 text-emerald-600" />;
      case 'device':
        return <Smartphone className="w-4 h-4 text-teal-600" />;
      case 'session':
        return <KeyRound className="w-4 h-4 text-cyan-600" />;
      case 'beneficiary':
        return <Users className="w-4 h-4 text-indigo-600" />;
      case 'transaction':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'incident':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      default:
        return <Network className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getNodeBorder = (type: string) => {
    switch (type) {
      case 'customer':
        return 'border-blue-200 bg-blue-50/40 hover:border-blue-300';
      case 'account':
        return 'border-purple-200 bg-purple-50/40 hover:border-purple-300';
      case 'wallet':
        return 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-300';
      case 'device':
        return 'border-teal-200 bg-teal-50/40 hover:border-teal-300';
      case 'session':
        return 'border-cyan-200 bg-cyan-50/40 hover:border-cyan-300';
      case 'beneficiary':
        return 'border-indigo-200 bg-indigo-50/40 hover:border-indigo-300';
      case 'transaction':
        return 'border-amber-200 bg-amber-50/40 hover:border-amber-300';
      case 'incident':
        return 'border-rose-200 bg-rose-50/40 hover:border-rose-300';
      default:
        return 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-300';
    }
  };

  const graphNodes = data?.graph?.nodes || [];
  const signals = data?.signals || [];
  const counts = data?.counts || {};
  const customer = data?.customer || {};

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto text-slate-800 dark:text-slate-200">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-[#111827] rounded-[22px] p-6 border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Relational Correlation Graph</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
              Cross-Check 360°
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Resolve 360° linkages across Customers, Accounts, Wallets, Hardware Devices, Sessions, Beneficiaries, and Security Incidents.
          </p>
        </div>
      </div>

      {/* Query Search Form Card */}
      <div className="p-4 rounded-[20px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">Lookup Entity:</span>
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="customer">Customer ID / Name</option>
              <option value="account">Account Number</option>
              <option value="wallet">Wallet ID</option>
              <option value="device">Device ID</option>
              <option value="transaction">Transaction ID</option>
              <option value="beneficiary">Beneficiary UPI</option>
            </select>
          </div>

          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="e.g. 1, CUST-0001, Rahul Sharma, ACC-0001, DEVICE-001..."
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:bg-[#111827] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Trace Linkages</span>
          </button>
        </form>
      </div>

      {error && (
        <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2">
          <XCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Target Entity Overview Card */}
      {data && (
        <div className="p-6 rounded-[22px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
                {(customer.name || 'C').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {customer.name}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {customer.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  {customer.customer_id} · {customer.email} · {customer.mobile}
                </p>
              </div>
            </div>

            {/* Quick Metrics Count */}
            <div className="flex items-center gap-2 flex-wrap text-xs font-semibold">
              <span className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700">
                {counts.accounts || 0} Accounts
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
                {counts.wallets || 0} Wallets
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-700">
                {counts.devices || 0} Devices
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700">
                {counts.sessions || 0} Sessions
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                {counts.beneficiaries || 0} Beneficiaries
              </span>
            </div>
          </div>

          {/* Security Signals / Suspicious Cross-Linkages */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Cross-Entity Security & Pattern Signals ({signals.length})
            </h4>
            {signals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {signals.map((sig: any, idx: number) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 ${
                      sig.severity === 'HIGH'
                        ? 'bg-rose-50/70 border-rose-200 text-rose-800'
                        : sig.severity === 'MEDIUM'
                        ? 'bg-amber-50/70 border-amber-200 text-amber-800'
                        : 'bg-blue-50/70 border-blue-200 text-blue-800'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{sig.type}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border">
                          {sig.severity}
                        </span>
                      </div>
                      <p className="mt-1 font-medium opacity-90">{sig.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>No anomalous multi-account or hardware sharing signals detected for this entity.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Relational Entity Cluster Visualizer Card */}
      <div className="p-6 rounded-[22px] bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-blue-600" />
              <span>360° Relational Graph Representation</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Correlated entities linked to this root customer profile across all databases.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800">
            {graphNodes.length} Linked Nodes
          </span>
        </div>

        {/* Visual Graph Nodes Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-2">
          {graphNodes.map((node: any) => (
            <div
              key={node.id}
              className={`p-4 rounded-2xl border transition-all hover:shadow-md flex flex-col justify-between ${getNodeBorder(
                node.type
              )}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800/80 shadow-sm">
                    {getNodeIcon(node.type)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {node.type}
                    </span>
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                      {node.label}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-600 shadow-sm">
                  {node.status}
                </span>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="truncate max-w-[150px] font-mono">{node.sub}</span>
                <Link
                  href={
                    node.type === 'customer'
                      ? `/server/users?search=${encodeURIComponent(node.label)}`
                      : node.type === 'account'
                      ? `/server/accounts?search=${encodeURIComponent(node.label)}`
                      : node.type === 'wallet'
                      ? `/server/wallets`
                      : node.type === 'device'
                      ? `/server/devices?search=${encodeURIComponent(node.label)}`
                      : `/server/transactions?search=${encodeURIComponent(node.label)}`
                  }
                  className="text-blue-600 hover:text-blue-700 ml-1 shrink-0 p-1 hover:bg-white dark:bg-[#111827] rounded-lg transition-colors"
                  title="Inspect"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
