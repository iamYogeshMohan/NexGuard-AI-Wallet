'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Shield,
  Smartphone,
  CreditCard,
  Wallet,
  Landmark,
  KeyRound,
  Activity,
  ChevronRight,
  ChevronLeft,
  X,
  RefreshCw,
  Lock,
  Unlock,
  ShieldCheck,
  Copy,
  Check,
  Building2,
  Clock,
  ArrowUpRight,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function UserManagementPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams?.get('search') || '';

  // Filter & Pagination States
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [role, setRole] = useState('ALL');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');

  // Data States
  const [usersData, setUsersData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');

  // Customer 360 Drawer State
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Fetch Users
  const fetchUsers = async () => {
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
      if (role !== 'ALL') q.set('role', role);

      const res = await api(`/server/users?${q.toString()}`);
      setUsersData(res);
      setLastSyncTime('Just now');
    } catch (err: any) {
      setError(err?.message || 'Unable to load customer directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, status, role, sortBy, sortDir]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  // Clear Filters
  const handleClearFilters = () => {
    setSearch('');
    setStatus('ALL');
    setRiskFilter('ALL');
    setRole('ALL');
    setPage(1);
  };

  // Open 360 Drawer
  const openUserDetail = async (userId: number) => {
    setSelectedUserId(userId);
    setDetailLoading(true);
    try {
      const res = await api(`/server/users/${userId}`);
      setUserDetail(res);
    } catch (err: any) {
      alert('Failed to load customer profile details: ' + (err?.message || 'Error'));
      setSelectedUserId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // Copy UPI Helper
  const handleCopyUpi = (upiId: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  // Update Status Action
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedUserId) return;
    const confirmed = confirm(`Are you sure you want to change this customer status to ${newStatus}?`);
    if (!confirmed) return;

    setStatusActionLoading(true);
    try {
      await api(`/server/users/${selectedUserId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus, reason: `Admin manual update to ${newStatus}` }),
      });
      const updatedDetail = await api(`/server/users/${selectedUserId}`);
      setUserDetail(updatedDetail);
      fetchUsers();
    } catch (err: any) {
      alert('Failed to update customer status: ' + (err?.message || 'Error'));
    } finally {
      setStatusActionLoading(false);
    }
  };

  // Status Badge Helper matching /home pill design
  const getStatusBadge = (st: string) => {
    switch (st?.toUpperCase()) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        );
      case 'RESTRICTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Restricted
          </span>
        );
      case 'FROZEN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Frozen
          </span>
        );
      case 'BLOCKED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Blocked
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            {st || 'Unknown'}
          </span>
        );
    }
  };

  // Risk Score Badge Helper matching /home pill design
  const getRiskBadge = (score: number = 0) => {
    let bg = 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    let label = 'LOW';
    if (score >= 75) {
      bg = 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800';
      label = 'HIGH';
    } else if (score >= 40) {
      bg = 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      label = 'MED';
    }
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border font-mono shadow-sm ${bg}`}>
        <span>{score}</span>
        <span className="text-[9px] uppercase tracking-wider opacity-80">· {label}</span>
      </span>
    );
  };

  // Filter items based on client-side risk filter
  const filteredItems = useMemo(() => {
    if (!usersData?.items) return [];
    let items = [...usersData.items];
    if (riskFilter === 'LOW') {
      items = items.filter((u) => (u.risk_score || 0) < 40);
    } else if (riskFilter === 'MEDIUM') {
      items = items.filter((u) => (u.risk_score || 0) >= 40 && (u.risk_score || 0) < 75);
    } else if (riskFilter === 'HIGH') {
      items = items.filter((u) => (u.risk_score || 0) >= 75);
    }
    return items;
  }, [usersData, riskFilter]);

  // KPI Calculations from backend items
  const kpiStats = useMemo(() => {
    const total = usersData?.total ?? 0;
    const items = usersData?.items || [];
    const active = items.filter((u: any) => u.account_status === 'ACTIVE').length;
    const restricted = items.filter((u: any) => u.account_status === 'RESTRICTED').length;
    const frozen = items.filter((u: any) => u.account_status === 'FROZEN').length;
    const blocked = items.filter((u: any) => u.account_status === 'BLOCKED').length;
    const highRisk = items.filter((u: any) => (u.risk_score || 0) >= 75).length;

    return { total, active, highRisk, restricted, frozen, blocked };
  }, [usersData]);

  return (
    <div className="space-y-8 max-w-[1240px] mx-auto pb-20 pt-2 font-sans">
      
      {/* ── 1. PAGE HEADER (Styled with /home Clean Branding & Pills) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-2 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>NexGuard Enterprise Banking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1">
            User Management & Customer Profiles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage customer identities, accounts, simulated bank balances, device trust levels, and security controls.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <span>Last synchronized:</span>
            <span className="font-mono text-slate-600 dark:text-slate-300 font-semibold">{lastSyncTime}</span>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Backend Connected</span>
          </div>

          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow transition-all active:scale-[0.98]"
            title="Refresh User Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600 dark:text-blue-400' : 'text-slate-500'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. METRIC KPI STRIP (Styled with /home Card Tokens) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 my-4 sm:my-6">
        {/* TOTAL USERS */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all min-h-[110px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Total Users
            </span>
            <Users className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-slate-900 dark:text-white">
            {kpiStats.total}
          </div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">
            Registered Customers
          </div>
        </div>

        {/* ACTIVE */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all min-h-[110px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Active
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-emerald-600 dark:text-emerald-400">
            {kpiStats.active}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
            Normal Operations
          </div>
        </div>

        {/* HIGH RISK */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all min-h-[110px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              High Risk
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-rose-600 dark:text-rose-400">
            {kpiStats.highRisk}
          </div>
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-1">
            Score ≥ 75
          </div>
        </div>

        {/* RESTRICTED */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all min-h-[110px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Restricted
            </span>
            <Lock className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-amber-600 dark:text-amber-400">
            {kpiStats.restricted}
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium mt-1">
            Limits Enforced
          </div>
        </div>

        {/* FROZEN */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all min-h-[110px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Frozen
            </span>
            <Shield className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-sky-600 dark:text-sky-400">
            {kpiStats.frozen}
          </div>
          <div className="text-[10px] text-sky-600 dark:text-sky-400 font-medium mt-1">
            Temporary Hold
          </div>
        </div>

        {/* BLOCKED */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-all min-h-[110px] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Blocked
            </span>
            <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold font-mono tracking-tight text-rose-600 dark:text-rose-400">
            {kpiStats.blocked}
          </div>
          <div className="text-[10px] text-rose-600 dark:text-rose-400 font-medium mt-1">
            Compliance Ban
          </div>
        </div>
      </div>

      {/* ── 3. SEARCH AND FILTER TOOLBAR (Styled with /home Input Tokens) ── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-none my-4 sm:my-6">
        {/* Search Field */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search user, customer ID, UPI ID, device..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-[0_2px_8px_rgba(37,99,235,0.25)] active:scale-[0.98] shrink-0"
          >
            Search
          </button>
        </form>

        {/* Compact Filters with /home Soft Select Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-semibold hidden sm:inline">Status:</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="RESTRICTED">RESTRICTED</option>
              <option value="FROZEN">FROZEN</option>
              <option value="BLOCKED">BLOCKED</option>
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-semibold hidden sm:inline">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="ALL">All Risk</option>
              <option value="LOW">Low (0–39)</option>
              <option value="MEDIUM">Medium (40–74)</option>
              <option value="HIGH">High (75–100)</option>
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px] font-semibold hidden sm:inline">Role:</span>
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer transition-all"
            >
              <option value="ALL">All Roles</option>
              <option value="CUSTOMER">Customer</option>
              <option value="SOC_ANALYST">SOC Analyst</option>
              <option value="BANK_MANAGER">Bank Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(search || status !== 'ALL' || riskFilter !== 'ALL' || role !== 'ALL') && (
            <button
              onClick={handleClearFilters}
              className="px-3.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1.5 transition-colors rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 text-xs bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 rounded-2xl flex items-center justify-between my-3 shadow-sm">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>Unable to load customers: {error}</span>
          </div>
          <button
            onClick={() => fetchUsers()}
            className="px-3 py-1.5 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 transition-colors shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 4. ENTERPRISE CUSTOMER TABLE (Styled with /home Cards & Pill Badges) ── */}
      <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.04)] dark:shadow-none mt-4 sm:mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-4 px-4 min-w-[200px]">Customer</th>
                <th className="py-4 px-3.5 min-w-[140px]">UPI ID</th>
                <th className="py-4 px-3.5 min-w-[160px]">Contact</th>
                <th className="py-4 px-3 text-center min-w-[90px]">Risk Score</th>
                <th className="py-4 px-4 text-right min-w-[140px]">Wallet Balance</th>
                <th className="py-4 px-4 text-right min-w-[150px]">Bank Balance</th>
                <th className="py-4 px-3.5 text-center min-w-[110px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {loading && !usersData ? (
                // Skeleton loading rows
                [...Array(6)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="space-y-1.5">
                          <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                          <div className="w-16 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4.5 px-3.5">
                      <div className="w-28 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                    </td>
                    <td className="py-4.5 px-3.5">
                      <div className="space-y-1.5">
                        <div className="w-24 h-3 bg-slate-200 dark:bg-slate-800 rounded" />
                        <div className="w-28 h-2.5 bg-slate-200 dark:bg-slate-800 rounded" />
                      </div>
                    </td>
                    <td className="py-4.5 px-3 text-center">
                      <div className="w-14 h-5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
                    </td>
                    <td className="py-4.5 px-4 text-right">
                      <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                    </td>
                    <td className="py-4.5 px-4 text-right">
                      <div className="w-16 h-3 bg-slate-200 dark:bg-slate-800 rounded ml-auto" />
                    </td>
                    <td className="py-4.5 px-3.5 text-center">
                      <div className="w-20 h-5 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredItems.length > 0 ? (
                filteredItems.map((u: any) => {
                  const initial = (u.name || 'U').charAt(0).toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      onClick={() => openUserDetail(u.id)}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      title="Click to view Customer 360°"
                    >
                      {/* 1. CUSTOMER */}
                      <td className="py-4.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-xs shrink-0 shadow-sm border border-white/20 dark:border-slate-700">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white text-xs group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5 truncate">
                              <span>{u.name}</span>
                              <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded-md font-bold border border-blue-200 dark:border-blue-800">
                                {u.customer_id}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                              {u.username ? `@${u.username}` : u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. UPI ID */}
                      <td className="py-4.5 px-3.5">
                        <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-950/40 px-2 py-0.5 rounded-lg border border-blue-100 dark:border-blue-900/40 inline-block truncate max-w-[140px]">
                          {u.upi_id}
                        </span>
                      </td>

                      {/* 3. CONTACT */}
                      <td className="py-4.5 px-3.5">
                        <div className="font-mono text-xs text-slate-800 dark:text-slate-200 font-medium">
                          {u.mobile || '—'}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px] mt-0.5">
                          {u.email}
                        </div>
                      </td>

                      {/* 4. RISK */}
                      <td className="py-4.5 px-3 text-center">
                        {getRiskBadge(u.risk_score)}
                      </td>

                      {/* 5. WALLET BALANCE */}
                      <td className="py-4.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          ₹{(u.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                          Wallet
                        </span>
                      </td>

                      {/* 6. BANK BALANCE */}
                      <td className="py-4.5 px-4 text-right">
                        <div className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                          ₹{(u.bank_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                          NG Bank (Simulated)
                        </span>
                      </td>

                      {/* 7. STATUS */}
                      <td className="py-4.5 px-3.5 text-center">
                        {getStatusBadge(u.account_status)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-xs text-slate-400">
                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">No customers found</p>
                    <p className="mt-1 text-slate-400">Try changing your search or filters.</p>
                    {(search || status !== 'ALL' || riskFilter !== 'ALL' || role !== 'ALL') && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-3.5 px-4 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── 5. PAGINATION (Styled with /home Card Footer) ── */}
        {usersData && (
          <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Showing <span className="font-bold text-slate-700 dark:text-slate-200">{(usersData.page - 1) * usersData.limit + 1}–
              {Math.min(usersData.page * usersData.limit, usersData.total)}</span> of <span className="font-bold text-slate-700 dark:text-slate-200">{usersData.total}</span> customers
            </span>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 font-bold transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <span className="font-mono px-3.5 py-1.5 font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                {page} of {usersData.pages || 1}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(usersData.pages, p + 1))}
                disabled={page >= usersData.pages}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-1 font-bold transition-all"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── 6. CUSTOMER 360 DRAWER (380–440px wide) ── */}
      {selectedUserId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-end animate-in fade-in duration-150">
          <div className="w-full max-w-[420px] bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-slate-800 h-full overflow-y-auto shadow-2xl flex flex-col text-slate-900 dark:text-white animate-in slide-in-from-right duration-200">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Customer 360°
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedUserId(null);
                  setUserDetail(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {detailLoading || !userDetail ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-2.5 p-8 text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                <span>Aggregating Customer 360° data...</span>
              </div>
            ) : (
              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                
                {/* Customer Identity Card */}
                <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-800/50 dark:to-slate-900/60 border border-slate-200/90 dark:border-slate-800 space-y-3.5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md border border-white/20 dark:border-slate-700 shrink-0">
                        {(userDetail.profile?.name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                          {userDetail.profile?.name}
                        </h3>
                        <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                          {userDetail.profile?.customer_id}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      {getStatusBadge(userDetail.profile?.account_status)}
                    </div>
                  </div>

                  {/* UPI & Risk Badge */}
                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/50 px-2 py-0.5 rounded-lg border border-blue-200/60 dark:border-blue-800/60">
                        {userDetail.profile?.upi_id}
                      </span>
                      <button
                        onClick={() => handleCopyUpi(userDetail.profile?.upi_id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {getRiskBadge(userDetail.security_posture?.composite_risk_score ?? 12)}
                  </div>
                </div>

                {/* Section: ACCOUNT */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/70 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-purple-600" />
                      Account
                    </span>
                    <span className="text-emerald-600 font-bold">Active</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">NG Bank (Simulated)</p>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        NG••{userDetail.account?.account_number?.slice(-4) || '8819'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        ₹{(userDetail.account?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Bank Balance</p>
                    </div>
                  </div>
                </div>

                {/* Section: WALLET */}
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/70 space-y-2.5 shadow-sm">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                      Wallet
                    </span>
                    <span className="text-emerald-600 font-bold">Active</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        WAL-{userDetail.profile?.customer_id?.slice(-4) || '0001'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">Kyber-1024 PQC</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{(userDetail.wallet?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Wallet Balance</p>
                    </div>
                  </div>
                </div>

                {/* Grid: DEVICES & SESSIONS */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Devices
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
                      {userDetail.devices?.length || 0} Devices
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {userDetail.devices?.filter((d: any) => d.trust_level === 'TRUSTED').length || 0} Trusted
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Sessions
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-1">
                      {userDetail.sessions?.filter((s: any) => s.is_active).length || 0} Active
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {userDetail.sessions?.length || 0} Total logins
                    </p>
                  </div>
                </div>

                {/* Grid: TRANSACTIONS & BENEFICIARIES */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Transactions
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {userDetail.transactions_summary?.total_count || userDetail.transactions?.length || 0} Total
                    </p>
                    <p className="text-[10px] text-rose-500 font-semibold mt-0.5">
                      {userDetail.transactions_summary?.blocked_count || 0} Blocked
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Beneficiaries
                    </span>
                    <p className="text-sm font-mono font-bold text-slate-900 dark:text-white mt-0.5">
                      {userDetail.beneficiaries?.length || 0} Active
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Whitelist verified</p>
                  </div>
                </div>

                {/* Section: SECURITY & INCIDENTS */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-blue-600" />
                      Security & Posture
                    </span>
                    <span className="font-mono text-emerald-600">
                      Score: {userDetail.security_posture?.composite_risk_score ?? 12}/100
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 dark:text-slate-400">Security Incidents:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {userDetail.incidents?.length || 0} Active
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Recent Security Events:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {userDetail.security_posture?.recent_security_events ?? 0}
                    </span>
                  </div>
                </div>

                {/* Section: ADMINISTRATIVE ACTIONS */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Administrative Controls
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {userDetail.profile?.account_status !== 'ACTIVE' && (
                      <button
                        onClick={() => handleStatusChange('ACTIVE')}
                        disabled={statusActionLoading}
                        className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Activate</span>
                      </button>
                    )}

                    {userDetail.profile?.account_status !== 'FROZEN' && (
                      <button
                        onClick={() => handleStatusChange('FROZEN')}
                        disabled={statusActionLoading}
                        className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Freeze</span>
                      </button>
                    )}

                    {userDetail.profile?.account_status !== 'RESTRICTED' && (
                      <button
                        onClick={() => handleStatusChange('RESTRICTED')}
                        disabled={statusActionLoading}
                        className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Restrict</span>
                      </button>
                    )}

                    {userDetail.profile?.account_status !== 'BLOCKED' && (
                      <button
                        onClick={() => handleStatusChange('BLOCKED')}
                        disabled={statusActionLoading}
                        className="py-1.5 px-3 text-xs font-semibold rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Block</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Action: Open Full Profile / Cross-Check */}
                <div className="pt-2">
                  <Link
                    href={`/server/cross-check?entity_type=customer&entity_id=${userDetail.profile?.id}`}
                    className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Open Full Profile & Graph</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
