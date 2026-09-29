'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Bell, Smartphone } from 'lucide-react';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

interface CustomerHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
}

export default function CustomerHeader({ title, subtitle, showBack }: CustomerHeaderProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    api('/wallet/notifications')
      .then((data) => {
        if (Array.isArray(data)) {
          const unread = data.filter((n: any) => !n.is_read).length;
          setUnreadCount(unread);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md transition-colors duration-200"
      style={{
        background: 'var(--bg-overlay)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Required Demo Environment Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 py-1 text-center">
        <p className="text-[10px] font-semibold tracking-wider text-amber-600 dark:text-amber-400 uppercase">
          DEMO BANKING ENVIRONMENT — NO REAL MONEY INVOLVED
        </p>
      </div>

      <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBack ? (
            <button
              onClick={() => window.history.back()}
              className="p-1 -ml-1 text-slate-400 hover:text-slate-100 rounded-lg cursor-pointer"
              aria-label="Go back"
              style={{ color: 'var(--text-secondary)' }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="text-sm font-bold tracking-tight leading-tight" style={{ color: 'var(--text-primary)' }}>
              {title || 'NexGuard Wallet'}
            </h1>
            {subtitle && (
              <p className="text-[11px] font-medium leading-tight" style={{ color: 'var(--text-muted)' }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          <Link
            href="/devices"
            className="p-2 rounded-full transition-colors relative"
            style={{ color: 'var(--text-muted)' }}
            title="Registered Devices"
          >
            <Smartphone className="w-4 h-4" />
          </Link>
          <Link
            href="/notifications"
            className="p-2 rounded-full transition-colors relative"
            style={{ color: 'var(--text-muted)' }}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
