'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  ShieldAlert,
  Zap,
  QrCode,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  Bell,
  Search,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Shield,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { api, getWsUrl } from '@/lib/api';
import ThemeToggle from '@/components/ThemeToggle';

/* ── Tiny helpers ── */
function StatusDot({ color }: { color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function Skeleton({ w = '100%', h = 20, style = {} }: { w?: string | number; h?: number; style?: React.CSSProperties }) {
  return (
    <div
      className="skeleton"
      style={{ width: w, height: h, borderRadius: 6, ...style }}
    />
  );
}

function RiskBadge({ score }: { score: number }) {
  let bg = 'var(--success-light)', color = 'var(--success-text)', label = 'LOW';
  if (score >= 70) { bg = 'var(--danger-light)'; color = 'var(--danger-text)'; label = 'HIGH'; }
  else if (score >= 40) { bg = 'var(--warning-light)'; color = 'var(--warning-text)'; label = 'MED'; }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: bg, color }}>
      {score} · {label}
    </span>
  );
}

function DecisionBadge({ decision }: { decision: string }) {
  const d = decision?.toUpperCase() || '';
  if (d === 'ALLOW' || d === 'ALLOWED') return <span className="badge badge-success">ALLOW</span>;
  if (d === 'BLOCK' || d === 'BLOCKED') return <span className="badge badge-danger">BLOCK</span>;
  if (d === 'VERIFY' || d === 'STEP_UP') return <span className="badge badge-warning">VERIFY</span>;
  return <span className="badge badge-muted">{d || '—'}</span>;
}

/* ── 10 Agent definitions ── */
const AGENT_DEFS = [
  { key: 'fraud_anomaly',    name: 'Fraud Detection',      weight: '25%' },
  { key: 'cyber_threat',     name: 'Cyber Threat',         weight: '15%' },
  { key: 'behavior_twin',    name: 'Behavioral Analysis',  weight: '15%' },
  { key: 'device_binding',   name: 'Device Intelligence',  weight: '10%' },
  { key: 'geo_velocity',     name: 'Geo-Velocity',         weight: '10%' },
  { key: 'biometrics',       name: 'Biometric Security',   weight: '5%'  },
  { key: 'beneficiary_risk', name: 'Beneficiary Risk',     weight: '5%'  },
  { key: 'ip_intelligence',  name: 'IP Intelligence',      weight: '5%'  },
  { key: 'session_guard',    name: 'Session Guard',        weight: '5%'  },
  { key: 'quantum_advisor',  name: 'Quantum Risk',         weight: '5%'  },
];

