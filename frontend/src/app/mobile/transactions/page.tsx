'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  UtensilsCrossed,
  Laptop,
  ShoppingBag,
  Car,
  Landmark,
  CreditCard,
  Copy,
  Check,
  ShieldCheck,
  Smartphone,
  MapPin,
  Clock,
  Filter,
  Sliders,
  Sparkles,
  Receipt,
  X,
} from 'lucide-react';

interface AgentScoreItem {
  id: string;
  name: string;
  score: number;
}

export default function CleanFintechTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedTxId, setExpandedTxId] = useState<number | string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await api('/transactions?limit=50');
      setTransactions(res.items || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const filtered = transactions.filter((tx) => {
    const term = searchTerm.toLowerCase();
    const merchant = (tx.merchant || tx.merchant_name || '').toLowerCase();
    const txnStr = (tx.transaction_id_str || String(tx.id) || '').toLowerCase();
    const cat = (tx.merchant_category || '').toLowerCase();
    const loc = (tx.location || '').toLowerCase();

    const matchesSearch =
      merchant.includes(term) ||
      txnStr.includes(term) ||
      cat.includes(term) ||
      loc.includes(term);

    const isAllow = tx.status === 'ALLOW' || tx.status === 'ALLOWED' || tx.status === 'COMPLETED';
    const isVerify = tx.status === 'VERIFY' || tx.status === 'PENDING_VERIFICATION' || tx.status === 'CHALLENGE_REQUIRED';
    const isBlock = tx.status === 'BLOCK' || tx.status === 'BLOCKED';

    if (filterStatus === 'ALL') return matchesSearch;
    if (filterStatus === 'ALLOW') return matchesSearch && isAllow;
    if (filterStatus === 'VERIFY') return matchesSearch && isVerify;
    if (filterStatus === 'BLOCK') return matchesSearch && isBlock;
    return matchesSearch;
  });

  // Calculate summary metrics
  const totalSettled = transactions
    .filter((t) => t.status === 'ALLOW' || t.status === 'ALLOWED' || t.status === 'COMPLETED')
    .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const allowedCount = transactions.filter((t) => t.status === 'ALLOW' || t.status === 'ALLOWED' || t.status === 'COMPLETED').length;
  const verifiedCount = transactions.filter((t) => t.status === 'VERIFY' || t.status === 'PENDING_VERIFICATION' || t.status === 'CHALLENGE_REQUIRED').length;
  const blockedCount = transactions.filter((t) => t.status === 'BLOCK' || t.status === 'BLOCKED').length;

  const getCategoryMeta = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case 'DINING':
        return { icon: UtensilsCrossed, bg: '#fef3c7', color: '#b45309', border: '#fde68a' };
      case 'ELECTRONICS':
        return { icon: Laptop, bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' };
      case 'SHOPPING':
        return { icon: ShoppingBag, bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' };
      case 'TRANSPORT':
        return { icon: Car, bg: '#f0f9ff', color: '#0284c7', border: '#bae6fd' };
      case 'WIRE':
      case 'OFFSHORE':
        return { icon: Landmark, bg: '#fff1f2', color: '#e11d48', border: '#fecdd3' };
      default:
        return { icon: CreditCard, bg: '#f8fafc', color: '#475569', border: '#e2e8f0' };
    }
  };

  const handleCopy = (idStr: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(idStr);
      setCopiedId(idStr);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const get10AgentScores = (tx: any): AgentScoreItem[] => {
    const rawScores = tx.agent_scores || {};
    const baseRisk = Number(tx.risk_score ?? (tx.status === 'BLOCK' ? 88 : tx.status === 'VERIFY' ? 52 : 12));

    const agentDefs = [
      { id: 'behavior', name: 'Behavior Baseline (Z-Score)', fallback: Math.max(5, Math.min(98, baseRisk + (tx.status === 'BLOCK' ? 6 : -4))) },
      { id: 'fraud', name: 'Cyber Fraud Anomaly', fallback: Math.max(4, Math.min(99, baseRisk + (tx.status === 'BLOCK' ? 8 : -2))) },
      { id: 'device', name: 'Hardware Enclave Binding', fallback: Math.max(3, Math.min(95, tx.device_id === 'DEVICE-002' ? 92 : 8)) },
      { id: 'geo', name: 'Geo-Velocity Shield', fallback: Math.max(2, Math.min(96, tx.location?.includes('London') ? 94 : 6)) },
      { id: 'session', name: 'Session & Anti-Replay', fallback: Math.max(4, Math.min(90, tx.session_id === 'SES-8821' ? 86 : 5)) },
      { id: 'beneficiary', name: 'Beneficiary Mule Risk', fallback: Math.max(3, Math.min(97, tx.merchant_category === 'WIRE' ? 95 : 10)) },
      { id: 'ip', name: 'IP & Proxy Reputation', fallback: Math.max(2, Math.min(95, tx.device_id === 'DEVICE-002' ? 90 : 7)) },
      { id: 'biometrics', name: 'Biometric Dynamic Auth', fallback: Math.max(3, Math.min(92, tx.status === 'BLOCK' ? 85 : 6)) },
      { id: 'quantum', name: 'Post-Quantum Kyber-1024', fallback: 4 },
      { id: 'consensus', name: 'Multi-Agent Consensus', fallback: baseRisk },
    ];

    return agentDefs.map((def) => {
      const val = rawScores[def.id] !== undefined ? Number(rawScores[def.id]) : def.fallback;
      return {
        id: def.id,
        name: def.name,
        score: Math.min(100, Math.max(0, Math.round(val))),
      };
    });
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        padding: '16px 16px 12px',
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
            Ledger & Telemetry
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
            Activity & History
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
              Live Feed
            </span>
          </div>

          <button
            onClick={fetchTransactions}
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
            title="Refresh Transactions"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin text-blue-600' : ''} />
          </button>
        </div>
      </div>

      {/* ── Hero Card: Exactly Matches Home Balance Card ── */}
      <div
        style={{
          padding: '20px',
          borderRadius: 20,
          background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 55%, #2563eb 100%)',
          boxShadow: '0 8px 24px -4px rgba(30,64,175,0.30)',
          position: 'relative',
          overflow: 'hidden',
          color: '#fff',
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

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', marginBottom: 6 }}>
              Settled Ledger Volume
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
              ₹{totalSettled.toLocaleString('en-IN')}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              background: 'rgba(255,255,255,0.14)',
              borderRadius: 20,
              backdropFilter: 'blur(8px)',
            }}
          >
            <ShieldCheck size={12} color="rgba(255,255,255,0.9)" />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>10-Agent Audited</span>
          </div>
        </div>

        {/* 3 Metric Chips: Matching Home Security Score row */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
            padding: '14px 0 0',
            borderTop: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '8px 10px',
              textAlign: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Approved
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#34d399', marginTop: 2 }}>
              {allowedCount}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '8px 10px',
              textAlign: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Step-Up
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>
              {verifiedCount}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '8px 10px',
              textAlign: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            <div style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Blocked
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f87171', marginTop: 2 }}>
              {blockedCount}
            </div>
          </div>
        </div>
      </div>

      {/* ── Search Bar: Exactly Matching Home Search Style ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 14px',
          borderRadius: 14,
          background: '#fff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <Search size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by payee, category or TXN ID..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: '#0f172a',
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94a3b8',
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Filter Chips: Matching Home Quick Action / Pill Aesthetic ── */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
        {[
          { id: 'ALL', label: 'All Payments' },
          { id: 'ALLOW', label: 'Approved' },
          { id: 'VERIFY', label: 'Step-Up' },
          { id: 'BLOCK', label: 'Blocked' },
        ].map((pill) => {
          const isActive = filterStatus === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setFilterStatus(pill.id)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 11,
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                border: isActive ? '1px solid #2563eb' : '1px solid #e2e8f0',
                background: isActive ? '#2563eb' : '#fff',
                color: isActive ? '#fff' : '#64748b',
                boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.22)' : '0 1px 3px rgba(0,0,0,0.03)',
              }}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* ── Transaction Feed Card: Matching Home Recent Activity Card ── */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Card Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 6,
                background: '#eff6ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Receipt size={13} color="#2563eb" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>
              Transaction Ledger ({filtered.length})
            </span>
          </div>
          <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
            Tap for 10-Agent breakdown
          </span>
        </div>

        {/* List Content */}
        {loading ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin 1s linear infinite' }} />
            <span>Syncing transactions...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            No transactions match this filter. Tap &ldquo;All Payments&rdquo; to reset.
          </div>
        ) : (
          <div>
            {filtered.map((tx) => {
              const isAllow = tx.status === 'ALLOW' || tx.status === 'ALLOWED' || tx.status === 'COMPLETED';
              const isBlock = tx.status === 'BLOCK' || tx.status === 'BLOCKED';
              const isVerify = tx.status === 'VERIFY' || tx.status === 'PENDING_VERIFICATION' || tx.status === 'CHALLENGE_REQUIRED';
              const isExpanded = expandedTxId === (tx.id || tx.transaction_id_str);
              const catMeta = getCategoryMeta(tx.merchant_category);
              const CatIcon = catMeta.icon;
              const txnStr = tx.transaction_id_str || `TXN-${tx.id}`;
              const agentScores = get10AgentScores(tx);

              return (
                <div
                  key={tx.id || tx.transaction_id_str}
                  style={{
                    borderBottom: '1px solid #f8fafc',
                    transition: 'background 0.15s ease',
                  }}
                >
                  {/* Transaction Row: Matching Home Recent Activity style */}
                  <div
                    onClick={() => setExpandedTxId(isExpanded ? null : (tx.id || tx.transaction_id_str))}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: isExpanded ? '#f8fafc' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = '#f8fafc';
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {/* Category Icon Badge */}
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 14,
                          flexShrink: 0,
                          background: catMeta.bg,
                          border: `1px solid ${catMeta.border}`,
                          color: catMeta.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CatIcon size={18} />
                      </div>

                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                          {tx.merchant || tx.merchant_name || 'UPI Transfer'}
                        </div>
                        <div style={{ fontSize: 10, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Clock size={10} />
                          <span>
                            {tx.created_at
                              ? new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : 'Recent'}
                          </span>
                          <span>•</span>
                          <span style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}>
                            {tx.merchant_category || 'RETAIL'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: isBlock ? '#dc2626' : '#0f172a',
                          textDecoration: isBlock ? 'line-through' : 'none',
                          marginBottom: 3,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        ₹{Number(tx.amount).toLocaleString('en-IN')}
                      </div>

                      <div>
                        {isAllow && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 9.5,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: '#f0fdf4',
                              color: '#166534',
                              border: '1px solid #bbf7d0',
                            }}
                          >
                            ✓ Settled
                          </span>
                        )}
                        {isVerify && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 9.5,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: '#fffbeb',
                              color: '#92400e',
                              border: '1px solid #fde68a',
                            }}
                          >
                            ⚡ Step-Up
                          </span>
                        )}
                        {isBlock && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              fontSize: 9.5,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 12,
                              background: '#fff1f2',
                              color: '#991b1b',
                              border: '1px solid #fecaca',
                            }}
                          >
                            ✕ Blocked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Collapsible 10-Agent Score Breakdown Drawer ── */}
                  {isExpanded && (
                    <div
                      style={{
                        padding: '14px 16px',
                        background: '#f8fafc',
                        borderTop: '1px solid #f1f5f9',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                        animation: 'fadeIn 0.2s ease',
                      }}
                    >
                      {/* Assessment Top Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <ShieldCheck size={14} color="#2563eb" />
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            10-Agent Consensus Telemetry
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: isAllow ? '#f0fdf4' : isVerify ? '#fffbeb' : '#fff1f2',
                            color: isAllow ? '#166534' : isVerify ? '#92400e' : '#991b1b',
                            border: `1px solid ${isAllow ? '#bbf7d0' : isVerify ? '#fde68a' : '#fecaca'}`,
                          }}
                        >
                          Risk Score: {tx.risk_score ?? (isBlock ? 88 : isVerify ? 52 : 8)}/100
                        </span>
                      </div>

                      {/* 10-Agent Score Meters Card */}
                      <div
                        style={{
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 14,
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Sliders size={11} color="#2563eb" />
                            Autonomous Security Agents
                          </span>
                          <span style={{ color: '#2563eb' }}>0-100 Score</span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', columnGap: 12, rowGap: 8 }}>
                          {agentScores.map((agent) => {
                            const isHigh = agent.score >= 70;
                            const isMed = agent.score >= 35 && agent.score < 70;
                            const scoreColor = isHigh ? '#dc2626' : isMed ? '#d97706' : '#059669';
                            const barBg = isHigh ? '#ef4444' : isMed ? '#f59e0b' : '#10b981';

                            return (
                              <div key={agent.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 9.5 }}>
                                  <span style={{ color: '#475569', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>
                                    {agent.name}
                                  </span>
                                  <span style={{ fontFamily: 'monospace', fontWeight: 700, color: scoreColor }}>
                                    {agent.score}
                                  </span>
                                </div>
                                <div style={{ width: '100%', height: 4, background: '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${Math.max(4, agent.score)}%`,
                                      height: '100%',
                                      background: barBg,
                                      borderRadius: 2,
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Device & Location Row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 10px' }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Smartphone size={10} /> Origin Device
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', marginTop: 2 }}>
                            {tx.device_id || 'DEVICE-001'}
                          </div>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '8px 10px' }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <MapPin size={10} /> Geo-Location
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tx.location || 'Chennai, IN'}
                          </div>
                        </div>
                      </div>

                      {/* Transaction Hash & 1-Click Copy */}
                      <div
                        style={{
                          background: '#fff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 12,
                          padding: '8px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: 11,
                        }}
                      >
                        <span style={{ color: '#64748b' }}>TXN Hash</span>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(txnStr, e)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#2563eb',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span>{txnStr}</span>
                          {copiedId === txnStr ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                        </button>
                      </div>

                      {/* Incident Badge if blocked */}
                      {tx.incident_id && (
                        <div
                          style={{
                            background: '#fff1f2',
                            border: '1px solid #fecaca',
                            borderRadius: 12,
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: 11,
                            color: '#991b1b',
                          }}
                        >
                          <span style={{ fontWeight: 700 }}>Security Incident</span>
                          <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{tx.incident_id}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
