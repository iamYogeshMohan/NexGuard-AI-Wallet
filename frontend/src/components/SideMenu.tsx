'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  LayoutDashboard,
  Radio,
  CreditCard,
  AlertOctagon,
  Smartphone,
  ShieldAlert,
  Monitor,
  Globe,
  Clock,
  Bot,
  GitBranch,
  Atom,
  MessageSquare,
  FileText,
  Settings,
  QrCode,
  ExternalLink,
  Zap,
  Activity,
  Users,
  User,
  Server,
  Landmark,
  Wallet,
  ArrowLeftRight,
  KeyRound,
  Network,
  BarChart3,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export interface SideMenuProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  tabParam?: string;
  isPair?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'COMMAND CENTER',
    items: [
      { href: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
      { href: '/soc', label: 'Live Monitor', icon: Radio, tabParam: 'overview' },
      { href: '/demo', label: 'Live Demo', icon: Zap },
    ],
  },
  {
    label: 'SERVER OPERATIONS',
    items: [
      { href: '/server', label: 'System Overview', icon: Server, exact: true },
      { href: '/server/users', label: 'User Management', icon: Users },
      { href: '/server/accounts', label: 'Account Monitoring', icon: Landmark },
      { href: '/server/wallets', label: 'Wallet Monitoring', icon: Wallet },
      { href: '/server/transactions', label: 'Transaction Monitor', icon: ArrowLeftRight },
      { href: '/server/devices', label: 'Device Monitor', icon: Smartphone },
      { href: '/server/sessions', label: 'Session Monitor', icon: KeyRound },
      { href: '/server/activity', label: 'Live Activity', icon: Radio },
      { href: '/server/cross-check', label: 'Cross-Check', icon: Network },
      { href: '/server/analytics', label: 'Usage Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'FRAUD & SECURITY',
    items: [
      { href: '/soc', label: 'Fraud Detection', icon: AlertOctagon, tabParam: 'incidents' },
      { href: '/soc', label: 'Incidents', icon: ShieldAlert, tabParam: 'incidents' },
      { href: '/soc', label: 'Devices', icon: Monitor, tabParam: 'devices' },
      { href: '/soc', label: 'Sessions', icon: Activity, tabParam: 'audit-logs' },
      { href: '/soc', label: 'Threat Intelligence', icon: Globe, tabParam: 'threat-intel' },
      { href: '/soc', label: 'Attack Timeline', icon: Clock, tabParam: 'timeline' },
    ],
  },
  {
    label: 'AI & AGENTS',
    items: [
      { href: '/soc', label: '10 AI Agents', icon: Bot, tabParam: 'ai-agents' },
      { href: '/soc', label: 'Digital Twin', icon: GitBranch, tabParam: 'digital-twin' },
      { href: '/soc', label: 'Security Graph', icon: Users, tabParam: 'graph' },
      { href: '/soc', label: 'Quantum Risk', icon: Atom, tabParam: 'quantum-risk' },
      { href: '/soc', label: 'Copilot', icon: MessageSquare, tabParam: 'copilot' },
    ],
  },
  {
    label: 'PAYMENTS',
    items: [
      { href: '/soc', label: 'Transactions', icon: CreditCard, tabParam: 'transactions' },
      { href: '/profile', label: 'Customers', icon: User },
      { href: '/mobile/dashboard', label: 'Accounts', icon: Smartphone },
      { href: '/home', label: 'Wallets', icon: Smartphone },
      { href: '/beneficiaries', label: 'Beneficiaries', icon: Users },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { href: '/soc', label: 'Audit Logs', icon: FileText, tabParam: 'audit-logs' },
      { href: '/soc', label: 'System Settings', icon: Settings, tabParam: 'overview' },
      { href: '/mobile/dashboard?pair=true', label: 'Pair Phone QR', icon: QrCode, isPair: true },
    ],
  },
];

function SidebarInner({
  onClose,
  isMobileDrawer,
}: {
  onClose?: () => void;
  isMobileDrawer?: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isItemActive = (item: NavItem): boolean => {
    if (item.exact) return pathname === item.href;
    if (item.isPair) {
      return (
        pathname.startsWith('/mobile') &&
        searchParams?.get('pair') === 'true'
      );
    }
    if (item.tabParam) {
      if (pathname === '/soc' || pathname === item.href) {
        const currentTab = searchParams?.get('tab') || 'overview';
        return currentTab === item.tabParam;
      }
    }
    if (item.href === '/home' || item.href === '/mobile/dashboard') {
      return pathname === item.href && searchParams?.get('pair') !== 'true';
    }
    if (item.href !== '/' && pathname.startsWith(item.href) && !item.tabParam) {
      return true;
    }
    return false;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: '18px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
          onClick={() => { if (isMobileDrawer && onClose) onClose(); }}
        >
          <div
            style={{
              width: '30px',
              height: '30px',
              background: 'var(--primary)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
              }}
            >
              NexGuard
            </div>
            <div
              style={{
                fontSize: '10px',
                color: 'var(--text-dim)',
                fontWeight: '500',
                letterSpacing: '0.02em',
              }}
            >
              Secure Intelligence SOC
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px',
        }}
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} style={{ marginBottom: '8px' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: '700',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--text-dim)',
                padding: '8px 8px 4px',
              }}
            >
              {section.label}
            </div>

            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item);
              const href = item.tabParam
                ? `${item.href}?tab=${item.tabParam}`
                : item.href;

              return (
                <Link
                  key={`${item.href}-${item.label}-${item.tabParam || ''}`}
                  href={href}
                  onClick={() => { if (isMobileDrawer && onClose) onClose(); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '7px 10px',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    fontWeight: active ? '600' : '400',
                    color: active ? '#93c5fd' : 'var(--text-muted)',
                    textDecoration: 'none',
                    transition: 'all 0.12s ease',
                    background: active ? 'rgba(37,99,235,0.12)' : 'transparent',
                    position: 'relative',
                    marginBottom: '1px',
                    borderLeft: active ? '2px solid var(--primary)' : '2px solid transparent',
                    paddingLeft: active ? '8px' : '8px',
                  }}
                  className={active ? '' : 'sidebar-item-hover'}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)';
                      (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-muted)';
                      (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={14} style={{ flexShrink: 0 }} />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 14px',
          borderTop: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        {/* Theme Selector */}
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--text-dim)',
              marginBottom: '6px',
            }}
          >
            Appearance
          </div>
          <ThemeToggle variant="segmented" />
        </div>

        {/* System Health Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            marginBottom: '10px',
          }}
        >
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#059669',
              animation: 'status-pulse 2s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '500' }}>
            All Systems Operational
          </span>
        </div>

        {/* API Docs Link */}
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--text-dim)',
            textDecoration: 'none',
            padding: '4px 0',
            transition: 'color 0.12s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-dim)';
          }}
        >
          <ExternalLink size={11} />
          <span>API Documentation</span>
        </a>
      </div>
    </div>
  );
}

function SidebarContent(props: { onClose?: () => void; isMobileDrawer?: boolean }) {
  return (
    <Suspense fallback={<div style={{ width: '260px', height: '100%', background: 'var(--bg-sidebar)' }} />}>
      <SidebarInner {...props} />
    </Suspense>
  );
}

export default function SideMenu({
  isOpen = true,
  onClose,
  isMobileDrawer = false,
}: SideMenuProps) {
  if (isMobileDrawer) {
    if (!isOpen) return null;
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          display: 'flex',
        }}
        className="lg:hidden"
      >
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.70)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={onClose}
          aria-hidden="true"
        />
        <aside
          style={{
            position: 'relative',
            zIndex: 50,
            width: '260px',
            maxWidth: '85vw',
            height: '100%',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <SidebarContent onClose={onClose} isMobileDrawer={isMobileDrawer} />
        </aside>
      </div>
    );
  }

  // Desktop fixed sidebar
  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        height: '100vh',
        width: '260px',
        zIndex: 40,
      }}
      className="hidden lg:block"
    >
      <SidebarContent />
    </aside>
  );
}