/* ── Main Component ── */
export default function CommandCenterPage() {
  const [summary, setSummary] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Paired phone state
  const [pairedDevice, setPairedDevice] = useState<any>(null);
  const [phoneLoaded, setPhoneLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumData, txData, agData] = await Promise.all([
          api('/dashboard').catch(() => null),
          api('/transactions?limit=8').catch(() => ({ items: [] })),
          api('/agents').catch(() => ({ agents: [] })),
        ]);
        setSummary(sumData);
        setTransactions(txData?.items || []);
        setAgents(agData?.agents || []);
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Real-time WebSocket + 1.5s fast polling for paired devices
  useEffect(() => {
    let isMounted = true;
    const checkDevices = async () => {
      try {
        const devices: any[] = await api('/devices');
        const trusted = devices.find((d: any) => d.trust_level === 'TRUSTED');
        if (isMounted) setPairedDevice(trusted || null);
      } catch { /* ignore */ }
    };
    checkDevices();
    const interval = setInterval(checkDevices, 1500);

    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(getWsUrl('/ws/soc'));
      ws.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.type === 'DEVICE_CONNECTED' || payload.type === 'DEVICE_RESTORED' || payload.type === 'DEVICE_REGISTERED') {
            checkDevices();
          }
        } catch {}
      };
    } catch {}

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  const kpis = [
    { label: 'Transactions', value: loading ? null : (summary?.total_transactions ?? summary?.transactions ?? '—'), sub: 'Total analyzed', icon: CreditCard, color: 'var(--primary-text)' },
    { label: 'Risk Events',  value: loading ? null : (summary?.risk_events ?? summary?.flagged ?? '—'),             sub: 'Flagged for review',    icon: AlertTriangle, color: 'var(--warning-text)' },
    { label: 'Blocked',      value: loading ? null : (summary?.blocked ?? summary?.blocked_transactions ?? '—'),    sub: 'Transactions stopped',  icon: Shield,        color: 'var(--danger-text)' },
    { label: 'Active Incidents', value: loading ? null : (summary?.active_incidents ?? summary?.incidents ?? '—'), sub: 'Requiring attention',   icon: ShieldAlert,   color: 'var(--success-text)' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Topbar ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, height: 60, background: 'var(--bg-overlay)', borderBottom: '1px solid var(--border-subtle)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', padding: '0 24px', gap: 16, flexShrink: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>Command Center</span>
          <span style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 400 }}>/ Overview</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-surface-2)', border: '1px solid var(--border-dim)', borderRadius: 8, padding: '6px 12px', width: 200 }}>
            <Search size={13} color="var(--text-dim)" />
            <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Search...</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--success-light)', border: '1px solid var(--success-border)', borderRadius: 6 }}>
            <StatusDot color="#059669" />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success-text)' }}>Operational</span>
          </div>

          {/* Theme Selector (Dark / Light / System) */}
          <ThemeToggle />

          <button style={{ width: 34, height: 34, borderRadius: 8, border: '1px solid var(--border-dim)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <Bell size={15} />
          </button>

          <Link
            href="/mobile/dashboard?pair=true"
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid var(--border-dim)', borderRadius: 8, fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', background: 'transparent', transition: 'all 0.12s ease' }}
          >
            <QrCode size={13} />
            <span className="hidden sm:inline">Pair Phone</span>
          </Link>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, padding: 24, maxWidth: 1280, width: '100%', alignSelf: 'center' }}>

        {/* Product Header */}
        <div className="animate-fade-in-up" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
                NexGuard Security Platform
              </h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', maxWidth: 520 }}>
                Real-time behavioral, device, network, and fraud intelligence protecting digital transactions.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'var(--info-light)', border: '1px solid var(--info-border)', borderRadius: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--info-text)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Demo Environment</span>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }} className="animate-fade-in-up stagger-1">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className="kpi-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="kpi-label">{kpi.label}</span>
                  <Icon size={14} color={kpi.color} />
                </div>
                {loading ? <Skeleton h={32} w={80} /> : (
                  <div className="kpi-value" style={{ color: kpi.color }}>
                    {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                  </div>
                )}
                <div className="kpi-sub">{kpi.sub}</div>
              </div>
            );
          })}
        </div>

        {/* Three Product Areas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }} className="animate-fade-in-up stagger-2">
          {[
            { href: '/mobile/dashboard', icon: Smartphone, title: 'Customer Wallet', desc: 'UPI payment simulator with real-time AI security analysis and device trust scoring.', accentVar: '--primary' },
            { href: '/soc',              icon: ShieldAlert, title: 'Security Operations Center', desc: 'Real-time incident monitoring, live WebSocket alerts, and analyst override controls.', accentVar: '--violet' },
            { href: '/demo',             icon: Zap,         title: 'Attack Demo Lab', desc: 'Test three core scenarios: safe payment, high-value step-up, and rogue cyber attack.', accentVar: '--warning' },
          ].map(({ href, icon: Icon, title, desc, accentVar }) => (
            <Link
              key={href}
              href={href}
              style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12, textDecoration: 'none', transition: 'border-color 0.15s ease, background 0.15s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = `rgba(var(--${accentVar}-rgb,37,99,235),0.35)`; (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-card-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border-subtle)'; (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-card)'; }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ width: 36, height: 36, background: `var(--${accentVar}-light, var(--primary-light))`, border: `1px solid var(--${accentVar}-border, var(--primary-border))`, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={16} color={`var(--${accentVar}-text, var(--primary-text))`} />
                </div>
                <ArrowRight size={14} color="var(--text-dim)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Two-column: Recent Transactions + AI Agents */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 14, marginBottom: 24 }} className="animate-fade-in-up stagger-3">

          {/* Recent Transactions */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Transactions</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Latest analyzed payments</div>
              </div>
              <Link href="/soc?tab=transactions" style={{ fontSize: 11, color: 'var(--primary-text)', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[...Array(5)].map((_, i) => <Skeleton key={i} h={14} />)}
              </div>
            ) : transactions.length === 0 ? (
              <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No transactions yet. Run a demo scenario to generate data.
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Transaction</th><th>Amount</th><th>Risk</th><th>Decision</th><th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.slice(0, 8).map((tx: any, i: number) => (
                    <tr key={tx.transaction_id || i}>
                      <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>{tx.transaction_id?.substring(0, 12) || 'TXN-' + String(i).padStart(5, '0')}</span></td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{typeof tx.amount === 'number' ? tx.amount.toLocaleString('en-IN') : tx.amount || '—'}</td>
                      <td><RiskBadge score={tx.risk_score ?? tx.composite_risk ?? 0} /></td>
                      <td><DecisionBadge decision={tx.decision || tx.status || ''} /></td>
                      <td style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {tx.created_at ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* AI Security Engine */}
          <div className="card" style={{ padding: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>AI Security Engine</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>10 specialized agents</div>
              </div>
              <Link href="/soc?tab=ai-agents" style={{ fontSize: 11, color: 'var(--primary-text)', fontWeight: 500, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Details <ArrowRight size={11} />
              </Link>
            </div>

            <div style={{ padding: '8px 20px 12px' }}>
              {AGENT_DEFS.map((ag) => {
                const liveAgent = agents.find((a: any) => a.name?.toLowerCase().includes(ag.key.split('_')[0]));
                const isHealthy = !liveAgent || liveAgent.status !== 'error';
                return (
                  <div key={ag.key} className="agent-row">
                    <StatusDot color={isHealthy ? '#059669' : '#dc2626'} />
                    <span className="agent-name">{ag.name}</span>
                    <span className="agent-weight">{ag.weight}</span>
                    <div style={{ width: 50, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: ag.weight, background: 'var(--primary)', borderRadius: 2, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Pair Phone Section ── */}
        <div className="animate-fade-in-up stagger-4">
          {pairedDevice ? (
            /* ── CONNECTED: phone frame only ── */
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '32px 24px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                backgroundImage: 'radial-gradient(rgba(59,130,246,0.07) 1px, transparent 0)',
                backgroundSize: '24px 24px',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {/* Outer phone shell */}
              <div
                style={{
                  position: 'relative',
                  width: 320,
                  height: 648,
                  flexShrink: 0,
                  borderRadius: 44,
                  background: '#18181b',
                  boxShadow: '0 0 0 2px #3f3f46, 0 32px 80px -12px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.12)',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Dynamic island notch */}
                <div style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 110, height: 30, borderRadius: 20, background: '#09090b', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#1a1a2e', border: '2px solid #2d2d3d' }} />
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#059669', boxShadow: '0 0 6px #059669' }} />
                </div>

                {/* Screen area */}
                <div style={{ position: 'absolute', inset: 0, borderRadius: 44, overflow: 'hidden', background: '#F8FAFC' }}>
                  {!phoneLoaded && (
                    <div style={{ position: 'absolute', inset: 0, zIndex: 10, background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                      <Smartphone size={28} color="#94a3b8" />
                      <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Loading phone…</span>
                    </div>
                  )}
                  <iframe
                    ref={iframeRef}
                    src="/mobile/dashboard"
                    title="Paired Phone View"
                    onLoad={() => setPhoneLoaded(true)}
                    style={{ width: '100%', height: '100%', border: 'none', display: 'block', borderRadius: 44, opacity: phoneLoaded ? 1 : 0, transition: 'opacity 0.4s ease' }}
                    scrolling="yes"
                  />
                </div>

                {/* Side buttons */}
                <div style={{ position: 'absolute', left: -3, top: 120, width: 3, height: 32, background: '#3f3f46', borderRadius: '2px 0 0 2px' }} />
                <div style={{ position: 'absolute', left: -3, top: 164, width: 3, height: 56, background: '#3f3f46', borderRadius: '2px 0 0 2px' }} />
                <div style={{ position: 'absolute', left: -3, top: 228, width: 3, height: 56, background: '#3f3f46', borderRadius: '2px 0 0 2px' }} />
                <div style={{ position: 'absolute', right: -3, top: 160, width: 3, height: 72, background: '#3f3f46', borderRadius: '0 2px 2px 0' }} />
              </div>
            </div>
          ) : (
            /* ── NOT CONNECTED: pairing strip ── */
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px', background: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 36, height: 36, background: 'var(--primary-light)', border: '1px solid var(--primary-border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <QrCode size={16} color="var(--primary-text)" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>Test from your smartphone</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Scan QR code on the same Wi-Fi to test live transactions from a real device.</div>
                </div>
              </div>
              <Link href="/mobile/dashboard?pair=true" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--primary)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none', flexShrink: 0, transition: 'background 0.15s ease' }}>
                Pair Device <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </div>

        {/* Shimmer keyframes */}
        <style>{`
          @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
          @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 3px rgba(5,150,105,0.25); } 50% { box-shadow: 0 0 0 6px rgba(5,150,105,0.1); } }
        `}</style>

      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>NexGuard Secure Intelligence Platform © 2026</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/mobile/dashboard" style={{ fontSize: 11, color: 'var(--text-dim)', textDecoration: 'none' }}>Mobile</Link>
          <Link href="/soc"              style={{ fontSize: 11, color: 'var(--text-dim)', textDecoration: 'none' }}>SOC</Link>
          <Link href="/demo"             style={{ fontSize: 11, color: 'var(--text-dim)', textDecoration: 'none' }}>Lab</Link>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--text-dim)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            API Docs <ExternalLink size={10} />
          </a>
        </div>
      </footer>

    </div>
  );
}
