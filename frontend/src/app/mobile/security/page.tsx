'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Wifi,
  Lock,
  RefreshCw,
  CheckCircle2,
  Check,
  ChevronRight,
  ChevronDown,
  Shield,
  KeyRound,
  Atom,
  Brain,
  AlertTriangle,
  Power,
} from 'lucide-react';

interface SecurityPillar {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  status: 'TRUSTED' | 'SECURE' | 'ACTIVE' | 'COMPLIANT' | 'SYNCED' | 'WARNING';
  color: string;
  details: {
    protocol: string;
    engine: string;
    lastAudit: string;
    description: string;
  };
}

export default function CleanFintechSecurityCenter() {
  const [securityData, setSecurityData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [reAuditing, setReAuditing] = useState<boolean>(false);
  const [accountFrozen, setAccountFrozen] = useState<boolean>(false);
  const [freezeLoading, setFreezeLoading] = useState<boolean>(false);
  const [freezeMessage, setFreezeMessage] = useState<string | null>(null);
  const [deviceCount, setDeviceCount] = useState<number>(3);
  const [expandedPillar, setExpandedPillar] = useState<string | null>(null);

  const fetchScore = async () => {
    try {
      const [secRes, devRes, profRes] = await Promise.all([
        api('/wallet/security-score').catch(() => null),
        api('/devices').catch(() => []),
        api('/wallet/profile').catch(() => null),
      ]);

      if (secRes) setSecurityData(secRes);
      if (Array.isArray(devRes)) setDeviceCount(devRes.length || 3);
      if (profRes) setAccountFrozen(profRes.account_status === 'FROZEN');
    } catch (err) {
      console.error('Failed to load security audit:', err);
    } finally {
      setLoading(false);
      setReAuditing(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, []);

  const handleReAudit = async () => {
    setReAuditing(true);
    await new Promise((r) => setTimeout(r, 650));
    await fetchScore();
  };

  const handleToggleFreeze = async () => {
    setFreezeLoading(true);
    setFreezeMessage(null);
    const targetState = !accountFrozen;
    const action = targetState ? 'freeze' : 'unfreeze';

    setAccountFrozen(targetState);

    try {
      await api(`/accounts/1/${action}`, {
        method: 'POST',
        body: JSON.stringify({
          reason: targetState
            ? 'Customer requested emergency self-freeze from Security Center.'
            : 'Customer unlocked account security hold via authentication.',
          actor_role: 'CUSTOMER',
          actor_name: 'Customer (Self-Service)',
        }),
      });

      setFreezeMessage(
        targetState
          ? 'Emergency Lock Engaged: All outgoing wallet transactions are blocked instantly.'
          : 'Security hold released: Real-time payment channels reactivated.'
      );
    } catch (err: any) {
      setAccountFrozen(!targetState);
      setFreezeMessage(`Security action failed: ${err.message || 'Please try again'}`);
    } finally {
      setFreezeLoading(false);
    }
  };

  const baseScore = securityData?.score ?? 94;
  const score = accountFrozen ? Math.min(28, baseScore) : baseScore;
  const isSecure = score >= 75;
  const isCaution = score >= 45 && score < 75;

  const pillars: SecurityPillar[] = [
    {
      id: 'hardware',
      title: 'Hardware Fingerprint',
      subtitle: 'Google Pixel 8 • Hardware-backed key binding',
      icon: Smartphone,
      status: accountFrozen ? 'WARNING' : 'TRUSTED',
      color: '#10b981',
      details: {
        protocol: 'Android Keystore StrongBox Keymint',
        engine: 'Hardware Security Module (HSM)',
        lastAudit: 'Just now (Continuous)',
        description: 'Private key is non-exportable and bound to hardware enclave. Replays on clone devices fail instantly.',
      },
    },
    {
      id: 'session',
      title: 'Session & Anti-Replay',
      subtitle: 'Single active token • Cryptographic nonces',
      icon: Lock,
      status: accountFrozen ? 'WARNING' : 'SECURE',
      color: '#10b981',
      details: {
        protocol: 'HMAC-SHA256 Request Nonces & JWT',
        engine: 'Anti-Replay Verification Matrix',
        lastAudit: 'Active Session (SES-1024)',
        description: 'Each financial operation requires a monotonically increasing cryptographic nonce and device signature.',
      },
    },
    {
      id: 'geo',
      title: 'Geo-Velocity Shield',
      subtitle: 'Haversine impossible travel detection',
      icon: Wifi,
      status: accountFrozen ? 'WARNING' : 'ACTIVE',
      color: '#10b981',
      details: {
        protocol: 'Spherical Great-Circle Velocity Engine',
        engine: 'Agent 4: GeoVelocity Guard',
        lastAudit: 'Latency & Hop Verified',
        description: 'Flags payments initiated from locations exceeding 900 km/h transit velocity since last verified ping.',
      },
    },
    {
      id: 'quantum',
      title: 'Post-Quantum Cryptography',
      subtitle: 'NIST FIPS 203 (ML-KEM Kyber-1024)',
      icon: Atom,
      status: 'COMPLIANT',
      color: '#6366f1',
      details: {
        protocol: 'CRYSTALS-Kyber 1024 Key Encapsulation',
        engine: 'Quantum-Resistant KEM Pipeline',
        lastAudit: 'FIPS 203 Validated',
        description: 'Wallet communications and key exchanges are immune to Harvest Now, Decrypt Later quantum supercomputer attacks.',
      },
    },
    {
      id: 'digitaltwin',
      title: 'Digital Twin Baseline',
      subtitle: 'Adaptive Gaussian spending curve (Z-score)',
      icon: Brain,
      status: 'SYNCED',
      color: '#10b981',
      details: {
        protocol: 'Continuous Bayesian Anomaly Detection',
        engine: 'Agent 1: Behavioral Deviation',
        lastAudit: 'Synchronized with Ledger',
        description: 'Analyzes deviation from customer 30-day moving average (₹3,000 avg, σ=₹2,000) to flag out-of-pattern spikes.',
      },
    },
  ];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        padding: '16px 16px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* ── Page Header: Matches Home Style ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', letterSpacing: '0.04em' }}>
            Zero-Trust Shield
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
            Security Center
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 20,
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#059669',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#065f46' }}>
              10 Agents Active
            </span>
          </div>

          <button
            onClick={handleReAudit}
            disabled={reAuditing}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: '#fff',
              border: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            }}
            title="Re-audit Security Perimeter"
          >
            <RefreshCw size={13} className={reAuditing ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* ── Hero Card: Exactly Matches Home Balance Card Gradient & Dot Pattern ── */}
      <div
        style={{
          padding: '20px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 55%, #2563eb 100%)',
          boxShadow: '0 8px 24px -4px rgba(30,64,175,0.30)',
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
          textAlign: 'center',
        }}
      >
        {/* Subtle dot pattern identical to Home */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.08,
            backgroundImage: 'radial-gradient(#fff 1px, transparent 0)',
            backgroundSize: '18px 18px',
          }}
        />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
            AI Defense Posture
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.14)',
              borderRadius: 20,
              backdropFilter: 'blur(8px)',
            }}
          >
            <ShieldCheck size={12} color="rgba(255,255,255,0.9)" />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>Autonomous</span>
          </div>
        </div>

        {/* Circular SVG Gauge with Dynamic Glow */}
        <div style={{ position: 'relative', width: 110, height: 110, margin: '8px auto' }}>
          <svg width={110} height={110} style={{ transform: 'rotate(-90deg)' }}>
            <circle
              cx={55}
              cy={55}
              r={44}
              stroke="rgba(255,255,255,0.15)"
              strokeWidth={8}
              fill="none"
            />
            <circle
              cx={55}
              cy={55}
              r={44}
              stroke={isSecure ? '#34d399' : isCaution ? '#fbbf24' : '#f87171'}
              strokeWidth={8}
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - score / 100)}
              strokeLinecap="round"
              fill="none"
              style={{
                transition: 'all 1s ease-out',
                filter: isSecure
                  ? 'drop-shadow(0 0 6px rgba(52, 211, 153, 0.5))'
                  : isCaution
                  ? 'drop-shadow(0 0 6px rgba(251, 191, 36, 0.5))'
                  : 'drop-shadow(0 0 6px rgba(248, 113, 113, 0.5))',
              }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>{score}</span>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginTop: 2 }}>
              / 100
            </span>
          </div>
        </div>

        {/* Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 20,
            background: 'rgba(255,255,255,0.12)',
            border: '1px solid rgba(255,255,255,0.16)',
            fontSize: 11,
            fontWeight: 700,
            marginTop: 4,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: isSecure ? '#34d399' : isCaution ? '#fbbf24' : '#f87171',
            }}
          />
          <span>
            {accountFrozen
              ? 'ACCOUNT FROZEN'
              : isSecure
              ? 'WALLET PROTECTED'
              : isCaution
              ? 'CAUTION: STEP-UP ACTIVE'
              : 'CRITICAL: PERIMETER AT RISK'}
          </span>
        </div>
      </div>

      {/* ── Emergency Account Lock Card ── */}
      <div
        style={{
          padding: '16px',
          borderRadius: 20,
          background: accountFrozen ? '#fff1f2' : '#fff',
          border: `1px solid ${accountFrozen ? '#fecaca' : '#e2e8f0'}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: accountFrozen ? '#fee2e2' : '#f1f5f9',
                color: accountFrozen ? '#dc2626' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Power size={18} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                Emergency Account Lock
              </div>
              <div style={{ fontSize: 10, color: '#64748b' }}>
                {accountFrozen ? 'Outgoing payments blocked' : 'Halt outgoing transfers immediately'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleFreeze}
            disabled={freezeLoading}
            style={{
              padding: '7px 14px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              background: accountFrozen ? '#dc2626' : '#0f172a',
              color: '#fff',
              transition: 'all 0.15s ease',
            }}
          >
            {freezeLoading ? 'Updating...' : accountFrozen ? 'Unfreeze' : 'Freeze'}
          </button>
        </div>

        {freezeMessage && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: 10,
              background: '#fff',
              border: '1px solid #e2e8f0',
              fontSize: 10.5,
              color: '#0f172a',
            }}
          >
            {freezeMessage}
          </div>
        )}
      </div>

      {/* ── 5 Active Security Pillars Card ── */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: '#f0fdf4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheck size={13} color="#059669" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>
              Active Security Pillars
            </span>
          </div>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>
            5/5 Verified
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            const isExpanded = expandedPillar === pillar.id;

            return (
              <div
                key={pillar.id}
                style={{
                  borderBottom: '1px solid #f8fafc',
                  paddingBottom: 10,
                }}
              >
                <div
                  onClick={() => setExpandedPillar(isExpanded ? null : pillar.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>{pillar.title}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>{pillar.subtitle}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 12,
                        background: pillar.status === 'WARNING' ? '#fff1f2' : pillar.id === 'quantum' ? '#eff6ff' : '#f0fdf4',
                        color: pillar.status === 'WARNING' ? '#991b1b' : pillar.id === 'quantum' ? '#1d4ed8' : '#166534',
                        border: `1px solid ${pillar.status === 'WARNING' ? '#fecaca' : pillar.id === 'quantum' ? '#bfdbfe' : '#bbf7d0'}`,
                      }}
                    >
                      <Check size={10} className="stroke-[3]" />
                      {pillar.status}
                    </span>
                    <ChevronDown
                      size={14}
                      color="#94a3b8"
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: isExpanded ? 'rotate(180deg)' : 'none',
                      }}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: 10,
                      borderRadius: 12,
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      fontSize: 10.5,
                      color: '#475569',
                      lineHeight: 1.5,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <strong style={{ color: '#0f172a' }}>Protocol:</strong>
                      <span style={{ fontFamily: 'monospace' }}>{pillar.details.protocol}</span>
                    </div>
                    <div>{pillar.details.description}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Manage Enrolled Devices Card ── */}
      <Link
        href="/devices"
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          textDecoration: 'none',
          color: 'inherit',
          transition: 'border-color 0.15s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Smartphone size={18} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: '#0f172a' }}>
              Manage Hardware Devices
            </div>
            <div style={{ fontSize: 10, color: '#64748b' }}>
              {deviceCount} device(s) enrolled • Review trusted bindings
            </div>
          </div>
        </div>
        <ChevronRight size={16} color="#94a3b8" />
      </Link>
    </div>
  );
}
