'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Server,
  Search,
  Activity,
  CheckCircle2,
  X,
  ChevronRight,
  Shield,
  User,
  CreditCard,
  Smartphone,
  AlertOctagon,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { api } from '@/lib/api';

export default function ServerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // System Health Status Pill
  const [healthStatus, setHealthStatus] = useState<'OPERATIONAL' | 'DEGRADED' | 'CHECKING'>('CHECKING');

  const fetchHealth = async () => {
    try {
      const data = await api('/server/overview');
      if (data?.health?.database?.status === 'OPERATIONAL') {
        setHealthStatus('OPERATIONAL');
      } else {
        setHealthStatus('DEGRADED');
      }
    } catch {
      setHealthStatus('DEGRADED');
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  // Global search debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api(`/server/search?q=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults(res.results || []);
        setShowSearchDropdown(true);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside search dismiss
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper for Breadcrumbs
  const getSectionTitle = () => {
    if (pathname === '/server') return 'System Overview';
    if (pathname.startsWith('/server/users')) return 'User Management';
    if (pathname.startsWith('/server/accounts')) return 'Account Monitoring';
    if (pathname.startsWith('/server/wallets')) return 'Wallet Monitoring';
    if (pathname.startsWith('/server/transactions')) return 'Transaction Monitor';
    if (pathname.startsWith('/server/devices')) return 'Device Monitor';
    if (pathname.startsWith('/server/sessions')) return 'Session Monitor';
    if (pathname.startsWith('/server/activity')) return 'Live Activity Stream';
    if (pathname.startsWith('/server/cross-check')) return 'Cross-Check Graph';
    if (pathname.startsWith('/server/analytics')) return 'Usage Analytics';
    return 'Server Operations';
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'CUSTOMER':
        return <User className="w-4 h-4 text-blue-600" />;
      case 'TRANSACTION':
        return <CreditCard className="w-4 h-4 text-emerald-600" />;
      case 'ACCOUNT':
        return <Server className="w-4 h-4 text-purple-600" />;
      case 'DEVICE':
        return <Smartphone className="w-4 h-4 text-amber-600" />;
      case 'INCIDENT':
        return <AlertOctagon className="w-4 h-4 text-rose-600" />;
      default:
        return <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-150" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* ── Top Header Bar in Clean Fintech Style Supporting Both Dark & Light Themes ── */}
      <header
        className="sticky top-0 z-30 px-4 sm:px-6 py-3 shadow-sm transition-colors duration-150"
        style={{
          background: 'var(--bg-overlay)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div className="max-w-[1240px] mx-auto flex items-center justify-between gap-4">
          
          {/* Breadcrumbs & Badge */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/server"
              className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-500 hover:text-blue-400 transition-colors shrink-0"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shadow-sm"
                style={{
                  background: 'var(--primary-light)',
                  border: '1px solid var(--primary-border)',
                  color: 'var(--primary)',
                }}
              >
                <Server className="w-4 h-4" />
              </div>
              <span className="hidden sm:inline font-extrabold tracking-tight">NexGuard Operations</span>
              <span className="sm:hidden font-bold">Ops</span>
            </Link>
            
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            
            <span className="text-xs sm:text-sm font-extrabold truncate" style={{ color: 'var(--text-primary)' }}>
              {getSectionTitle()}
            </span>

            {/* Live Operational Status Pill matching Image 2 KYC Verified badge */}
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 shadow-sm ml-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{healthStatus === 'OPERATIONAL' ? 'KYC & Systems Active' : 'Checking Systems...'}</span>
            </div>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Quick Search */}
            <div ref={searchRef} className="relative w-44 sm:w-64 lg:w-72">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search user, account, device..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchResults.length > 0) setShowSearchDropdown(true);
                  }}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl transition-all shadow-inner focus:outline-none"
                  style={{
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-dim)',
                    color: 'var(--text-primary)',
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setShowSearchDropdown(false);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Results Dropdown */}
              {showSearchDropdown && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl shadow-xl p-2.5 z-50 max-h-96 overflow-y-auto"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  {isSearching ? (
                    <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      Searching platform records...
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="space-y-1">
                      <div className="px-2 py-1 text-[10px] font-bold tracking-wider uppercase text-slate-400">
                        Matches found ({searchResults.length})
                      </div>
                      {searchResults.map((item, idx) => (
                        <div
                          key={`${item.type}-${item.id}-${idx}`}
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                            router.push(item.href);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors hover:bg-slate-500/10"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div
                              className="p-1.5 rounded-lg shrink-0"
                              style={{
                                background: 'var(--bg-surface-2)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              {getResultIcon(item.type)}
                            </div>
                            <div className="truncate text-left">
                              <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                {item.title}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {item.code} · {item.subtitle}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded-md font-mono font-bold uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 shrink-0">
                            {item.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No matching records found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick jump to Customer Profile in Wallet App */}
            <Link
              href="/profile"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-sm"
              style={{
                background: 'var(--bg-surface-2)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              title="Open Customer Profile in Wallet App"
            >
              <User className="w-3.5 h-3.5 text-blue-500" />
              <span>Wallet App</span>
            </Link>

            {/* Theme Toggle */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Server Ops Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-[1240px] w-full mx-auto space-y-8">
        {children}
      </main>
    </div>
  );
}
