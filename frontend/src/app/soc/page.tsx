'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api, WS_URL } from '@/lib/api';
import {
  ShieldAlert, ShieldCheck, Activity, AlertTriangle, RefreshCw,
  XCircle, CheckCircle2, Smartphone, Globe, Sliders, Radio, Clock,
  UserCheck, Ban, ArrowLeft, Search, Bot, Cpu, Layers, FileText,
  History, GitBranch, TrendingUp, Download, Terminal, ExternalLink, QrCode,
  Bell, ChevronRight,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import ThemeToggle from '@/components/ThemeToggle';

/* ── Status Badge ─────────────────────────────────────── */
function SBadge({
  children,
  variant = 'muted',
}: {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'violet' | 'muted' | 'primary';
}) {
  const styles: Record<string, React.CSSProperties> = {
    success: { background: 'var(--success-light)', color: 'var(--success-text)', border: '1px solid var(--success-border)' },
    danger:  { background: 'var(--danger-light)',  color: 'var(--danger-text)',  border: '1px solid var(--danger-border)' },
    warning: { background: 'var(--warning-light)', color: 'var(--warning-text)', border: '1px solid var(--warning-border)' },
    info:    { background: 'var(--info-light)',    color: 'var(--info-text)',    border: '1px solid var(--info-border)' },
    violet:  { background: 'var(--violet-light)',  color: 'var(--violet-text)',  border: '1px solid var(--violet-border)' },
    primary: { background: 'var(--primary-light)', color: 'var(--primary-text)', border: '1px solid var(--primary-border)' },
    muted:   { background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-dim)' },
  };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 7px',
        borderRadius: 4,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...styles[variant],
      }}
    >
      {children}
    </span>
  );
}

/* ── Helper: decision badge ─── */
function DecisionBadge({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  if (s === 'ALLOW' || s === 'ALLOWED' || s === 'COMPLETED') return <SBadge variant="success">ALLOW</SBadge>;
  if (s === 'BLOCK' || s === 'BLOCKED') return <SBadge variant="danger">BLOCK</SBadge>;
  if (s === 'VERIFY' || s === 'STEP_UP' || s === 'PENDING_VERIFICATION') return <SBadge variant="warning">VERIFY</SBadge>;
  return <SBadge>{s || '—'}</SBadge>;
}

/* ── Card wrapper ─────────────────────────────────────── */
const Card = ({ children, style = {}, className = '' }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) => (
  <div
    className={className}
    style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 12,
      ...style,
    }}
  >
    {children}
  </div>
);

