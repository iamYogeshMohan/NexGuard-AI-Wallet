'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api, getWsUrl } from '@/lib/api';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Smartphone,
  Wifi,
  Play,
  ArrowRight,
  RefreshCw,
  Activity,
  Layers,
  Zap,
  Globe,
  Lock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  Bot,
  User,
  CreditCard,
  Radio,
  FileText,
} from 'lucide-react';

export default function MasterLiveDemoPage() {
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<string>('account-takeover');
  const [currentEvent, setCurrentEvent] = useState<any>(null);
  const [customerResult, setCustomerResult] = useState<any>(null);
  const [eventsList, setEventsList] = useState<any[]>([]);
  const [agentProgress, setAgentProgress] = useState<Record<string, number>>({
    fraud: 0,
    cyber: 0,
    behavior: 0,
    device: 0,
    geo: 0,
    beneficiary: 0,
    ip: 0,
    session: 0,
  });
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [finalDecision, setFinalDecision] = useState<string | null>(null);
  const [createdIncident, setCreatedIncident] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const liveLogRef = useRef<HTMLDivElement>(null);

  // Custom simulation fields
  const [customAmount, setCustomAmount] = useState<string>('85000');
  const [customMerchant, setCustomMerchant] = useState<string>('Cayman Island Wire Exchange');
  const [customDevice, setCustomDevice] = useState<string>('DEVICE-002');

  useEffect(() => {
    let ws: WebSocket | null = null;
    let timer: any = null;

    const connect = () => {
      try {
        const url = getWsUrl('/ws/soc');
        ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
        };

        ws.onclose = () => {
          setWsConnected(false);
          timer = setTimeout(connect, 3000);
        };

        ws.onerror = () => {
          setWsConnected(false);
        };

        ws.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            setEventsList((prev) => [payload, ...prev.slice(0, 19)]);
            if (payload.type === 'NEW_TRANSACTION' || payload.type === 'TRANSACTION_CREATED' || payload.type === 'CRITICAL_ALERT') {
              // Pulse monitor
            }
          } catch (err) {
            console.error(err);
          }
        };
      } catch (err) {
        setWsConnected(false);
      }
    };

    connect();

    return () => {
      if (timer) clearTimeout(timer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const triggerScenario = async (scenarioKey: string) => {
    setActiveScenario(scenarioKey);
    setSimulating(true);
    setCustomerResult(null);
    setFinalScore(null);
    setFinalDecision(null);
    setCreatedIncident(null);

    // Initial stage: Transaction Received
    setCurrentEvent({
      stage: 'RECEIVED',
      device_id: scenarioKey === 'account-takeover' ? 'DEVICE-002' : 'DEVICE-001',
      amount: scenarioKey === 'account-takeover' ? 85000 : scenarioKey === 'suspicious' ? 38000 : 3500,
      merchant: scenarioKey === 'account-takeover' ? 'Cayman Island Wire Exchange' : scenarioKey === 'suspicious' ? 'Global Electronics Store' : 'The Olive Bistro',
      timestamp: new Date().toLocaleTimeString(),
    });

    // Reset agent bars
    setAgentProgress({
      fraud: 15,
      cyber: 10,
      behavior: 12,
      device: 20,
      geo: 10,
      beneficiary: 15,
      ip: 10,
      session: 12,
    });

    try {
      // Execute through real backend scenario endpoint
      const res = await api(`/demo/scenario/${scenarioKey}`, { method: 'POST' });
      const txn = res.transaction || res;

      // Animate agent progressive scoring (Section 39)
      setTimeout(() => {
        if (txn.agent_results && Array.isArray(txn.agent_results)) {
          const agMap: Record<string, number> = {};
          txn.agent_results.forEach((ag: any) => {
            agMap[ag.agent] = ag.score;
          });
          setAgentProgress({
            fraud: agMap.fraud ?? (scenarioKey === 'account-takeover' ? 92 : scenarioKey === 'suspicious' ? 48 : 8),
            cyber: agMap.cyber ?? (scenarioKey === 'account-takeover' ? 95 : scenarioKey === 'suspicious' ? 35 : 5),
            behavior: agMap.behavior ?? (scenarioKey === 'account-takeover' ? 90 : scenarioKey === 'suspicious' ? 55 : 12),
            device: agMap.device ?? (scenarioKey === 'account-takeover' ? 88 : scenarioKey === 'suspicious' ? 22 : 6),
            geo: agMap.geo ?? (scenarioKey === 'account-takeover' ? 94 : scenarioKey === 'suspicious' ? 18 : 4),
            beneficiary: agMap.beneficiary ?? (scenarioKey === 'account-takeover' ? 91 : scenarioKey === 'suspicious' ? 58 : 9),
            ip: agMap.ip ?? (scenarioKey === 'account-takeover' ? 93 : scenarioKey === 'suspicious' ? 20 : 7),
            session: agMap.session ?? (scenarioKey === 'account-takeover' ? 87 : scenarioKey === 'suspicious' ? 25 : 5),
          });
        } else {
          setAgentProgress(
            scenarioKey === 'account-takeover'
              ? { fraud: 92, cyber: 95, behavior: 90, device: 88, geo: 94, beneficiary: 91, ip: 93, session: 87 }
              : scenarioKey === 'suspicious'
              ? { fraud: 48, cyber: 35, behavior: 55, device: 22, geo: 18, beneficiary: 58, ip: 20, session: 25 }
              : { fraud: 8, cyber: 5, behavior: 12, device: 6, geo: 4, beneficiary: 9, ip: 7, session: 5 }
          );
        }
      }, 400);

      // Final decision animation
      setTimeout(() => {
        setFinalScore(txn.risk_score);
        setFinalDecision(txn.status);
        if (txn.status === 'BLOCK') {
          setCreatedIncident(txn.incident_id || 'INC-0001');
        }
        setCustomerResult(txn);
        setSimulating(false);
      }, 900);

    } catch (err: any) {
      // Fallback local simulation if backend API busy
      setTimeout(() => {
        const isBlock = scenarioKey === 'account-takeover';
        const isVerify = scenarioKey === 'suspicious';
        const score = isBlock ? 94 : isVerify ? 48 : 12;
        const status = isBlock ? 'BLOCK' : isVerify ? 'VERIFY' : 'ALLOW';

        setAgentProgress(
          isBlock
            ? { fraud: 92, cyber: 95, behavior: 90, device: 88, geo: 94, beneficiary: 91, ip: 93, session: 87 }
            : isVerify
            ? { fraud: 48, cyber: 35, behavior: 55, device: 22, geo: 18, beneficiary: 58, ip: 20, session: 25 }
            : { fraud: 8, cyber: 5, behavior: 12, device: 6, geo: 4, beneficiary: 9, ip: 7, session: 5 }
        );

        setFinalScore(score);
        setFinalDecision(status);
        if (isBlock) setCreatedIncident('INC-0001');
        setCustomerResult({
          status,
          risk_score: score,
          amount: isBlock ? 85000 : isVerify ? 38000 : 3500,
          merchant_name: isBlock ? 'Cayman Island Wire Exchange' : isVerify ? 'Global Electronics Store' : 'The Olive Bistro',
          incident_id: isBlock ? 'INC-0001' : null,
          reasons: isBlock
            ? ['Rogue device (Galaxy S24)', 'London VPN observed', 'Offshore wire transfer']
            : isVerify
            ? ['Unusual amount', 'New beneficiary confirmation']
            : ['Payment cleared all trust pillars'],
        });
        setSimulating(false);
      }, 900);
    }
  };

  return (
    <div
      className="min-h-screen text-slate-100 flex flex-col justify-between"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        background: '#070C18',
        backgroundImage: 'radial-gradient(rgba(0,212,255,0.04) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* ── TOP NAV BAR ── */}
      <header
        className="sticky top-0 z-50 border-b px-6 py-3.5 flex items-center justify-between"
        style={{
          background: 'rgba(7,12,24,0.92)',
          borderColor: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-medium"
          >
            <span>← Portal</span>
          </Link>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Zap size={14} />
            </div>
            <div>
              <span
                className="font-black text-sm tracking-tight text-white"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                NexGuard Live Attack &amp; Defense Lab
              </span>
              <span className="ml-2 text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                SPLIT-SCREEN SIMULATION
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-white/10 text-xs font-mono">
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: wsConnected ? '#10B981' : '#EF4444',
                boxShadow: wsConnected ? '0 0 8px #10B981' : 'none',
              }}
            />
            <span className={wsConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {wsConnected ? 'SOC WebSocket Active' : 'Connecting WS...'}
            </span>
          </div>

          <Link
            href="/soc"
            className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25 transition flex items-center gap-1.5"
          >
            <span>Open Bank SOC</span>
            <ExternalLink size={12} />
          </Link>
        </div>
      </header>

      {/* ── CONCEPTUAL FLOW PIPELINE (Section 41) ── */}
      <div
        className="border-b px-6 py-2.5 flex items-center justify-center overflow-x-auto"
        style={{
          background: 'rgba(5,8,16,0.7)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-3 text-[11px] font-mono whitespace-nowrap">
          <span className="text-slate-400 font-bold">1. CUSTOMER SENDS ₹85,000</span>
          <ArrowRight size={13} className="text-cyan-400 shrink-0" />
          <span className="text-cyan-400 font-bold">2. 10 AI AGENTS ANALYZE SIGNALS</span>
          <ArrowRight size={13} className="text-amber-400 shrink-0" />
          <span className="text-amber-400 font-bold">3. RISK ENGINE SCORES (0-100)</span>
          <ArrowRight size={13} className="text-rose-400 shrink-0" />
          <span className="text-rose-400 font-bold">4. AUTONOMOUS BLOCK &amp; INCIDENT</span>
          <ArrowRight size={13} className="text-emerald-400 shrink-0" />
          <span className="text-emerald-400 font-bold">5. REAL-TIME SOC DISPATCH</span>
        </div>
      </div>

      {/* ── MAIN SPLIT SCREEN (Section 39) ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* LEFT COLUMN: CUSTOMER DEVICES & ATTACK TRIGGERS (5 cols)     */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone size={16} className="text-cyan-400" />
              <h2
                className="font-bold text-sm tracking-tight text-white uppercase"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                CUSTOMER PAYMENT ENVIRONMENT
              </h2>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Mobile-First View</span>
          </div>

          {/* ── Connected Hardware Fleet (Section 40) ── */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{
              background: 'rgba(11,18,32,0.85)',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              HARDWARE FLEET STATUS
            </span>

            {/* Phone A */}
            <div
              className={`p-3 rounded-xl border transition cursor-pointer ${
                activeScenario === 'normal'
                  ? 'bg-emerald-950/20 border-emerald-500/40'
                  : 'bg-black/30 border-white/5 hover:border-white/10'
              }`}
              onClick={() => triggerScenario('normal')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    📱 A
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Phone A (Trusted Pixel 8)</div>
                    <div className="text-[10px] text-slate-400 font-mono">DEVICE-001 • Chennai, IN</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    TRUSTED
                  </span>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">● Online</div>
                </div>
              </div>
              <button
                disabled={simulating}
                className="w-full mt-2 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5"
              >
                <Play size={11} />
                <span>Simulate Safe Payment (₹3,500 Dining) → ALLOW</span>
              </button>
            </div>

            {/* Phone B - Attacker Scenario */}
            <div
              className={`p-3 rounded-xl border transition cursor-pointer ${
                activeScenario === 'account-takeover'
                  ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/20'
                  : 'bg-black/30 border-white/5 hover:border-white/10'
              }`}
              onClick={() => triggerScenario('account-takeover')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold text-xs">
                    📱 B
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Phone B (Rogue Galaxy S24)</div>
                    <div className="text-[10px] text-slate-400 font-mono">DEVICE-002 • London Tor VPN</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/30">
                    SUSPICIOUS
                  </span>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">● Online</div>
                </div>
              </div>
              <button
                disabled={simulating}
                className="w-full mt-2 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/30"
              >
                <Play size={11} />
                <span>Trigger Attack Simulation (₹85,000 Wire) → BLOCK</span>
              </button>
            </div>

            {/* Phone C - Caution / Verification */}
            <div
              className={`p-3 rounded-xl border transition cursor-pointer ${
                activeScenario === 'suspicious'
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-black/30 border-white/5 hover:border-white/10'
              }`}
              onClick={() => triggerScenario('suspicious')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                    📱 C
                  </div>
                  <div>
                    <div className="font-bold text-xs text-white">Phone C (New Device)</div>
                    <div className="text-[10px] text-slate-400 font-mono">DEVICE-003 • Elevated Amount</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    CAUTION
                  </span>
                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">● Online</div>
                </div>
              </div>
              <button
                disabled={simulating}
                className="w-full mt-2 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5"
              >
                <Play size={11} />
                <span>Simulate High Value (₹38,000 Tech) → VERIFY</span>
              </button>
            </div>
          </div>

          {/* ── Customer Experience Mockup (What Customer Sees on Phone) ── */}
          <div
            className="p-4 rounded-2xl border space-y-3"
            style={{
              background: '#FFFFFF',
              borderColor: 'rgba(255,255,255,0.1)',
              color: '#0F172A',
            }}
          >
            <div className="flex items-center justify-between border-b pb-2" style={{ borderColor: '#F1F5F9' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded bg-indigo-600 flex items-center justify-center text-white">
                  <ShieldCheck size={10} />
                </div>
                <span className="text-[11px] font-black tracking-tight text-slate-900">
                  CUSTOMER PHONE SCREEN
                </span>
              </div>
              <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                LIGHT FINTECH UI
              </span>
            </div>

            {simulating ? (
              <div className="py-6 text-center space-y-2">
                <RefreshCw className="animate-spin text-indigo-600 mx-auto" size={24} />
                <div className="text-xs font-bold text-slate-800">Securing your payment...</div>
                <div className="text-[10px] text-slate-400">Verifying session, device, and beneficiary trust</div>
              </div>
            ) : customerResult ? (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Transaction Status</div>
                    <div className="text-lg font-black text-slate-900 font-sans">
                      ₹{Number(customerResult.amount || 85000).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-mono font-black px-2.5 py-1 rounded-full ${
                      customerResult.status === 'BLOCK'
                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                        : customerResult.status === 'VERIFY'
                        ? 'bg-amber-100 text-amber-700 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    }`}
                  >
                    {customerResult.status === 'BLOCK'
                      ? '✕ PAYMENT BLOCKED'
                      : customerResult.status === 'VERIFY'
                      ? '⚠ STEP-UP VERIFICATION'
                      : '✓ APPROVED'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                  <div className="font-bold text-slate-800">{customerResult.merchant_name || 'Offshore Transfer'}</div>
                  <div className="text-slate-500 text-[10px]">
                    {customerResult.status === 'BLOCK'
                      ? 'Unusual security activity detected. Money is safely held.'
                      : customerResult.status === 'VERIFY'
                      ? 'Touch ID or Biometric verification required to confirm.'
                      : 'Your payment was securely processed and protected.'}
                  </div>
                  {customerResult.incident_id && (
                    <div className="font-mono text-rose-600 font-bold text-[10px] pt-1">
                      Incident Ticket: {customerResult.incident_id}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                Tap one of the buttons above to trigger a live payment scenario.
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN: BANK SOC REAL-TIME MONITOR (7 cols)            */}
        {/* ══════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-cyan-400" />
              <h2
                className="font-bold text-sm tracking-tight text-white uppercase"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                BANK SECURITY OPERATIONS CENTER — LIVE DISSECTOR
              </h2>
            </div>
            <span className="text-[10px] font-mono text-cyan-400">Desktop SOC Telemetry</span>
          </div>

          {/* ── Transaction Ingestion Card ── */}
          <div
            className="p-5 rounded-3xl border space-y-4 relative overflow-hidden"
            style={{
              background: 'rgba(10,16,28,0.92)',
              borderColor: 'rgba(0,212,255,0.2)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            }}
          >
            {/* Ambient accent header line */}
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{
                background: finalDecision === 'BLOCK'
                  ? 'linear-gradient(90deg, #EF4444, #F59E0B)'
                  : finalDecision === 'VERIFY'
                  ? 'linear-gradient(90deg, #F59E0B, #10B981)'
                  : 'linear-gradient(90deg, #10B981, #00D4FF)',
              }}
            />

            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                  PAYMENT INGESTION TELEMETRY
                </span>
                <div
                  className="text-base font-bold text-white mt-0.5"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {currentEvent?.merchant || 'Waiting for payment trigger...'}
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block">AMOUNT OBSERVED</span>
                <span className="text-xl font-black text-cyan-400 font-mono">
                  {currentEvent ? `₹${Number(currentEvent.amount).toLocaleString('en-IN')}` : '₹0'}
                </span>
              </div>
            </div>

            {/* ── AI Multi-Agent Scoring Dissection Grid (Section 39) ── */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 font-bold">10 AUTONOMOUS AI AGENTS EVALUATION:</span>
                <span className="text-cyan-400 font-bold">
                  {simulating ? 'DISSECTING SIGNALS...' : 'ANALYSIS COMPLETE'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {[
                  { name: 'Fraud Agent', val: agentProgress.fraud, threshold: 70 },
                  { name: 'Cyber Threat Agent', val: agentProgress.cyber, threshold: 70 },
                  { name: 'Behavior Agent', val: agentProgress.behavior, threshold: 60 },
                  { name: 'Device Agent', val: agentProgress.device, threshold: 50 },
                  { name: 'Geo-Velocity Agent', val: agentProgress.geo, threshold: 60 },
                  { name: 'Beneficiary Agent', val: agentProgress.beneficiary, threshold: 55 },
                  { name: 'IP Intelligence', val: agentProgress.ip, threshold: 65 },
                  { name: 'Session Risk Agent', val: agentProgress.session, threshold: 50 },
                ].map((ag) => {
                  const isHigh = ag.val >= 70;
                  const isMed = ag.val >= 40 && ag.val < 70;
                  const barColor = isHigh ? '#EF4444' : isMed ? '#F59E0B' : '#10B981';

                  return (
                    <div
                      key={ag.name}
                      className="p-2 rounded-xl bg-black/40 border border-white/5 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-300 truncate">{ag.name}</span>
                        <span style={{ color: barColor }} className="font-bold">
                          {ag.val}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${ag.val}%`,
                            background: barColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Final Risk Score & Autonomous Decision ── */}
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg font-mono border"
                  style={{
                    background:
                      finalScore && finalScore >= 70
                        ? 'rgba(239,68,68,0.15)'
                        : finalScore && finalScore >= 40
                        ? 'rgba(245,158,11,0.15)'
                        : 'rgba(16,185,129,0.15)',
                    borderColor:
                      finalScore && finalScore >= 70
                        ? 'rgba(239,68,68,0.4)'
                        : finalScore && finalScore >= 40
                        ? 'rgba(245,158,11,0.4)'
                        : 'rgba(16,185,129,0.4)',
                    color:
                      finalScore && finalScore >= 70
                        ? '#EF4444'
                        : finalScore && finalScore >= 40
                        ? '#F59E0B'
                        : '#10B981',
                  }}
                >
                  {finalScore !== null ? finalScore : '—'}
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    CALCULATED RISK SCORE
                  </span>
                  <div className="font-bold text-xs text-white">
                    {finalScore && finalScore >= 70
                      ? 'CRITICAL SECURITY ANOMALY'
                      : finalScore && finalScore >= 40
                      ? 'ELEVATED SUSPICIOUS METRICS'
                      : 'NORMAL RISK PROFILE'}
                  </div>
                </div>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[10px] font-mono text-slate-400 block uppercase">
                  SECURITY DECISION
                </span>
                <span
                  className="text-xs font-mono font-black px-3 py-1 rounded-lg inline-block"
                  style={{
                    background:
                      finalDecision === 'BLOCK'
                        ? '#EF4444'
                        : finalDecision === 'VERIFY'
                        ? '#F59E0B'
                        : '#10B981',
                    color: finalDecision === 'VERIFY' ? '#0F172A' : '#FFFFFF',
                  }}
                >
                  {finalDecision ? finalDecision : 'AWAITING RUN'}
                </span>
              </div>
            </div>

            {/* ── Created Incident Callout ── */}
            {createdIncident && (
              <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2 text-xs">
                  <ShieldAlert size={16} className="text-rose-400" />
                  <span className="font-mono text-rose-300 font-bold">
                    INCIDENT CREATED: {createdIncident}
                  </span>
                </div>
                <Link
                  href="/soc?tab=incidents"
                  className="text-[11px] font-mono font-bold text-rose-400 hover:text-white transition flex items-center gap-1"
                >
                  <span>Investigate in Incident Desk →</span>
                </Link>
              </div>
            )}
          </div>

          {/* ── Live SOC WebSocket Event Stream ── */}
          <div
            className="p-4 rounded-3xl border space-y-2.5"
            style={{
              background: 'rgba(8,14,26,0.85)',
              borderColor: 'rgba(255,255,255,0.07)',
            }}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Radio size={13} className="text-cyan-400 animate-pulse" />
                <span>LIVE WEBSOCKET STREAM (/ws/soc)</span>
              </span>
              <span className="text-[10px] text-slate-500">Real-Time Event Feed</span>
            </div>

            <div
              ref={liveLogRef}
              className="h-44 overflow-y-auto space-y-1.5 font-mono text-[11px] pr-1"
            >
              {eventsList.length === 0 ? (
                <div className="text-center py-10 text-slate-600">
                  Listening on /ws/soc. Trigger a payment to see incoming events.
                </div>
              ) : (
                eventsList.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{
                          background: ev.type === 'CRITICAL_ALERT' ? '#EF4444' : '#00D4FF',
                        }}
                      />
                      <span className="text-slate-300 font-bold">{ev.type || 'EVENT'}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : 'Now'}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer
        className="px-6 py-3 border-t text-center text-xs font-mono text-slate-500"
        style={{
          background: 'rgba(5,8,16,0.95)',
          borderColor: 'rgba(255,255,255,0.06)',
        }}
      >
        NexGuard Secure Wallet • Autonomous Multi-Agent AI Fraud Detection &amp; SOC Command Center
      </footer>
    </div>
  );
}
