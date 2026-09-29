'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, WS_URL } from '@/lib/api';
import {
  Sliders,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Activity,
  Zap,
  Globe,
  QrCode,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

export default function NexGuardLiveSecurityDemo() {
  const [running, setRunning] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [activeResult, setActiveResult] = useState<any>(null);
  const [liveEvents, setLiveEvents] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(WS_URL);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const timestamp = new Date().toLocaleTimeString();
          const newEvent = { ...payload, timestamp };
          setLiveEvents((prev) => [newEvent, ...prev.slice(0, 15)]);
          if (payload.data) setActiveResult(payload.data);
        } catch (err) { console.error(err); }
      };
    } catch (err) { console.error(err); }
    return () => { if (ws) ws.close(); };
  }, []);

  const triggerScenario = async (key: string, name: string) => {
    setRunning(true);
    setActiveScenario(name);
    try {
      const data = await api(`/demo/scenario/${key}`, { method: 'POST' });
      setActiveResult(data);
    } catch (err: any) { console.error(err); }
    finally { setRunning(false); }
  };

  const renderRadarChart = (scores: Record<string, number>) => {
    const agents = [
      { key: 'fraud', label: 'FRAUD' },
      { key: 'cyber', label: 'CYBER' },
      { key: 'behavior', label: 'BEHAV' },
      { key: 'device', label: 'DEVICE' },
      { key: 'geo', label: 'GEO' },
      { key: 'beneficiary', label: 'BENEF' },
      { key: 'ip', label: 'IP' },
      { key: 'session', label: 'SESSION' },
    ];
    const size = 200;
    const center = size / 2;
    const radius = 72;
    const angleStep = (Math.PI * 2) / agents.length;

    const points = agents.map((ag, i) => {
      const score = Math.min(100, Math.max(5, scores[ag.key] ?? 20));
      const r = (score / 100) * radius;
      const angle = i * angleStep - Math.PI / 2;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    }).join(' ');

    const isHot = activeResult?.status === 'BLOCK';

    return (
      <div className="flex flex-col items-center gap-3">
        <svg width={size} height={size} className="overflow-visible">
          {[0.25, 0.5, 0.75, 1].map((lvl) => (
            <circle
              key={lvl} cx={center} cy={center} r={radius * lvl}
              fill="none"
              stroke={lvl === 1 ? 'rgba(0,212,255,0.12)' : 'rgba(255,255,255,0.05)'}
              strokeDasharray={lvl < 1 ? '3,3' : 'none'}
            />
          ))}
          {agents.map((ag, i) => {
            const angle = i * angleStep - Math.PI / 2;
            return (
              <line key={ag.key}
                x1={center} y1={center}
                x2={center + radius * Math.cos(angle)}
                y2={center + radius * Math.sin(angle)}
                stroke="rgba(255,255,255,0.07)"
              />
            );
          })}
          <polygon
            points={points}
            fill={isHot ? 'rgba(239,68,68,0.20)' : 'rgba(16,185,129,0.12)'}
            stroke={isHot ? '#EF4444' : '#10B981'}
            strokeWidth="1.5"
            style={{ filter: isHot ? 'drop-shadow(0 0 6px rgba(239,68,68,0.4))' : 'drop-shadow(0 0 6px rgba(16,185,129,0.3))' }}
          />
          {agents.map((ag, i) => {
            const score = Math.min(100, Math.max(5, scores[ag.key] ?? 20));
            const r = (score / 100) * radius;
            const angle = i * angleStep - Math.PI / 2;
            const x = center + r * Math.cos(angle);
            const y = center + r * Math.sin(angle);
            const dotColor = score > 60 ? '#EF4444' : score > 30 ? '#F59E0B' : '#10B981';
            return (
              <circle key={ag.key} cx={x} cy={y} r={3}
                fill={dotColor}
                style={{ filter: `drop-shadow(0 0 4px ${dotColor})` }}
              />
            );
          })}
          {agents.map((ag, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const lx = center + (radius + 18) * Math.cos(angle);
            const ly = center + (radius + 18) * Math.sin(angle);
            return (
              <text key={ag.key} x={lx} y={ly}
                textAnchor="middle" dominantBaseline="middle"
                fill="rgba(148,163,184,0.6)"
                fontSize="7" fontFamily="'JetBrains Mono', monospace" fontWeight="600"
              >
                {ag.label}
              </text>
            );
          })}
        </svg>

        <div className="grid grid-cols-4 gap-1.5 w-full">
          {agents.map((ag) => (
            <div
              key={ag.key}
              className="text-center p-1.5 rounded-lg"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-[8px] font-mono font-bold" style={{ color: '#475569' }}>{ag.label}</div>
              <div
                className="text-xs font-black font-mono"
                style={{
                  color: (scores[ag.key] ?? 0) > 60 ? '#F87171'
                    : (scores[ag.key] ?? 0) > 30 ? '#FBBF24' : '#34D399',
                }}
              >
                {scores[ag.key] ?? 12}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const defaultScores = activeResult?.agent_scores || {
    fraud:       activeResult?.status === 'BLOCK' ? 92 : 12,
    cyber:       activeResult?.status === 'BLOCK' ? 95 : 10,
    behavior:    activeResult?.status === 'BLOCK' ? 90 : 15,
    device:      activeResult?.status === 'BLOCK' ? 88 : 8,
    geo:         activeResult?.status === 'BLOCK' ? 94 : 5,
    beneficiary: activeResult?.status === 'BLOCK' ? 91 : 14,
    ip:          activeResult?.status === 'BLOCK' ? 89 : 6,
    session:     activeResult?.status === 'BLOCK' ? 85 : 9,
  };

  const getStatusStyle = (status: string) => {
    if (status === 'BLOCK') return { color: '#F87171', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.25)' };
    if (status === 'VERIFY') return { color: '#FBBF24', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)' };
    return { color: '#34D399', bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.25)' };
  };

  const decisionStyle = getStatusStyle(activeResult?.status || 'ALLOW');

  return (
    <div
      className="min-h-screen text-white flex flex-col"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#050810',
        backgroundImage: 'radial-gradient(rgba(0,212,255,0.04) 1px, transparent 0)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 right-0 h-64"
          style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(239,68,68,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* ══ HEADER ══ */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'rgba(5,8,16,0.90)',
          borderColor: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl transition"
              title="Portal"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              <ArrowLeft size={15} style={{ color: '#94A3B8' }} />
            </Link>

            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.90), rgba(239,68,68,0.80))',
                boxShadow: '0 0 18px rgba(245,158,11,0.25)',
              }}
            >
              <Sliders size={18} className="text-white" />
            </div>

            <div>
              <h1
                className="text-base font-bold text-white flex items-center gap-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <span>NEXGUARD ATTACK SIMULATION LAB</span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                  style={{
                    background: 'rgba(245,158,11,0.08)',
                    color: '#FBBF24',
                    borderColor: 'rgba(245,158,11,0.20)',
                  }}
                >
                  VIVA DUAL-PERSPECTIVE
                </span>
              </h1>
              <p className="text-[11px] font-mono" style={{ color: '#475569' }}>
                Customer Mobile Actions ⇄ Enterprise Bank SOC Radar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  background: wsConnected ? '#10B981' : '#EF4444',
                  boxShadow: wsConnected ? '0 0 6px #10B981' : '0 0 6px #EF4444',
                  animation: wsConnected ? 'blink 1.5s infinite' : 'none',
                }}
              />
              <span style={{ color: wsConnected ? '#34D399' : '#F87171', fontWeight: 700 }}>
                {wsConnected ? 'SOC STREAM ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <Link
              href="/connect"
              target="_blank"
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition border"
              style={{
                background: 'rgba(0,212,255,0.07)',
                color: '#00D4FF',
                borderColor: 'rgba(0,212,255,0.20)',
              }}
            >
              <QrCode size={13} className="inline mr-1.5" />
              Connect Phone
            </Link>

            <ThemeToggle />

            <Link
              href="/soc"
              target="_blank"
              className="text-xs font-bold px-3 py-1.5 rounded-xl transition text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(139,92,246,0.8))',
                boxShadow: '0 2px 12px rgba(124,58,237,0.20)',
              }}
            >
              Full SOC Console →
            </Link>
          </div>
        </div>
      </header>

      {/* ══ MAIN ══ */}
      <main className="relative z-10 max-w-7xl mx-auto w-full p-5 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ── LEFT: CUSTOMER DEVICES ── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#475569' }}>
              <Smartphone size={13} style={{ color: '#8B5CF6' }} />
              <span>CUSTOMER DEVICES</span>
            </h2>
            <span className="text-[10px] font-mono" style={{ color: '#334155' }}>1-Click Live Triggers</span>
          </div>

          {/* Phone A — Trusted */}
          <div
            className="p-4 rounded-2xl border space-y-3 transition-all"
            style={{
              background: 'rgba(10,16,28,0.85)',
              borderColor: 'rgba(16,185,129,0.15)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.30)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(16,185,129,0.15)')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.20)' }}
                >📱</div>
                <div>
                  <div className="text-xs font-bold" style={{ color: '#F0F4FF', fontFamily: "'Space Grotesk', sans-serif" }}>Phone A (Pixel 8)</div>
                  <div className="text-[10px] font-mono" style={{ color: '#475569' }}>Home Wi-Fi • Chennai IN</div>
                </div>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(16,185,129,0.10)', color: '#34D399', border: '1px solid rgba(16,185,129,0.25)' }}
              >TRUSTED</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerScenario('normal', 'Routine Payment (₹3,500)')}
                disabled={running}
                className="py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.20)',
                  color: '#34D399',
                }}
                onMouseEnter={e => !running && (e.currentTarget.style.background = 'rgba(16,185,129,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.08)')}
              >
                <Play size={11} />
                <span>Normal ₹3,500</span>
              </button>
              <button
                onClick={() => triggerScenario('high-value-fraud', 'Spending Spurt (₹38,000)')}
                disabled={running}
                className="py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{
                  background: 'rgba(245,158,11,0.08)',
                  border: '1px solid rgba(245,158,11,0.20)',
                  color: '#FBBF24',
                }}
                onMouseEnter={e => !running && (e.currentTarget.style.background = 'rgba(245,158,11,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.08)')}
              >
                <Play size={11} />
                <span>Spurt ₹38,000</span>
              </button>
            </div>
          </div>

          {/* Phone B — Rogue */}
          <div
            className="p-4 rounded-2xl border space-y-3 transition-all"
            style={{
              background: 'rgba(10,16,28,0.85)',
              borderColor: 'rgba(239,68,68,0.15)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.30)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)' }}
                >⚠️</div>
                <div>
                  <div className="text-xs font-bold" style={{ color: '#F0F4FF', fontFamily: "'Space Grotesk', sans-serif" }}>Phone B (Galaxy S24)</div>
                  <div className="text-[10px] font-mono" style={{ color: '#475569' }}>Tor VPN • London UK</div>
                </div>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(239,68,68,0.10)', color: '#F87171', border: '1px solid rgba(239,68,68,0.25)' }}
              >ROGUE / ATTACK</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => triggerScenario('account-takeover', 'Account Takeover (₹85,000)')}
                disabled={running}
                className="py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.20)', color: '#F87171' }}
                onMouseEnter={e => !running && (e.currentTarget.style.background = 'rgba(239,68,68,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
              >
                <Play size={11} /><span>ATO ₹85K</span>
              </button>
              <button
                onClick={() => triggerScenario('impossible-travel', 'Impossible Travel (>800km/h)')}
                disabled={running}
                className="py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.20)', color: '#A78BFA' }}
                onMouseEnter={e => !running && (e.currentTarget.style.background = 'rgba(124,58,237,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(124,58,237,0.08)')}
              >
                <Globe size={11} /><span>Geo-Velocity</span>
              </button>
            </div>
          </div>

          {/* Phone C — New */}
          <div
            className="p-4 rounded-2xl border space-y-3 transition-all"
            style={{
              background: 'rgba(10,16,28,0.85)',
              borderColor: 'rgba(245,158,11,0.15)',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.30)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(245,158,11,0.15)')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.20)' }}
                >📱</div>
                <div>
                  <div className="text-xs font-bold" style={{ color: '#F0F4FF', fontFamily: "'Space Grotesk', sans-serif" }}>Phone C (iPhone 15)</div>
                  <div className="text-[10px] font-mono" style={{ color: '#475569' }}>Unregistered Hardware</div>
                </div>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                style={{ background: 'rgba(245,158,11,0.10)', color: '#FBBF24', border: '1px solid rgba(245,158,11,0.25)' }}
              >NEW DEVICE</span>
            </div>
            <button
              onClick={() => triggerScenario('new-device', 'New Device First Transfer')}
              disabled={running}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.20)', color: '#00D4FF' }}
              onMouseEnter={e => !running && (e.currentTarget.style.background = 'rgba(0,212,255,0.14)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,212,255,0.08)')}
            >
              {running ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
              <span>Trigger New Device Verification</span>
            </button>
          </div>

          {/* Live Event Log */}
          <div
            className="p-4 rounded-2xl border"
            style={{ background: 'rgba(5,8,16,0.90)', borderColor: 'rgba(255,255,255,0.07)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#00D4FF' }}>
                <Radio size={11} />
                <span>LIVE SOC FEED</span>
              </span>
              <span
                className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full"
                style={{ background: wsConnected ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', color: wsConnected ? '#34D399' : '#F87171', border: wsConnected ? '1px solid rgba(16,185,129,0.20)' : '1px solid rgba(239,68,68,0.20)' }}
              >
                {liveEvents.length} events
              </span>
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {liveEvents.length === 0 ? (
                <div className="text-center py-6 text-[11px] font-mono" style={{ color: '#334155' }}>
                  Awaiting signals... Trigger a scenario above.
                </div>
              ) : (
                liveEvents.map((ev, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 p-2 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                  >
                    <span
                      className="text-[9px] font-mono shrink-0 mt-0.5"
                      style={{ color: ev.type === 'CRITICAL_ALERT' ? '#F87171' : ev.type === 'STEP_UP_CHALLENGE' ? '#FBBF24' : '#34D399' }}
                    >
                      {ev.timestamp}
                    </span>
                    <span className="text-[10px] font-mono" style={{ color: '#64748B' }}>
                      {ev.type}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: SOC MONITOR ── */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#475569' }}>
              <Activity size={13} style={{ color: '#10B981' }} />
              <span>SOC MONITOR &amp; TELEMETRY</span>
            </h2>
            <span
              className="text-[10px] font-mono font-bold"
              style={{ color: running ? '#FBBF24' : '#334155' }}
            >
              {running ? '⚡ EVALUATING IN <200ms...' : 'AWAITING SIGNALS'}
            </span>
          </div>

          {/* Main result panel */}
          <div
            className="p-5 rounded-2xl border space-y-5 relative overflow-hidden"
            style={{
              background: 'rgba(10,16,28,0.90)',
              borderColor: activeResult?.status === 'BLOCK'
                ? 'rgba(239,68,68,0.20)'
                : activeResult?.status === 'VERIFY'
                ? 'rgba(245,158,11,0.20)'
                : 'rgba(255,255,255,0.08)',
            }}
          >
            {/* Top accent */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: activeResult?.status === 'BLOCK'
                  ? 'linear-gradient(90deg, transparent, rgba(239,68,68,0.50), transparent)'
                  : activeResult?.status === 'VERIFY'
                  ? 'linear-gradient(90deg, transparent, rgba(245,158,11,0.50), transparent)'
                  : 'linear-gradient(90deg, transparent, rgba(0,212,255,0.30), transparent)',
              }}
            />

            {/* Transaction Summary */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3" style={{ paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider" style={{ color: '#475569' }}>
                  {activeResult?.transaction_id || 'LATEST INTERCEPTION'}
                </div>
                <div className="text-2xl font-black mt-1" style={{ color: '#F0F4FF', fontFamily: "'Space Grotesk', sans-serif" }}>
                  ₹{Number(activeResult?.amount || 85000).toLocaleString('en-IN')}
                </div>
                <div className="text-xs mt-0.5" style={{ color: '#475569' }}>
                  {activeResult?.merchant || activeResult?.merchant_name || 'Cayman Island Wire Exchange'}
                </div>
              </div>

              <div className="text-right">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black font-mono text-sm border"
                  style={{
                    background: decisionStyle.bg,
                    borderColor: decisionStyle.border,
                    color: decisionStyle.color,
                    boxShadow: `0 0 16px ${decisionStyle.bg}`,
                  }}
                >
                  {activeResult?.status === 'BLOCK' ? '🚨 BLOCKED' : activeResult?.status === 'VERIFY' ? '⚠️ VERIFY' : '✓ ALLOWED'}
                </div>
                <div className="text-xs font-mono mt-1.5" style={{ color: '#475569' }}>
                  Composite Risk:{' '}
                  <strong style={{ color: '#F0F4FF', fontWeight: 800 }}>{activeResult?.risk_score ?? 94}</strong>
                  <span style={{ color: '#334155' }}> / 100</span>
                </div>
              </div>
            </div>

            {/* Radar + Risk Contributors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase mb-2" style={{ color: '#475569' }}>
                  10-AGENT MULTI-AXIS RADAR
                </div>
                {renderRadarChart(defaultScores)}
              </div>

              <div className="space-y-2">
                <div className="text-[10px] font-mono font-bold uppercase" style={{ color: '#475569' }}>
                  RISK CONTRIBUTORS
                </div>
                {Object.entries(defaultScores).slice(0, 6).map(([ag, sc]: [string, any]) => (
                  <div key={ag} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono uppercase" style={{ color: '#475569' }}>
                      <span>{ag} Agent</span>
                      <span style={{ color: sc > 60 ? '#F87171' : sc > 30 ? '#FBBF24' : '#34D399', fontWeight: 700 }}>{sc}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${sc}%`,
                          background: sc > 60
                            ? 'linear-gradient(90deg, #EF4444, #F87171)'
                            : sc > 30
                            ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                            : 'linear-gradient(90deg, #10B981, #34D399)',
                          boxShadow: sc > 60 ? '0 0 6px rgba(239,68,68,0.4)' : 'none',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Forensic attribution */}
            <div
              className="p-4 rounded-xl space-y-2"
              style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="text-[10px] font-mono font-bold uppercase" style={{ color: '#475569' }}>
                FORENSIC ATTRIBUTION SUMMARY:
              </span>
              <ul className="space-y-1.5">
                {(activeResult?.reasons || [
                  'New device fingerprint unassociated with customer profile',
                  'Impossible travel velocity (>800 km/h) from previous anchor',
                  'Tor/VPN exit node IP identified in real-time threat feed',
                  'High transaction value deviates significantly from Digital Twin',
                ]).map((r: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-[11px]" style={{ color: '#94A3B8' }}>
                    <span style={{ color: '#F87171', fontWeight: 900, flexShrink: 0 }}>•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
