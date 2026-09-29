'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Receipt,
  ShieldCheck,
  Smartphone,
  Bell,
  QrCode,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

export default function NexGuardMobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const notifs = await api('/wallet/notifications');
        const unread = notifs.filter((n: any) => !n.is_read).length;
        setUnreadCount(unread);
      } catch (err) {
        // ignore background error
      }
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { label: 'HOME', href: '/home', matchPaths: ['/home', '/mobile/dashboard', '/mobile'], icon: Home },
    { label: 'ACTIVITY', href: '/activity', matchPaths: ['/activity', '/mobile/transactions'], icon: Receipt },
    {
      label: 'SCAN TO PAY',
      href: '/scan',
      matchPaths: ['/scan'],
      icon: QrCode,
      isAction: true,
    },
    { label: 'SECURITY', href: '/security', matchPaths: ['/security', '/mobile/security', '/devices', '/mobile/devices'], icon: ShieldCheck },
    { label: 'PROFILE', href: '/profile', matchPaths: ['/profile', '/mobile/profile'], icon: User },
  ];

  return (
    <div
      className="mobile-app-root w-full min-h-[100dvh] flex flex-col items-center justify-start"
      style={{
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        background: '#F8FAFC',
        color: '#0F172A',
        margin: 0,
        padding: 0,
        overflowX: 'hidden',
      }}
    >
      <style>{`
        /* Mobile-First Responsive Styles */
        html, body {
          background: #F8FAFC !important;
          color: #0F172A !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow-x: hidden !important;
          width: 100% !important;
        }

        /* Fixed Bottom Nav Bar: always full-width of container */
        .wallet-nav-bar {
          position: fixed !important;
          bottom: 0 !important;
          z-index: 60 !important;
          overflow: visible !important;
          pointer-events: auto !important;
          display: flex !important;
          align-items: center !important;
          justify-content: space-around !important;
          box-sizing: border-box !important;
          background: rgba(255, 255, 255, 0.97) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border-top: 1px solid #E2E8F0 !important;
          padding-top: 8px !important;
          padding-bottom: max(12px, env(safe-area-inset-bottom, 12px)) !important;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.04) !important;
        }

        /* Mobile phones (< 768px): 100% full-screen native presentation */
        @media (max-width: 767px) {
          .phone-frame,
          .mobile-phone-frame,
          .mobile-preview,
          .device-frame,
          .mockup,
          .preview-container,
          .desktop-container,
          .mobile-shell-wrapper {
            width: 100% !important;
            max-width: 100% !important;
            min-height: 100dvh !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #F8FAFC !important;
          }

          .wallet-container {
            width: 100% !important;
            max-width: 100% !important;
            min-height: 100dvh !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }

          .wallet-nav-bar {
            width: 100% !important;
            max-width: 100% !important;
            left: 0 !important;
            right: 0 !important;
            transform: none !important;
          }
        }

        /* Tablet & Desktop (>= 768px): Clean centered customer wallet view */
        @media (min-width: 768px) {
          .mobile-app-root {
            background: #F1F5F9;
            padding: 0;
          }
          .wallet-container {
            width: 100%;
            max-width: 500px;
            min-height: 100dvh;
            margin: 0 auto;
            background: #F8FAFC;
            border-left: 1px solid #E2E8F0;
            border-right: 1px solid #E2E8F0;
            box-shadow: 0 4px 25px rgba(0, 0, 0, 0.04);
          }
          .wallet-nav-bar {
            width: 100% !important;
            max-width: 500px !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            border-left: 1px solid #E2E8F0 !important;
            border-right: 1px solid #E2E8F0 !important;
          }
        }
      `}</style>

      {/* Main Full-Screen Customer Wallet Container */}
      <div className="wallet-container w-full flex flex-col flex-1 relative overflow-x-hidden">
        {/* Top Header — Pure Customer Wallet Branding (No Portal or SOC links) */}
        <header
          className="w-full flex items-center justify-between shrink-0 z-30 sticky top-0"
          style={{
            paddingTop: 'max(12px, env(safe-area-inset-top, 12px))',
            paddingBottom: '11px',
            paddingLeft: '16px',
            paddingRight: '16px',
            background: 'var(--bg-overlay)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Customer Wallet Brand — Clickable to Home */}
          <Link
            href="/home"
            className="flex items-center gap-2 group transition-transform active:scale-95 text-decoration-none"
            title="NexGuard Home"
          >
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition">
              <ShieldCheck size={14} className="text-white stroke-[2.5]" />
            </div>
            <span
              className="font-black text-sm tracking-tight group-hover:text-indigo-600 transition"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: 'var(--text-primary)' }}
            >
              NexGuard
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 group-hover:bg-indigo-100 transition">
              WALLET
            </span>
          </Link>

          {/* Right Action: Theme Toggle & Notifications Bell */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            <Link
              href="/mobile/notifications"
              className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              style={{ color: 'var(--text-muted)' }}
              title="Security Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white font-mono text-[8px] font-bold flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </Link>
          </div>
        </header>

        {/* Scrollable Customer Wallet Body */}
        <main
          className="flex-1 w-full text-slate-900"
          style={{
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            paddingBottom: 'calc(96px + env(safe-area-inset-bottom, 16px))',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {children}
        </main>

        {/* Bottom Navigation Bar — Evenly Distributed Tabs */}
        {/* Bottom Navigation Bar — 5 Tabs with Center QR Scan to Pay */}
        <nav className="wallet-nav-bar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = (item as any).matchPaths ? (item as any).matchPaths.includes(pathname) : pathname === item.href;
            const isAction = (item as any).isAction;

            if (isAction) {
              return (
                <button
                  type="button"
                  key={item.href}
                  id="scan-to-pay-bottom-nav-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(item.href);
                  }}
                  className="transition-transform active:scale-95 group"
                  style={{
                    flex: 1.2,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    position: 'relative',
                    zIndex: 70,
                    pointerEvents: 'auto',
                    marginTop: '-22px',
                    padding: '0 4px',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  title="Scan & Pay"
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      boxShadow: '0 8px 24px rgba(37, 99, 235, 0.50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      border: '3.5px solid #ffffff',
                      transition: 'all 0.15s ease',
                      cursor: 'pointer',
                    }}
                  >
                    <Icon size={24} className="stroke-[2.3]" />
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: isActive ? '#1d4ed8' : '#2563eb',
                      letterSpacing: '0.02em',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      lineHeight: 1,
                      marginTop: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="transition-all"
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  padding: '3px 2px',
                  color: isActive ? '#2563EB' : '#64748B',
                  textDecoration: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 26,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 13,
                    background: isActive ? '#EFF6FF' : 'transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={17} className={isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'} />
                </div>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#2563EB' : '#64748B',
                    letterSpacing: '0.03em',
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    lineHeight: 1,
                  }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div style={{ width: 14, height: 2, borderRadius: 1, background: '#2563EB', marginTop: 1 }} />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