/* ── Main Dashboard ─────────────────────────────────────────────────────── */
function SOCDashboardContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams ? searchParams.get('tab') || 'overview' : 'overview';
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [threatIntel, setThreatIntel] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [quantumAssets, setQuantumAssets] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [digitalTwin, setDigitalTwin] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [criticalPop, setCriticalPop] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copilotQuestion, setCopilotQuestion] = useState<string>('');
  const [copilotChat, setCopilotChat] = useState<Array<{ sender: string; text: string; data?: any }>>([
    { sender: 'copilot', text: 'Hello, Analyst. I am the NexGuard AI Security Copilot. Ask me about today\'s blocked transactions, critical incidents, suspicious devices, or quantum risk exposure.' },
  ]);
  const [copilotLoading, setCopilotLoading] = useState<boolean>(false);
  const [overrideModalIncident, setOverrideModalIncident] = useState<any>(null);
  const [overrideAction, setOverrideAction] = useState<string>('KEEP_BLOCKED');
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [clock, setClock] = useState<string>('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString());
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const loadAllData = async () => {
    try {
      const [sumData, incData, txData, devData, tiData, agData, qrData, alData, dtData] = await Promise.all([
        api('/dashboard'), api('/incidents'), api('/transactions?limit=25'),
        api('/devices'), api('/threat-intelligence'), api('/agents'),
        api('/quantum-risk'), api('/audit-logs?limit=40'), api('/digital-twin/1'),
      ]);
      setSummary(sumData); setIncidents(incData);
      setTransactions(txData.items || []); setDevices(devData);
      setThreatIntel(tiData); setAgents(agData.agents || []);
      setQuantumAssets(qrData.assets || []); setAuditLogs(alData); setDigitalTwin(dtData);
    } catch (err) { console.error('Failed to load SOC data:', err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadAllData();
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const timestamp = new Date().toLocaleTimeString();
          setLiveEvents((prev) => [{ ...payload, timestamp }, ...prev.slice(0, 30)]);
          if (payload.type === 'CRITICAL_ALERT') {
            setCriticalPop(payload.data); loadAllData();
          } else if (payload.type === 'STEP_UP_CHALLENGE' || payload.type === 'NEW_TRANSACTION') {
            loadAllData();
          }
        } catch (err) { console.error(err); }
      };
    } catch (err) { console.error(err); }
    return () => { if (ws) ws.close(); };
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [copilotChat, copilotLoading]);

  const handleResolveIncident = async (incidentId: string) => {
    try {
      await api(`/incidents/${incidentId}/resolve`, { method: 'POST' });
      loadAllData();
      if (selectedIncident?.incident_id === incidentId) setSelectedIncident((prev: any) => ({ ...prev, status: 'RESOLVED' }));
    } catch (err) { console.error(err); }
  };

  const handleQuarantineDevice = async (deviceId: string) => {
    try { await api(`/devices/${deviceId}/quarantine`, { method: 'POST' }); loadAllData(); }
    catch (err: any) { alert(`Quarantine error: ${err.message}`); }
  };

  const handleRestoreDevice = async (deviceId: string) => {
    try { await api(`/devices/${deviceId}/restore`, { method: 'POST' }); loadAllData(); }
    catch (err: any) { alert(`Restore error: ${err.message}`); }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideModalIncident || !overrideReason) return;
    try {
      await api(`/incidents/${overrideModalIncident.incident_id}/override`, {
        method: 'POST',
        body: JSON.stringify({ action: overrideAction, reason: overrideReason }),
      });
      setOverrideModalIncident(null); setOverrideReason(''); loadAllData();
    } catch (err: any) { alert(`Override error: ${err.message}`); }
  };

  const handleCopilotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copilotQuestion.trim()) return;
    const q = copilotQuestion; setCopilotQuestion('');
    setCopilotChat((prev) => [...prev, { sender: 'user', text: q }]);
    setCopilotLoading(true);
    try {
      const res = await api('/copilot', { method: 'POST', body: JSON.stringify({ question: q }) });
      setCopilotChat((prev) => [...prev, { sender: 'copilot', text: res.answer, data: res.data }]);
    } catch (err: any) {
      setCopilotChat((prev) => [...prev, { sender: 'copilot', text: `Error processing query: ${err.message}` }]);
    } finally { setCopilotLoading(false); }
  };

  const navTabs = [
    { id: 'overview',      label: 'Overview',         icon: Activity },
    { id: 'incidents',     label: 'Incidents',         icon: ShieldAlert, badge: incidents.filter((i) => i.status === 'OPEN').length },
    { id: 'transactions',  label: 'Transactions',      icon: FileText },
    { id: 'timeline',      label: 'Attack Timeline',   icon: TrendingUp },
    { id: 'graph',         label: 'Security Graph',    icon: GitBranch },
    { id: 'devices',       label: 'Devices',           icon: Smartphone },
    { id: 'digital-twin',  label: 'Digital Twin',      icon: Layers },
    { id: 'threat-intel',  label: 'Threat Intel',      icon: Globe },
    { id: 'ai-agents',     label: 'AI Agents',         icon: Sliders },
    { id: 'quantum-risk',  label: 'Quantum Risk',      icon: Cpu },
    { id: 'copilot',       label: 'AI Copilot',        icon: Bot },
    { id: 'audit-logs',    label: 'Audit Logs',        icon: History },
  ];

  /* ── Shared Section Header ─── */
  const SectionHeader = ({ title, desc, onRefresh }: { title: string; desc?: string; onRefresh?: () => void }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', margin: 0 }}>{title}</h2>
        {desc && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, margin: 0 }}>{desc}</p>}
      </div>
      {onRefresh && (
        <button
          onClick={onRefresh}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            background: 'transparent',
            border: '1px solid var(--border-dim)',
            borderRadius: 6,
            fontSize: 12,
            color: 'var(--text-muted)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column' }}>

      {/* ══ TOPBAR ══ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 60,
          background: 'var(--bg-overlay)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          gap: 16,
          flexShrink: 0,
        }}
      >
        {/* Breadcrumb */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Security Operations Center
          </span>
          <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>/ Live Monitor</span>
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Clock */}
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}>
            {clock}
          </span>

          {/* WS Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              background: wsConnected ? 'var(--success-light)' : 'var(--danger-light)',
              border: `1px solid ${wsConnected ? 'var(--success-border)' : 'var(--danger-border)'}`,
              borderRadius: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: wsConnected ? 'var(--success)' : 'var(--danger)',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: wsConnected ? 'var(--success-text)' : 'var(--danger-text)' }}>
              {wsConnected ? 'Live' : 'Reconnecting'}
            </span>
          </div>

          {/* Theme Selector */}
          <ThemeToggle />

          {/* Analyst */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '4px 10px',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-dim)',
              borderRadius: 6,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: '#fff',
              }}
            >
              PS
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Priya Sharma</span>
          </div>
        </div>
      </header>

      {/* Critical alert banner */}
      {criticalPop && (
        <div
          style={{
            background: 'var(--danger-light)',
            borderBottom: '1px solid var(--danger-border)',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldAlert size={16} color="var(--danger-text)" />
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger-text)' }}>
                Critical Security Event — {criticalPop.merchant} (₹{criticalPop.amount?.toLocaleString('en-IN')})
              </span>
              <span style={{ fontSize: 11, color: 'var(--danger-text)', opacity: 0.7, marginLeft: 10, fontFamily: 'var(--font-mono)' }}>
                Risk: {criticalPop.risk_score}/100 · Incident {criticalPop.incident_id || 'INC-0001'} auto-created
              </span>
            </div>
          </div>
          <button
            onClick={() => setCriticalPop(null)}
            style={{
              padding: '4px 10px',
              background: 'transparent',
              border: '1px solid var(--danger-border)',
              borderRadius: 6,
              fontSize: 11,
              color: 'var(--danger-text)',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ══ TAB BAR ══ */}
      <div
        style={{
          position: 'sticky',
          top: criticalPop ? 100 : 60,
          zIndex: 40,
          background: 'var(--bg-overlay)',
          borderBottom: '1px solid var(--border-subtle)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          padding: '0 24px',
          overflowX: 'auto',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 2, alignItems: 'center', minWidth: 'max-content' }}>
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 12px',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  marginBottom: -1,
                }}
                onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
                onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    style={{
                      background: 'var(--danger)',
                      color: '#fff',
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '1px 5px',
                      borderRadius: 10,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <main style={{ flex: 1, padding: 24, maxWidth: 1280, width: '100%', alignSelf: 'center' }}>

        {/* ── TAB 1: OVERVIEW ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
              {[
                {
                  label: 'Transactions',
                  value: summary?.total_transactions ?? transactions.length,
                  sub: `${summary?.allowed_transactions ?? 0} settled · ${summary?.blocked_transactions ?? 0} blocked`,
                  badge: 'Live',
                  badgeVariant: 'success' as const,
                },
                {
                  label: 'Active Incidents',
                  value: summary?.open_incidents ?? incidents.filter((i) => i.status === 'OPEN').length,
                  sub: `${summary?.critical_incidents ?? 0} critical`,
                  badge: 'Requires Review',
                  badgeVariant: 'danger' as const,
                },
                {
                  label: 'Suspicious Devices',
                  value: summary?.suspicious_devices ?? devices.filter((d) => d.trust_level !== 'TRUSTED').length,
                  sub: `${devices.length} total monitored`,
                  badge: 'Fleet Risk',
                  badgeVariant: 'warning' as const,
                },
                {
                  label: 'Avg Risk Score',
                  value: `${summary?.average_risk_score ?? '—'}/100`,
                  sub: '10 agents active',
                  badge: 'Real-time',
                  badgeVariant: 'info' as const,
                },
              ].map((card, i) => (
                <div key={i} className="kpi-card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className="kpi-label">{card.label}</span>
                    <SBadge variant={card.badgeVariant}>{card.badge}</SBadge>
                  </div>
                  <div className="kpi-value">{card.value}</div>
                  <div className="kpi-sub">{card.sub}</div>
                </div>
              ))}
            </div>

            {/* Incidents + Live Stream */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 16 }}>
              {/* Priority Incidents */}
              <Card style={{ padding: 0 }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Priority Security Incidents</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Triaged alerts requiring analyst action</div>
                  </div>
                  <button onClick={() => setActiveTab('incidents')} style={{ fontSize: 11, color: 'var(--primary-text)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    View all <ChevronRight size={12} />
                  </button>
                </div>
                <div style={{ padding: '8px 12px' }}>
                  {incidents.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No active incidents.</div>
                  ) : (
                    incidents.slice(0, 4).map((inc) => {
                      const isResolved = inc.status === 'RESOLVED';
                      return (
                        <div
                          key={inc.id}
                          onClick={() => setSelectedIncident(inc)}
                          style={{
                            padding: '12px',
                            borderRadius: 8,
                            marginBottom: 4,
                            cursor: 'pointer',
                            border: `1px solid ${selectedIncident?.id === inc.id ? 'var(--primary-border)' : 'transparent'}`,
                            background: selectedIncident?.id === inc.id ? 'var(--primary-light)' : 'transparent',
                            transition: 'all 0.12s ease',
                          }}
                          onMouseEnter={(e) => { if (selectedIncident?.id !== inc.id) (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)'; }}
                          onMouseLeave={(e) => { if (selectedIncident?.id !== inc.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--primary-text)' }}>{inc.incident_id}</span>
                              <SBadge variant={isResolved ? 'success' : 'danger'}>{inc.status}</SBadge>
                              <SBadge variant="warning">{inc.severity}</SBadge>
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                              {inc.created_at ? new Date(inc.created_at).toLocaleTimeString() : 'Recent'}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{inc.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inc.description}</div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Risk: {inc.risk_score}/100</span>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {!isResolved && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleResolveIncident(inc.incident_id); }}
                                  style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', background: 'var(--success-light)', color: 'var(--success-text)', border: '1px solid var(--success-border)', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                                >
                                  <CheckCircle2 size={10} /> Resolve
                                </button>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); setOverrideModalIncident(inc); }}
                                style={{ padding: '3px 8px', background: 'var(--violet-light)', color: 'var(--violet-text)', border: '1px solid var(--violet-border)', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer' }}
                              >
                                Override
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>

              {/* Live Telemetry Stream */}
              <Card style={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Radio size={13} color="var(--success-text)" />
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Live Telemetry</div>
                  {wsConnected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'status-pulse 2s ease-in-out infinite' }} />}
                </div>
                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '8px 12px',
                    maxHeight: 440,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {liveEvents.length === 0 ? (
                    <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>
                      Awaiting mobile wallet events...
                      <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text-dim)' }}>Initiate a payment to see real-time analysis.</div>
                    </div>
                  ) : (
                    liveEvents.map((ev, idx) => {
                      const isAlert = ev.type === 'CRITICAL_ALERT';
                      const isStepUp = ev.type === 'STEP_UP_CHALLENGE';
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: `1px solid ${isAlert ? 'var(--danger-border)' : isStepUp ? 'var(--warning-border)' : 'var(--border-subtle)'}`,
                            background: isAlert ? 'var(--danger-light)' : isStepUp ? 'var(--warning-light)' : 'rgba(255,255,255,0.01)',
                            animation: 'fadeInUp 0.25s ease both',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: isAlert ? 'var(--danger-text)' : isStepUp ? 'var(--warning-text)' : 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
                              {ev.type}
                            </span>
                            <span style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{ev.timestamp}</span>
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                            {ev.data?.user || 'Customer'} → {ev.data?.merchant} (₹{ev.data?.amount?.toLocaleString('en-IN')})
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                            <span>{ev.data?.device_id}</span>
                            <span>Risk: {ev.data?.risk_score}/100</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </Card>
            </div>

            {/* Selected Incident Detail */}
            {selectedIncident && (
              <Card style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)', marginBottom: 16 }}>
                  <div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--primary-text)' }}>INCIDENT DETAIL — {selectedIncident.incident_id}</span>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{selectedIncident.title}</div>
                  </div>
                  <button onClick={() => setSelectedIncident(null)} style={{ padding: '4px 10px', background: 'transparent', border: '1px solid var(--border-dim)', borderRadius: 6, fontSize: 11, color: 'var(--text-muted)', cursor: 'pointer' }}>Close ✕</button>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Agent Evaluation Scores</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                    {Object.entries(selectedIncident.agent_evidence?.agent_scores || {}).map(([ag, sc]: [string, any]) => (
                      <div key={ag} style={{ padding: '8px', borderRadius: 6, border: `1px solid ${sc > 70 ? 'var(--danger-border)' : sc > 30 ? 'var(--warning-border)' : 'var(--border-subtle)'}`, background: sc > 70 ? 'var(--danger-light)' : sc > 30 ? 'var(--warning-light)' : 'transparent', textAlign: 'center' }}>
                        <div style={{ fontSize: 9, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 4 }}>{ag}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: sc > 70 ? 'var(--danger-text)' : sc > 30 ? 'var(--warning-text)' : 'var(--success-text)' }}>{sc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-dim)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Risk Factors (XAI)</div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 6, border: '1px solid var(--border-subtle)', padding: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(selectedIncident.xai_factors || []).map((xf: any, idx: number) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: 'var(--text-secondary)' }}>
                        <span style={{ color: 'var(--danger-text)', fontWeight: 700, flexShrink: 0 }}>+{xf.contribution}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', flexShrink: 0 }}>[{xf.agent}]</span>
                        <span>{xf.reasons?.[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── TAB 2: INCIDENTS ── */}
        {activeTab === 'incidents' && (
          <div>
            <SectionHeader title="Security Incident Queue" desc="Triaged alerts requiring analyst investigation or human override." onRefresh={loadAllData} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {incidents.map((inc) => (
                <Card key={inc.id} style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--primary-text)' }}>{inc.incident_id}</span>
                      <SBadge variant={inc.status === 'RESOLVED' ? 'success' : 'danger'}>{inc.status}</SBadge>
                      <SBadge variant="warning">{inc.severity}</SBadge>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{new Date(inc.created_at).toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{inc.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 12 }}>{inc.description}</div>
                  {inc.analyst_action && (
                    <div style={{ padding: '8px 12px', borderRadius: 6, background: 'var(--violet-light)', border: '1px solid var(--violet-border)', fontSize: 12, color: 'var(--violet-text)', marginBottom: 12 }}>
                      Analyst Override: {inc.analyst_action} — {inc.override_reason}
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>Risk Score: {inc.risk_score}/100</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {inc.status !== 'RESOLVED' && (
                        <button onClick={() => handleResolveIncident(inc.incident_id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'var(--success-light)', color: 'var(--success-text)', border: '1px solid var(--success-border)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <CheckCircle2 size={12} /> Resolve
                        </button>
                      )}
                      <button onClick={() => setOverrideModalIncident(inc)}
                        style={{ padding: '5px 12px', background: 'var(--violet-light)', color: 'var(--violet-text)', border: '1px solid var(--violet-border)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                        Analyst Override
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 3: TRANSACTIONS ── */}
        {activeTab === 'transactions' && (
          <div>
            <SectionHeader title="Transaction Audit Ledger" desc="All transactions analyzed by 10-agent security engine with XAI receipts." onRefresh={loadAllData} />
            <Card style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {['TXN ID', 'Merchant', 'Amount', 'Device', 'Location', 'Risk', 'Decision'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-text)', fontWeight: 600 }}>{tx.transaction_id_str}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{tx.merchant}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{tx.amount?.toLocaleString('en-IN')}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{tx.device_id}</td>
                      <td>{tx.location?.split(',')[0]}</td>
                      <td>
                        <span style={{ fontWeight: 600, color: tx.risk_score > 60 ? 'var(--danger-text)' : tx.risk_score > 30 ? 'var(--warning-text)' : 'var(--success-text)' }}>
                          {tx.risk_score}/100
                        </span>
                      </td>
                      <td><DecisionBadge status={tx.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

        {/* ── TAB 4: ATTACK TIMELINE ── */}
        {activeTab === 'timeline' && (
          <div>
            <SectionHeader title="Account Takeover Attack Timeline" desc="Reconstructed chronological telemetry showing cross-domain threat correlation." />
            <Card style={{ padding: 24 }}>
              <div className="timeline">
                {[
                  { time: '10:14:02', title: 'Failed Authentication Attempt 1', desc: 'Invalid PIN from unrecognized IP 92.43.11.88.', badge: 'Suspicious', variant: 'warning' as const },
                  { time: '10:14:35', title: 'Failed Authentication Attempt 2', desc: 'Second consecutive failed login attempt.', badge: 'Suspicious', variant: 'warning' as const },
                  { time: '10:15:10', title: 'Authentication Bypass', desc: 'Brute-force PIN authenticated on secondary hardware.', badge: 'Critical', variant: 'danger' as const },
                  { time: '10:15:22', title: 'New Device Binding: DEVICE-002', desc: 'Samsung Galaxy S24 Ultra fingerprint registered.', badge: 'New Device', variant: 'warning' as const },
                  { time: '10:15:40', title: 'Impossible Geo-Velocity', desc: 'Session in London, UK (7,800 km from Chennai in 15 min).', badge: 'Anomaly', variant: 'danger' as const },
                  { time: '10:16:05', title: 'Tor/VPN Infrastructure Detected', desc: 'Connection through synthetic Tor exit node 92.43.11.88.', badge: 'VPN/TOR', variant: 'danger' as const },
                  { time: '10:16:30', title: 'New High-Risk Beneficiary', desc: '"Cayman Island Wire Exchange" added without transaction history.', badge: 'Mule Risk', variant: 'danger' as const },
                  { time: '10:16:55', title: 'High-Value Wire Transfer Initiated', desc: 'Outbound request ₹85,000 to offshore wire exchange.', badge: 'Spike', variant: 'danger' as const },
                  { time: '10:16:56', title: '10-Agent AI Interception', desc: 'Composite risk: 91/100 — Decision: BLOCK.', badge: 'Blocked', variant: 'danger' as const },
                  { time: '10:16:57', title: 'Incident Ticket Created', desc: 'INC-0001 auto-assigned for analyst review; device quarantined.', badge: 'Mitigated', variant: 'success' as const },
                ].map((step, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className={`timeline-dot ${idx === 9 ? 'timeline-dot-active' : ''}`} style={{
                      background: step.variant === 'success' ? 'var(--success-text)' : step.variant === 'danger' ? 'var(--danger-text)' : 'var(--warning-text)',
                    }} />
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', width: 55, flexShrink: 0 }}>{step.time}</span>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{step.title}</span>
                          <SBadge variant={step.variant}>{step.badge}</SBadge>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.desc}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 5: SECURITY GRAPH ── */}
        {activeTab === 'graph' && (
          <div>
            <SectionHeader title="Cross-Domain Security Graph" desc="Topology connecting Customer → Device → IP → Session → Transaction → Beneficiary → Incident." />
            <Card style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, alignItems: 'center', marginBottom: 20 }}>
                {[
                  { label: 'Customer', value: 'Karthik Nair', variant: 'violet' as const },
                  null,
                  { label: 'Device', value: 'DEVICE-002 (S24)', variant: 'danger' as const },
                  null,
                  { label: 'IP Network', value: '92.43.11.88 (Tor)', variant: 'danger' as const },
                  null,
                  { label: 'Beneficiary', value: 'Cayman Wire', variant: 'warning' as const },
                ].map((node, i) =>
                  node === null ? (
                    <div key={i} style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: 18, fontWeight: 300 }}>→</div>
                  ) : (
                    <div key={i}
                      style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: `1px solid ${node.variant === 'violet' ? 'var(--violet-border)' : node.variant === 'danger' ? 'var(--danger-border)' : 'var(--warning-border)'}`,
                        background: node.variant === 'violet' ? 'var(--violet-light)' : node.variant === 'danger' ? 'var(--danger-light)' : 'var(--warning-light)',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4, color: node.variant === 'violet' ? 'var(--violet-text)' : node.variant === 'danger' ? 'var(--danger-text)' : 'var(--warning-text)' }}>{node.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{node.value}</div>
                    </div>
                  )
                )}
              </div>
              <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Correlation Summary</div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Cross-domain engine flagged 4 simultaneous threat signals: unrecognized hardware ID (DEVICE-002),
                  anonymized Tor IP routing, impossible geo-velocity (Chennai → London in 15m), and unverified
                  offshore mule payee. Result: Composite Risk 91/100, Autonomous BLOCK, INC-0001 dispatched.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* ── TAB 6: DEVICES ── */}
        {activeTab === 'devices' && (
          <div>
            <SectionHeader title="Device Fleet Intelligence" desc="Hardware trust bindings, subnet IPs, and quarantine controls." onRefresh={loadAllData} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {devices.map((dev) => {
                const isBlocked = dev.trust_level === 'BLOCKED';
                const isTrusted = dev.trust_level === 'TRUSTED';
                return (
                  <Card key={dev.id} style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 8,
                          background: isTrusted ? 'var(--success-light)' : 'var(--danger-light)',
                          border: `1px solid ${isTrusted ? 'var(--success-border)' : 'var(--danger-border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <Smartphone size={16} color={isTrusted ? 'var(--success-text)' : 'var(--danger-text)'} />
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{dev.device_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{dev.device_model} · {dev.os_version}</div>
                        </div>
                      </div>
                      <SBadge variant={isTrusted ? 'success' : 'danger'}>{dev.trust_level}</SBadge>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '10px 12px', borderRadius: 6, background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-subtle)', marginBottom: 12 }}>
                      {[['Hardware ID', dev.device_id], ['IP Address', dev.ip_address], ['Network', dev.ip_type], ['Location', dev.location?.split(',')[0]]].map(([k, v]) => (
                        <div key={k}>
                          <div style={{ fontSize: 9, color: 'var(--text-dim)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>{k}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {isBlocked ? (
                        <button onClick={() => handleRestoreDevice(dev.device_id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'var(--success-light)', color: 'var(--success-text)', border: '1px solid var(--success-border)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <CheckCircle2 size={13} /> Restore Device
                        </button>
                      ) : (
                        <button onClick={() => handleQuarantineDevice(dev.device_id)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', background: 'var(--danger-light)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                          <Ban size={13} /> Quarantine Device
                        </button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── TAB 7: DIGITAL TWIN ── */}
        {activeTab === 'digital-twin' && digitalTwin && (
          <div>
            <SectionHeader title="Customer Digital Twin" desc={`Behavioral baseline for ${digitalTwin.full_name} — continuously updated from payment history.`} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {[
                { label: 'Spending Baseline', value: `₹${digitalTwin.typical_amount_range?.average?.toLocaleString('en-IN')} avg`, sub: `Range: ₹${digitalTwin.typical_amount_range?.min} – ₹${digitalTwin.typical_amount_range?.max}` },
                { label: 'Active Hours', value: digitalTwin.typical_hours?.label, sub: 'Transactions outside this window trigger step-up.' },
                { label: 'Known Devices & Locations', value: digitalTwin.typical_devices?.join(', '), sub: `Locations: ${digitalTwin.typical_locations?.join(', ')}` },
              ].map((card) => (
                <div key={card.label} className="kpi-card">
                  <span className="kpi-label">{card.label}</span>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{card.value}</div>
                  <div className="kpi-sub">{card.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 8: THREAT INTEL ── */}
        {activeTab === 'threat-intel' && (
          <div>
            <SectionHeader title="Threat Intelligence Registry" desc="Indicators of Compromise (IOCs), Tor exit nodes, and mule beneficiary tags." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {threatIntel.map((ti) => (
                <Card key={ti.id} style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{ti.indicator}</span>
                      <SBadge>{ti.indicator_type}</SBadge>
                      <SBadge variant="danger">{ti.severity}</SBadge>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{ti.description}</div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>Confidence: {ti.confidence}%</div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 9: AI AGENTS ── */}
        {activeTab === 'ai-agents' && (
          <div>
            <SectionHeader title="AI Security Engine" desc="10 independent agents evaluating every transaction in parallel. Combined weight: 100%." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {agents.map((ag) => (
                <Card key={ag.agent_id} style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ag.name}</span>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-text)', fontFamily: 'var(--font-mono)' }}>{ag.weight_pct}</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>{ag.description}</div>
                  <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', padding: '4px 8px', background: 'rgba(0,0,0,0.2)', borderRadius: 4, color: 'var(--text-dim)' }}>
                    METHOD: {ag.method}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 10: QUANTUM RISK ── */}
        {activeTab === 'quantum-risk' && (
          <div>
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--violet-light)', border: '1px solid var(--violet-border)', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--violet-text)' }}>Post-Quantum Cryptography Risk Assessment</span>
                <SBadge variant="violet">FIPS 203 / 204</SBadge>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Audits algorithmic exposure to Harvest-Now-Decrypt-Later (HNDL) attacks per NIST PQC 2024. Assesses cryptographic readiness — not real-time quantum attack detection.
              </p>
            </div>
            <SectionHeader title="Quantum Risk Register" desc="Cryptographic assets evaluated for post-quantum readiness." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {quantumAssets.map((asset) => (
                <Card key={asset.id} style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{asset.asset_name}</span>
                      <SBadge>{asset.algorithm} ({asset.key_size}-bit)</SBadge>
                    </div>
                    <SBadge variant={asset.pqc_ready ? 'success' : 'danger'}>{asset.pqc_ready ? 'PQC Compliant' : 'Vulnerable (HNDL)'}</SBadge>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8, lineHeight: 1.5 }}>{asset.recommendation}</div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                    <span>Protocol: {asset.protocol}</span>
                    <span>Status: {asset.migration_status}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 11: AI COPILOT ── */}
        {activeTab === 'copilot' && (
          <div>
            <SectionHeader title="AI Security Copilot" desc="Natural language intelligence querying live transactions, incidents, and device states." />
            <Card style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 520 }}>
              <div ref={chatRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {copilotChat.map((msg, idx) => (
                  <div key={idx}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      maxWidth: '80%',
                      alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      background: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-surface)',
                      border: `1px solid ${msg.sender === 'user' ? 'transparent' : 'var(--border-subtle)'}`,
                    }}
                  >
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: msg.sender === 'user' ? 'rgba(255,255,255,0.6)' : 'var(--text-dim)', marginBottom: 4 }}>
                      {msg.sender === 'user' ? 'Analyst' : 'AI Copilot'}
                    </div>
                    <div style={{ fontSize: 13, color: msg.sender === 'user' ? '#fff' : 'var(--text-secondary)', lineHeight: 1.5 }}>{msg.text}</div>
                    {msg.data && (
                      <pre style={{ marginTop: 8, padding: '8px', borderRadius: 6, background: 'rgba(0,0,0,0.3)', color: 'var(--primary-text)', fontSize: 10, fontFamily: 'var(--font-mono)', overflowX: 'auto' }}>
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
                {copilotLoading && (
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>Copilot is thinking...</div>
                )}
              </div>
              <form onSubmit={handleCopilotSubmit} style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
                <input
                  type="text"
                  value={copilotQuestion}
                  onChange={(e) => setCopilotQuestion(e.target.value)}
                  placeholder="e.g. Why was TXN-XXXX blocked? or Summarize today's critical incidents."
                  style={{ flex: 1, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-dim)', borderRadius: 8, fontSize: 13, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', outline: 'none' }}
                />
                <button type="submit" disabled={copilotLoading}
                  style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: copilotLoading ? 0.6 : 1 }}>
                  Ask
                </button>
              </form>
            </Card>
          </div>
        )}

        {/* ── TAB 12: AUDIT LOGS ── */}
        {activeTab === 'audit-logs' && (
          <div>
            <SectionHeader title="Immutable Audit Trail" desc="Tamper-evident logs of logins, overrides, quarantines, and policy updates." onRefresh={loadAllData} />
            <Card style={{ padding: 0, overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {['Timestamp', 'Actor', 'Action', 'Resource', 'Description'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{log.created_at ? new Date(log.created_at).toLocaleTimeString() : 'Recent'}</td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{log.actor_name}</td>
                      <td style={{ color: 'var(--primary-text)', fontWeight: 600 }}>{log.action}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{log.resource_id || '—'}</td>
                      <td>{log.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        )}

      </main>

      {/* ══ ANALYST OVERRIDE MODAL ══ */}
      {overrideModalIncident && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setOverrideModalIncident(null)}
        >
          <div
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-lg)', animation: 'fadeInScale 0.25s ease' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--primary-text)', fontFamily: 'var(--font-mono)' }}>Analyst Override</span>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                {overrideModalIncident.incident_id}: {overrideModalIncident.title}
              </h3>
            </div>
            <form onSubmit={handleOverrideSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Override Decision</label>
                <select
                  value={overrideAction}
                  onChange={(e) => setOverrideAction(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-dim)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none' }}
                >
                  <option value="KEEP_BLOCKED">Keep Blocked — Confirm Malicious</option>
                  <option value="APPROVE_OVERRIDE">Approve Override — Release Transaction</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Justification (Required for Audit)</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  required rows={3}
                  placeholder="Enter regulatory justification for audit record..."
                  style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-dim)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)', outline: 'none', resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setOverrideModalIncident(null)}
                  style={{ flex: 1, padding: '9px', background: 'transparent', border: '1px solid var(--border-dim)', borderRadius: 8, fontSize: 13, color: 'var(--text-muted)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit"
                  style={{ flex: 1, padding: '9px', background: 'var(--primary)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
                  Confirm & Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function SOCDashboard() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid var(--border-dim)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading Security Operations Center...</p>
        </div>
      </div>
    }>
      <SOCDashboardContent />
    </Suspense>
  );
}
