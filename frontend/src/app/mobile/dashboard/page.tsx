'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { api, getWsUrl, getMobileWsUrl } from '@/lib/api';
import {
  ShieldCheck,
  Send,
  QrCode,
  PlusCircle,
  Smartphone,
  ChevronRight,
  RefreshCw,
  Search,
  Eye,
  EyeOff,
  Wifi,
  WifiOff,
  ArrowUpRight,
  ArrowDownLeft,
  Lock,
  Check,
  CheckCircle2,
  X,
  CreditCard,
  AlertTriangle,
  Copy,
  Edit3,
  Building2,
  User,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

/* ── Security Score Ring ── */
function SecurityRing({ score }: { score: number }) {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#059669' : score >= 45 ? '#d97706' : '#dc2626';
  const label = score >= 75 ? 'SECURE' : score >= 45 ? 'CAUTION' : 'AT RISK';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={76} height={76} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={38} cy={38} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={5} />
        <circle
          cx={38} cy={38} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={5}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.06em', color, marginTop: 2 }}>{label}</span>
      </div>
    </div>
  );
}

const DEFAULT_PROFILE = {
  full_name: 'Karthik',
  balance: 1000000,
  security_score: 92,
  upi_id: 'karthik@nexguard',
  phone_number: '+91 98765 43210',
};

const DEFAULT_TRANSACTIONS = [
  { id: 1, transaction_id_str: 'TXN-9021', merchant: 'The Olive Bistro', amount: 3500, status: 'ALLOW', created_at: new Date().toISOString() },
  { id: 2, transaction_id_str: 'TXN-9018', merchant: 'Supermarket Quick Mart', amount: 1240, status: 'ALLOW', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, transaction_id_str: 'TXN-9012', merchant: 'Metro Transport Card', amount: 500, status: 'ALLOW', created_at: new Date(Date.now() - 7200000).toISOString() },
];

export default function NexGuardMobileDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(DEFAULT_PROFILE);
  const [transactions, setTransactions] = useState<any[]>(DEFAULT_TRANSACTIONS);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('DEVICE-001');
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connected');
  const [showAddMoney, setShowAddMoney] = useState<boolean>(false);
  const [showReceiveQr, setShowReceiveQr] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>('5000');
  const [depositLoading, setDepositLoading] = useState<boolean>(false);
  const [alertBanner, setAlertBanner] = useState<any>(null);
  const [showBalance, setShowBalance] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const [peers, setPeers] = useState<any[]>([]);
  const [showBankTransfer, setShowBankTransfer] = useState<boolean>(false);
  const [receiveAmount, setReceiveAmount] = useState<string>('');
  const [upiCopied, setUpiCopied] = useState<boolean>(false);
  const [bankAccNumber, setBankAccNumber] = useState<string>('NG 4092 8819');
  const [bankIfsc, setBankIfsc] = useState<string>('NGBK0001024');
  const [bankHolderName, setBankHolderName] = useState<string>('Priya Sharma');
  const [bankTransferAmount, setBankTransferAmount] = useState<string>('5000');
  const [bankTransferLoading, setBankTransferLoading] = useState<boolean>(false);
  const [bankTransferSuccess, setBankTransferSuccess] = useState<any>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);

  const [showPairPhoneModal, setShowPairPhoneModal] = useState<boolean>(false);
  const [networkInfo, setNetworkInfo] = useState<any>(null);
  const [selectedPairDevice, setSelectedPairDevice] = useState<string>('phone_a_trusted');
  const [pairCopied, setPairCopied] = useState<boolean>(false);
  const [customLanIp, setCustomLanIp] = useState<string>('');
  const [allLanIps, setAllLanIps] = useState<string[]>([]);
  const [isEditingLanIp, setIsEditingLanIp] = useState<boolean>(false);
  const [shareStatus, setShareStatus] = useState<'idle' | 'sharing' | 'done' | 'unsupported'>('idle');
  const wsRef = useRef<WebSocket | null>(null);

  const loadData = async () => {
    try {
      setApiError(null);
      const [pData, tData, peersData] = await Promise.all([
        api('/wallet/profile'),
        api('/transactions?limit=6'),
        api('/wallet/peers').catch(() => []),
      ]);
      setProfile(pData);
      setTransactions(tData.items || []);
      if (Array.isArray(peersData) && peersData.length > 0) {
        setPeers(peersData);
      }
      setApiError(null);
    } catch (err: any) {
      console.error('Failed to load wallet profile:', err);
      setApiError(err?.message || 'Unable to connect to laptop server');
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(bankTransferAmount.replace(/,/g, ''));
    if (isNaN(amt) || amt <= 0) return;
    setBankTransferLoading(true);
    try {
      const res = await api('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          amount: amt,
          currency: 'INR',
          merchant: bankHolderName.trim() || 'Bank Transfer',
          merchant_category: 'WIRE',
          purpose: `NEFT/RTGS to ${bankAccNumber} (${bankIfsc})`,
          device_id: activeDeviceId,
          session_id: 'SES-BANK',
          location: 'Chennai, IN [SYNTHETIC]',
          demo_ip: '192.168.1.104',
          ip_type: 'PRIVATE',
          transaction_type: 'WIRE',
          payment_method: 'NETBANKING',
          biometric_verified: true,
          biometric_confidence: 0.98,
        }),
      });
      setBankTransferSuccess(res);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Bank transfer failed');
    } finally {
      setBankTransferLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const dev = params.get('device');
      if (dev) setActiveDeviceId(dev);
      if (params.get('pair') === 'true') {
        setShowPairPhoneModal(true);
      }
    }
    loadData();

    // Fetch local network info for QR phone pairing
    const fetchNetwork = async () => {
      const browserHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
      const isLocalHost = (h: string) => !h || h === 'localhost' || h === '127.0.0.1' || h === '::1';

      try {
        // Call the Next.js server-side route — always knows the real LAN IP
        const res = await fetch('/api/lan-ip');
        const data = await res.json();
        const serverIp = data?.lan_ip || '';
        const allIps: string[] = data?.all || [];
        setAllLanIps(allIps);

        if (serverIp && !isLocalHost(serverIp)) {
          setCustomLanIp(serverIp);
        } else if (!isLocalHost(browserHost)) {
          setCustomLanIp(browserHost);
        } else {
          setCustomLanIp('');
        }
      } catch {
        if (!isLocalHost(browserHost)) {
          setCustomLanIp(browserHost);
        } else {
          setCustomLanIp('');
        }
      }
    };
    fetchNetwork();


    let reconnectTimer: any = null;

    const setupWs = () => {
      try {
        const devId = (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('device') : null) || activeDeviceId || 'DEVICE-001';
        const url = getMobileWsUrl(devId);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus('connected');
        };
        ws.onclose = () => {
          setConnectionStatus('disconnected');
          reconnectTimer = setTimeout(setupWs, 3500);
        };
        ws.onerror = () => { setConnectionStatus('disconnected'); };
        ws.onmessage = (e) => {
          try {
            const payload = JSON.parse(e.data);
            if (payload.type === 'CRITICAL_ALERT') {
              setAlertBanner({
                type: 'BLOCK',
                title: 'Transaction Blocked',
                message: payload.data?.reasons?.[0] || 'Unusual security activity detected.',
                incident_id: payload.data?.incident_id,
              });
              loadData();
            } else if (payload.type === 'STEP_UP_CHALLENGE') {
              setAlertBanner({
                type: 'VERIFY',
                title: 'Verification Required',
                message: 'Biometric verification needed to authorize this transfer.',
              });
            } else if (payload.type === 'TRANSACTION_ALLOWED' || payload.type === 'NEW_TRANSACTION') {
              loadData();
            }
          } catch (err) { console.error(err); }
        };
      } catch (err) { setConnectionStatus('disconnected'); }
    };

    setupWs();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    setDepositLoading(true);
    try {
      await api('/wallet/add-money', {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(depositAmount), source: 'NetBanking HDFC' }),
      });
      setShowAddMoney(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setDepositLoading(false);
    }
  };

  /* ── Loading State ── */
  if (loading && !profile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #e2e8f0', borderTopColor: '#2563eb', animation: 'spin 1s linear infinite' }} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 4 }}>Connecting to NexGuard...</p>
          <p style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
            {typeof window !== 'undefined' ? window.location.hostname : 'localhost'}:8000
          </p>
        </div>
        {apiError && (
          <div style={{ padding: 16, borderRadius: 12, border: '1px solid #fecaca', background: '#fff1f2', textAlign: 'left', width: '100%', marginTop: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#991b1b', fontSize: 12, marginBottom: 8 }}>
              <AlertTriangle size={14} />
              <span>Connection Failed</span>
            </div>
            <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, marginBottom: 12 }}>
              Phone reached frontend, but port 8000 is not responding. Ensure phone and laptop are on the same Wi-Fi.
            </p>
            <button
              onClick={() => { setLoading(true); loadData(); }}
              style={{ width: '100%', padding: '8px', background: '#dc2626', color: '#fff', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const score = profile?.security_score ?? 92;
  const balance = profile?.balance ?? 1000000;
  const userName = profile?.full_name || 'Karthik';
  const greetingName = userName.split(' ')[0];

  const isLocalOnlyIp = (h: string) => !h || h === 'localhost' || h === '127.0.0.1' || h === '::1';
  const effectiveIp = customLanIp || (typeof window !== 'undefined' && !isLocalOnlyIp(window.location.hostname) ? window.location.hostname : '');
  const ipIsLocal = isLocalOnlyIp(effectiveIp);

  const pairProfiles: Record<string, { name: string; device_id: string; sub: string; trust: string; color: string }> = {
    phone_a_trusted: { name: 'Phone A (Trusted Pixel 8)', device_id: 'DEVICE-001', sub: 'Pixel 8 • Trusted Device', trust: 'TRUSTED', color: '#059669' },
    phone_b_rogue: { name: 'Phone B (Rogue Galaxy S24)', device_id: 'DEVICE-002', sub: 'Galaxy S24 • Tor/Attacker', trust: 'ROGUE', color: '#dc2626' },
    phone_c_new: { name: 'Phone C (New Device)', device_id: 'DEVICE-003', sub: 'iPhone 15 • Onboarding', trust: 'NEW', color: '#d97706' },
  };
  const activePairProfile = pairProfiles[selectedPairDevice] || pairProfiles['phone_a_trusted'];
  const pairingUrl = effectiveIp && !ipIsLocal
    ? `http://${effectiveIp}:3000/mobile/dashboard?device=${activePairProfile.device_id}`
    : `http://<YOUR-PC-IP>:3000/mobile/dashboard?device=${activePairProfile.device_id}`;

  const handleCopyPairUrl = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(pairingUrl);
      setPairCopied(true);
      setTimeout(() => setPairCopied(false), 2000);
    }
  };

  const handleShareNearby = async () => {
    setShareStatus('sharing');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'NexGuard Wallet – Open on your phone',
          text: `Open the NexGuard AI Wallet on your phone: ${pairingUrl}`,
          url: pairingUrl,
        });
        setShareStatus('done');
        setTimeout(() => setShareStatus('idle'), 3000);
      } catch (e: any) {
        // User cancelled share or error
        setShareStatus('idle');
      }
    } else {
      // Fallback: copy to clipboard
      if (navigator.clipboard) navigator.clipboard.writeText(pairingUrl);
      setShareStatus('unsupported');
      setTimeout(() => setShareStatus('idle'), 3000);
    }
  };

  const quickContacts = [
    { name: 'Rahul Kumar',  upi: 'rahul@nexguard', initial: 'R', color: '#4f46e5', amount: '85000' },
    { name: 'Aarav Sharma', upi: 'aarav@oksbi',    initial: 'A', color: '#059669', amount: '3500'  },
    { name: 'Priya Sharma', upi: 'priya@okhdfc',   initial: 'P', color: '#2563eb', amount: '1200'  },
    { name: 'Electronics',  upi: 'store@icici',    initial: 'E', color: '#d97706', amount: '38000' },
    { name: 'Vikram Rao',   upi: 'vikram@axis',    initial: 'V', color: '#7c3aed', amount: '500'   },
  ];

  return (
    <div style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box', padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── Header: Greeting + Status + Pair Button ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', letterSpacing: '0.04em' }}>
            Good morning,
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
            {greetingName}
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Pair Phone Button */}
          <button
            onClick={() => setShowPairPhoneModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 9px',
              borderRadius: 20,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: 10,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Scan QR to open this wallet on your physical phone"
          >
            <QrCode size={12} color="#2563eb" />
            <span>Pair</span>
          </button>

          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '4px 9px', borderRadius: 20,
            background: connectionStatus === 'connected' ? '#f0fdf4' : '#fffbeb',
            border: `1px solid ${connectionStatus === 'connected' ? '#bbf7d0' : '#fde68a'}`,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: connectionStatus === 'connected' ? '#059669' : '#d97706',
              display: 'inline-block',
            }} />
            <span style={{ fontSize: 10, fontWeight: 600, color: connectionStatus === 'connected' ? '#065f46' : '#92400e' }}>
              {connectionStatus === 'connected' ? 'Secure' : 'Connecting'}
            </span>
          </div>
          {/* Avatar button: opens Receive QR Code Modal */}
          <button
            onClick={() => setShowReceiveQr(true)}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #dbeafe',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
              cursor: 'pointer',
              transition: 'transform 0.15s ease',
            }}
            title="Click to show your UPI QR Code to receive payment"
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            {greetingName.charAt(0)}
          </button>
        </div>
      </div>

      {/* ── Search Bar with Live UPI ID & Database Peer Pay ── */}
      <div ref={searchContainerRef} style={{ position: 'relative', width: '100%', zIndex: 25 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRadius: 12,
          background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <Search size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                const q = searchQuery.trim();
                router.push(`/send?recipient=${encodeURIComponent(q)}&upi=${encodeURIComponent(q.includes('@') ? q : `${q.toLowerCase()}@nexguard`)}&device=${activeDeviceId}`);
              }
            }}
            placeholder="Pay by name, UPI ID or phone"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#0f172a' }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setShowSearchDropdown(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 2 }}
            >
              <X size={14} />
            </button>
          )}
          <Link
            href="/scan"
            style={{
              padding: '4px',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              transition: 'background 0.15s ease',
            }}
            title="Scan QR to Pay"
          >
            <QrCode size={18} color="#2563eb" />
          </Link>
        </div>

        {/* Live Search & Peer Results Dropdown */}
        {showSearchDropdown && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            background: '#ffffff',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.10)',
            maxHeight: 280,
            overflowY: 'auto',
            padding: '6px',
            zIndex: 50,
            animation: 'fadeInUp 0.15s ease',
          }}>
            {/* Quick direct pay if user typed something */}
            {searchQuery.trim().length > 0 && (
              <button
                onClick={() => {
                  const q = searchQuery.trim();
                  setShowSearchDropdown(false);
                  router.push(`/send?recipient=${encodeURIComponent(q)}&upi=${encodeURIComponent(q.includes('@') ? q : `${q.toLowerCase()}@nexguard`)}&device=${activeDeviceId}`);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#eff6ff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginBottom: 4,
                }}
              >
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Send size={13} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8' }}>Pay directly to &ldquo;{searchQuery}&rdquo;</div>
                  <div style={{ fontSize: 10, color: '#60a5fa', fontFamily: 'monospace' }}>UPI ID: {searchQuery.includes('@') ? searchQuery : `${searchQuery.toLowerCase()}@nexguard`}</div>
                </div>
                <ArrowRight size={14} color="#2563eb" />
              </button>
            )}

            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '6px 10px 4px' }}>
              Database Registered Users
            </div>

            {peers
              .filter((p) => !p.is_current && (
                !searchQuery.trim() ||
                p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.upi_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.phone_number && p.phone_number.includes(searchQuery))
              ))
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setShowSearchDropdown(false);
                    router.push(`/send?recipient=${encodeURIComponent(p.full_name)}&upi=${encodeURIComponent(p.upi_id)}&device=${activeDeviceId}`);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: p.role === 'MERCHANT' ? '#f59e0b' : '#3b82f6',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {p.full_name.charAt(0)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.full_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                      {p.upi_id}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#059669' }}>
                      ₹{Number(p.balance).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 9, color: '#94a3b8' }}>
                      DB Wallet
                    </div>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      {/* ── Critical Alert Banner ── */}
      {alertBanner && (
        <div style={{
          padding: '12px 14px',
          borderRadius: 12,
          border: `1px solid ${alertBanner.type === 'BLOCK' ? '#fecaca' : '#fde68a'}`,
          background: alertBanner.type === 'BLOCK' ? '#fff1f2' : '#fffbeb',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          animation: 'fadeInUp 0.25s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12, color: alertBanner.type === 'BLOCK' ? '#991b1b' : '#92400e' }}>
              <AlertTriangle size={14} />
              {alertBanner.title}
            </div>
            <button onClick={() => setAlertBanner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <X size={14} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{alertBanner.message}</p>
          {alertBanner.incident_id && (
            <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#b91c1c', fontWeight: 600 }}>
              Ref: {alertBanner.incident_id}
            </span>
          )}
        </div>
      )}

      {/* ── Balance Card ── */}
      <div style={{
        padding: '20px',
        borderRadius: 20,
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 55%, #2563eb 100%)',
        boxShadow: '0 8px 24px -4px rgba(30,64,175,0.30)',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
      }}>
        {/* Subtle dot pattern */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.08,
          backgroundImage: 'radial-gradient(#fff 1px, transparent 0)',
          backgroundSize: '18px 18px',
        }} />

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', marginBottom: 6 }}>
              Available Balance
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
                {showBalance ? `₹${Number(balance).toLocaleString('en-IN')}` : '••••••'}
              </span>
              <button onClick={() => setShowBalance(!showBalance)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)' }}>
                {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'rgba(255,255,255,0.12)', borderRadius: 20, backdropFilter: 'blur(8px)' }}>
            <ShieldCheck size={12} color="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: 10, fontWeight: 600, color: '#fff' }}>Protected</span>
          </div>
        </div>

        {/* Security Score */}
        <div style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 0 0',
          borderTop: '1px solid rgba(255,255,255,0.12)',
        }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Security Score</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{
                  width: 4,
                  height: score >= 75 ? 12 + i * 2 : 8 + i * 2,
                  borderRadius: 2,
                  background: i < Math.round(score / 20) ? '#34d399' : 'rgba(255,255,255,0.2)',
                  transition: 'height 0.6s ease',
                }} />
              ))}
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{score}/100</span>
          </div>
        </div>
      </div>

      {/* ── 4 Quick Actions (Image 2 Requirement) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'Send Money', icon: Send, href: `/send?device=${activeDeviceId}` },
          { label: 'Receive', icon: ArrowDownLeft, action: () => setShowReceiveQr(true) },
          { label: 'Scan to Pay', icon: QrCode, href: '/scan' },
          { label: 'Bank Transfer', icon: Building2, action: () => setShowBankTransfer(true) },
        ].map((item, i) => {
          const Icon = item.icon;
          const inner = (
            <>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                background: '#fff',
                border: '1px solid #e2e8f0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <Icon size={20} color="#2563eb" />
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#475569', textAlign: 'center' }}>{item.label}</span>
            </>
          );
          return item.href ? (
            <Link
              key={i}
              href={item.href}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 2px', borderRadius: 12, textDecoration: 'none', transition: 'transform 0.15s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)'; }}
            >
              {inner}
            </Link>
          ) : (
            <button
              key={i}
              onClick={item.action}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '8px 2px', borderRadius: 12, background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.15s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
            >
              {inner}
            </button>
          );
        })}
      </div>

      {/* ── Security Score Card ── */}
      <div style={{ padding: '16px', borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={13} color="#059669" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>Security Status</span>
          </div>
          <Link href="/mobile/security" style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            View <ChevronRight size={12} />
          </Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <SecurityRing score={score} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[
              { label: 'Trusted Device', ok: true },
              { label: 'Secure Session', ok: true },
              { label: 'Normal Behavior', ok: true },
              { label: 'Safe Network', ok: true },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#059669' }}>
                <CheckCircle2 size={13} color="#059669" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>10-Agent AI Defense Active</span>
          <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 600, color: '#64748b' }}>{activeDeviceId}</span>
        </div>
      </div>

      {/* ── Quick Contacts ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>Quick Pay</span>
          <Link href={`/mobile/send-money?device=${activeDeviceId}`} style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', textDecoration: 'none' }}>
            View All
          </Link>
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {quickContacts.map((c) => (
            <Link
              key={c.upi}
              href={`/mobile/send-money?device=${activeDeviceId}&recipient=${encodeURIComponent(c.name)}&upi=${encodeURIComponent(c.upi)}&amount=${c.amount}`}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, flexShrink: 0, textDecoration: 'none', padding: '6px 2px', borderRadius: 10 }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 14, background: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                {c.initial}
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#475569', maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.name.split(' ')[0]}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Recent Activity</span>
          <Link href="/mobile/transactions" style={{ fontSize: 11, fontWeight: 600, color: '#2563eb', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: '#94a3b8', fontSize: 12 }}>
            No transactions yet. Use the demo lab to generate data.
          </div>
        ) : (
          <div>
            {transactions.slice(0, 5).map((tx) => {
              const isBlocked = tx.status === 'BLOCK' || tx.status === 'BLOCKED';
              const isVerify = tx.status === 'VERIFY' || tx.status === 'PENDING_VERIFICATION';
              return (
                <div
                  key={tx.id || tx.transaction_id_str}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 16px',
                    borderBottom: '1px solid #f8fafc',
                    cursor: 'pointer',
                    transition: 'background 0.12s ease',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                      background: isBlocked ? '#fff1f2' : isVerify ? '#fffbeb' : '#eff6ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, color: isBlocked ? '#dc2626' : isVerify ? '#d97706' : '#2563eb',
                    }}>
                      {isBlocked ? '✕' : isVerify ? '!' : '₹'}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', marginBottom: 2 }}>
                        {tx.merchant || tx.merchant_name || 'Transfer'}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8', fontFamily: 'monospace' }}>
                        {new Date(tx.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {tx.transaction_id_str || 'TXN'}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: isBlocked ? '#dc2626' : '#0f172a', textDecoration: isBlocked ? 'line-through' : 'none', marginBottom: 3 }}>
                      ₹{Number(tx.amount).toLocaleString('en-IN')}
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
                      background: isBlocked ? '#fff1f2' : isVerify ? '#fffbeb' : '#f0fdf4',
                      color: isBlocked ? '#b91c1c' : isVerify ? '#92400e' : '#065f46',
                      border: `1px solid ${isBlocked ? '#fecaca' : isVerify ? '#fde68a' : '#bbf7d0'}`,
                    }}>
                      {isBlocked ? 'BLOCKED' : isVerify ? 'VERIFY' : 'SETTLED'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ textAlign: 'center', paddingBottom: 4 }}>
        <span style={{ fontSize: 10, color: '#cbd5e1', fontFamily: 'monospace' }}>
          NexGuard Protected · AI Multi-Agent Defense
        </span>
      </div>

      {/* ── ADD MONEY MODAL ── */}
      {showAddMoney && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0' }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#fff', borderRadius: '20px 20px 0 0', padding: '20px 20px 32px', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Add Money</h3>
              <button onClick={() => setShowAddMoney(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAddMoney} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Amount (INR)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>₹</span>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    style={{ width: '100%', paddingLeft: 30, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 18, fontWeight: 700, color: '#0f172a', outline: 'none', background: '#f8fafc', boxSizing: 'border-box' }}
                    placeholder="5000"
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['1000', '5000', '10000'].map((amt) => (
                  <button
                    type="button"
                    key={amt}
                    onClick={() => setDepositAmount(amt)}
                    style={{ flex: 1, padding: '8px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 12, fontWeight: 600, color: '#475569', background: '#fff', cursor: 'pointer' }}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={depositLoading}
                style={{ padding: '12px', borderRadius: 12, background: '#2563eb', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: depositLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {depositLoading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Deposit Funds'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── RECEIVE QR MODAL ── */}
      {showReceiveQr && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 28px', textAlign: 'center', animation: 'fadeInUp 0.3s ease', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <QrCode size={18} color="#2563eb" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Receive Money via UPI</span>
              </div>
              <button onClick={() => setShowReceiveQr(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>

            {/* Profile Overview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 16, textAlign: 'left' }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: '#fff',
                fontWeight: 800,
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
              }}>
                {userName.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{userName}</div>
                <div style={{ fontSize: 12, color: '#2563eb', fontFamily: 'monospace', fontWeight: 600 }}>{profile?.upi_id || 'karthik@nexguard'}</div>
              </div>
              <Link
                href="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 10px',
                  borderRadius: 8,
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#1d4ed8',
                  fontSize: 11,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
                title="View Full Profile"
              >
                <User size={13} />
                <span>Profile</span>
              </Link>
            </div>

            {/* Crisp Dynamic QR Code */}
            <div style={{ width: 190, height: 190, margin: '0 auto 14px', padding: 12, background: '#fff', borderRadius: 20, border: '2px solid #eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(37,99,235,0.08)' }}>
              <QRCodeSVG
                value={`upi://pay?pa=${encodeURIComponent(profile?.upi_id || 'karthik@nexguard')}&pn=${encodeURIComponent(userName)}&cu=INR${receiveAmount ? `&am=${encodeURIComponent(receiveAmount)}` : ''}`}
                size={164}
                level="H"
                includeMargin={true}
              />
            </div>

            {/* Copy UPI ID Button */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{ padding: '6px 12px', borderRadius: 20, background: '#eff6ff', border: '1px solid #dbeafe', fontSize: 12, fontFamily: 'monospace', fontWeight: 700, color: '#1d4ed8' }}>
                {profile?.upi_id || 'karthik@nexguard'}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(profile?.upi_id || 'karthik@nexguard');
                  setUpiCopied(true);
                  setTimeout(() => setUpiCopied(false), 2000);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '6px 12px',
                  borderRadius: 20,
                  background: upiCopied ? '#f0fdf4' : '#fff',
                  border: `1px solid ${upiCopied ? '#86efac' : '#e2e8f0'}`,
                  color: upiCopied ? '#16a34a' : '#475569',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {upiCopied ? <Check size={13} /> : <Copy size={13} />}
                <span>{upiCopied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {/* Optional Amount Request Input */}
            <div style={{ marginBottom: 16, textAlign: 'left', padding: '10px 12px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
                Request Specific Amount (Optional)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>₹</span>
                <input
                  type="number"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  placeholder="Enter amount to embed in QR"
                  style={{ width: '100%', paddingLeft: 24, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 600, color: '#0f172a', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Link
                href="/profile"
                style={{
                  padding: '11px',
                  borderRadius: 12,
                  background: '#2563eb',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <User size={15} />
                <span>View Profile</span>
              </Link>
              <button
                onClick={() => setShowReceiveQr(false)}
                style={{ padding: '11px', borderRadius: 12, background: '#f1f5f9', color: '#475569', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── BANK TRANSFER MODAL ── */}
      {showBankTransfer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: '24px 24px 0 0', padding: '20px 20px 32px', animation: 'fadeInUp 0.3s ease', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={18} color="#2563eb" />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>Bank Account Transfer</h3>
                  <div style={{ fontSize: 11, color: '#64748b' }}>Transfer from NG Bank to any Indian bank account</div>
                </div>
              </div>
              <button onClick={() => { setShowBankTransfer(false); setBankTransferSuccess(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18} /></button>
            </div>

            {bankTransferSuccess ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                  <CheckCircle2 size={32} color="#059669" />
                </div>
                <h4 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>Transfer Successful!</h4>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 16px' }}>
                  ₹{Number(bankTransferAmount).toLocaleString('en-IN')} sent to {bankHolderName} ({bankAccNumber}).
                </p>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 20, textAlign: 'left', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>Status</span>
                    <span style={{ fontWeight: 700, color: '#059669' }}>SETTLED (ALLOW)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: '#64748b' }}>IFSC</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{bankIfsc}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Txn Reference</span>
                    <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{bankTransferSuccess.transaction_id_str || 'TXN-BANK-001'}</span>
                  </div>
                </div>
                <button
                  onClick={() => { setShowBankTransfer(false); setBankTransferSuccess(null); }}
                  style={{ width: '100%', padding: '12px', borderRadius: 12, background: '#2563eb', color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleBankTransfer} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Source Bank Banner */}
                <div style={{ padding: '12px 14px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Source Account</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>NG Bank (Simulated)</div>
                    <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>A/C: NG 4092 8819</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Balance</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#2563eb' }}>₹{Number(balance).toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>BENEFICIARY ACCOUNT NUMBER</label>
                  <input
                    type="text"
                    value={bankAccNumber}
                    onChange={(e) => setBankAccNumber(e.target.value)}
                    placeholder="e.g. 5010049281729"
                    required
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>IFSC CODE</label>
                    <input
                      type="text"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                      placeholder="NGBK0001024"
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, color: '#0f172a', outline: 'none', background: '#fff', boxSizing: 'border-box', fontFamily: 'monospace' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>ACCOUNT HOLDER NAME</label>
                    <input
                      type="text"
                      value={bankHolderName}
                      onChange={(e) => setBankHolderName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      required
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13, color: '#0f172a', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>AMOUNT (INR)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>₹</span>
                    <input
                      type="number"
                      value={bankTransferAmount}
                      onChange={(e) => setBankTransferAmount(e.target.value)}
                      placeholder="5000"
                      required
                      style={{ width: '100%', paddingLeft: 32, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 17, fontWeight: 700, color: '#0f172a', outline: 'none', background: '#fff', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {['5000', '25000', '50000'].map((amt) => (
                      <button
                        type="button"
                        key={amt}
                        onClick={() => setBankTransferAmount(amt)}
                        style={{ flex: 1, padding: '6px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11, fontWeight: 600, color: '#475569', background: '#f8fafc', cursor: 'pointer' }}
                      >
                        +₹{Number(amt).toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={bankTransferLoading}
                  style={{ marginTop: 6, padding: '13px', borderRadius: 14, background: '#2563eb', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: bankTransferLoading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {bankTransferLoading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Send Bank Transfer'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── PAIR PHONE QR MODAL ── */}
      {showPairPhoneModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 60,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            width: '100%',
            maxWidth: 440,
            background: '#ffffff',
            borderRadius: 24,
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
            border: '1px solid #e2e8f0',
            maxHeight: '92vh',
            overflowY: 'auto',
            animation: 'fadeInUp 0.25s ease',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '18px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                }}>
                  <Smartphone size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
                    Pair Smartphone
                  </h3>
                  <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0' }}>
                    Open live customer wallet on physical phone
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPairPhoneModal(false)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 6,
                  cursor: 'pointer',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* ⚠ Warning when IP is localhost */}
              {ipIsLocal && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  fontSize: 11,
                }}>
                  <WifiOff size={15} color="#ea580c" style={{ flexShrink: 0, marginTop: 1 }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#9a3412', marginBottom: 2 }}>
                      Can't detect your PC's Wi-Fi IP
                    </div>
                    <div style={{ color: '#c2410c', lineHeight: 1.5 }}>
                      Click <strong>Change</strong> below and type your PC's LAN IP (e.g. <code style={{ background: '#ffedd5', padding: '1px 4px', borderRadius: 3 }}>10.197.251.66</code>).
                      Find it with <code style={{ background: '#ffedd5', padding: '1px 4px', borderRadius: 3 }}>ipconfig</code> in Command Prompt.
                    </div>
                  </div>
                </div>
              )}

              {/* Wi-Fi Host IP Bar */}
              <div style={{
                padding: '8px 12px',
                borderRadius: 10,
                background: ipIsLocal ? '#fff7ed' : '#f8fafc',
                border: `1px solid ${ipIsLocal ? '#fed7aa' : '#e2e8f0'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 11,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Wifi size={13} color={ipIsLocal ? '#ea580c' : '#059669'} />
                  <span style={{ fontWeight: 600, color: '#475569' }}>Wi-Fi Host:</span>
                  {isEditingLanIp ? (
                    <input
                      type="text"
                      value={customLanIp}
                      onChange={(e) => setCustomLanIp(e.target.value)}
                      onBlur={() => setIsEditingLanIp(false)}
                      onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingLanIp(false); }}
                      autoFocus
                      placeholder="e.g. 10.197.251.66"
                      style={{
                        padding: '2px 6px',
                        fontSize: 11,
                        fontFamily: 'monospace',
                        borderRadius: 4,
                        border: '1px solid #2563eb',
                        outline: 'none',
                        width: 130,
                      }}
                    />
                  ) : (
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: ipIsLocal ? '#ea580c' : '#0f172a',
                    }}>
                      {effectiveIp || <span style={{ color: '#ea580c', fontStyle: 'italic' }}>not detected — click Change</span>}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsEditingLanIp(!isEditingLanIp)}
                  style={{
                    background: ipIsLocal ? '#fff7ed' : 'none',
                    border: ipIsLocal ? '1px solid #fed7aa' : 'none',
                    borderRadius: 6,
                    padding: ipIsLocal ? '3px 8px' : '0',
                    color: ipIsLocal ? '#ea580c' : '#2563eb',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    animation: ipIsLocal && !isEditingLanIp ? 'pulse-orange 1.5s infinite' : 'none',
                  }}
                >
                  <Edit3 size={11} />
                  <span>{isEditingLanIp ? 'Done ✓' : 'Change'}</span>
                </button>
              </div>

              {/* Device Selector */}
              <div>
                <label style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: '#64748b',
                  display: 'block',
                  marginBottom: 8,
                }}>
                  Select Phone Profile:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {Object.entries(pairProfiles).map(([key, prof]) => {
                    const isSelected = selectedPairDevice === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedPairDevice(key)}
                        style={{
                          padding: '8px 6px',
                          borderRadius: 10,
                          border: isSelected ? `2px solid ${prof.color}` : '1px solid #e2e8f0',
                          background: isSelected ? `${prof.color}0a` : '#ffffff',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 2,
                          transition: 'all 0.12s ease',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? '#0f172a' : '#475569' }}>
                            {key === 'phone_a_trusted' ? 'Phone A' : key === 'phone_b_rogue' ? 'Phone B' : 'Phone C'}
                          </span>
                          <span style={{
                            fontSize: 8,
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: 4,
                            background: `${prof.color}18`,
                            color: prof.color,
                          }}>
                            {prof.trust}
                          </span>
                        </div>
                        <span style={{ fontSize: 9, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prof.device_id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* QR Code Card */}
              <div style={{
                padding: '16px',
                borderRadius: 16,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  padding: 12,
                  background: '#ffffff',
                  borderRadius: 14,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <QRCodeSVG
                    value={pairingUrl}
                    size={180}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>
                    {activePairProfile.name}
                  </div>
                  <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace', marginTop: 2 }}>
                    Target Device ID: <strong style={{ color: activePairProfile.color }}>{activePairProfile.device_id}</strong>
                  </div>
                </div>

                {/* URL + Copy */}
                <div style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px',
                  background: '#ffffff',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}>
                  <input
                    type="text"
                    readOnly
                    value={pairingUrl}
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      fontSize: 10,
                      fontFamily: 'monospace',
                      border: 'none',
                      outline: 'none',
                      color: '#475569',
                      background: 'transparent',
                    }}
                  />
                  <button
                    onClick={handleCopyPairUrl}
                    style={{
                      padding: '5px 9px',
                      borderRadius: 6,
                      background: pairCopied ? '#f0fdf4' : '#eff6ff',
                      border: `1px solid ${pairCopied ? '#86efac' : '#bfdbfe'}`,
                      color: pairCopied ? '#16a34a' : '#2563eb',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      flexShrink: 0,
                    }}
                  >
                    {pairCopied ? <Check size={12} /> : <Copy size={12} />}
                    <span>{pairCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* ── Nearby Device Share ── */}
              <div style={{
                borderRadius: 14,
                background: 'linear-gradient(135deg, #f0f9ff 0%, #eff6ff 100%)',
                border: '1px solid #bfdbfe',
                overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 8,
                    background: '#2563eb', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Wifi size={13} color="#fff" />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1e3a8a' }}>Share to Nearby Device</div>
                    <div style={{ fontSize: 10, color: '#3b82f6' }}>AirDrop · Nearby Share · Bluetooth · WhatsApp</div>
                  </div>
                </div>

                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {/* Big Share Button */}
                  <button
                    onClick={handleShareNearby}
                    disabled={ipIsLocal || !effectiveIp}
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 10,
                      border: 'none',
                      background: shareStatus === 'done'
                        ? 'linear-gradient(135deg,#059669,#10b981)'
                        : shareStatus === 'unsupported'
                        ? 'linear-gradient(135deg,#d97706,#f59e0b)'
                        : ipIsLocal || !effectiveIp
                        ? '#e2e8f0'
                        : 'linear-gradient(135deg,#1d4ed8,#2563eb)',
                      color: ipIsLocal || !effectiveIp ? '#94a3b8' : '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: ipIsLocal || !effectiveIp ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      transition: 'all 0.2s ease',
                      boxShadow: ipIsLocal || !effectiveIp ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
                    }}
                  >
                    {shareStatus === 'sharing' && (
                      <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
                    )}
                    {shareStatus === 'done' && <Check size={15} />}
                    {shareStatus === 'unsupported' && <Copy size={15} />}
                    {shareStatus === 'idle' && <Smartphone size={15} />}
                    <span>
                      {shareStatus === 'sharing' ? 'Opening share sheet…'
                        : shareStatus === 'done' ? 'Link shared! Open on your device'
                        : shareStatus === 'unsupported' ? 'Link copied to clipboard'
                        : ipIsLocal || !effectiveIp ? 'Set Wi-Fi IP above first'
                        : '📲 Send to Nearby Device'}
                    </span>
                  </button>

                  {/* Quick-send links */}
                  {!ipIsLocal && effectiveIp && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      {/* WhatsApp */}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Open NexGuard Wallet on your phone: ${pairingUrl}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          flex: 1, padding: '8px 6px', borderRadius: 9,
                          background: '#dcfce7', border: '1px solid #86efac',
                          color: '#166534', fontSize: 10, fontWeight: 700,
                          textDecoration: 'none', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 14 }}>💬</span> WhatsApp
                      </a>
                      {/* SMS */}
                      <a
                        href={`sms:?body=${encodeURIComponent(`Open NexGuard Wallet: ${pairingUrl}`)}`}
                        style={{
                          flex: 1, padding: '8px 6px', borderRadius: 9,
                          background: '#f0fdf4', border: '1px solid #bbf7d0',
                          color: '#065f46', fontSize: 10, fontWeight: 700,
                          textDecoration: 'none', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 14 }}>✉️</span> SMS
                      </a>
                      {/* Email */}
                      <a
                        href={`mailto:?subject=${encodeURIComponent('Open NexGuard Wallet')}&body=${encodeURIComponent(`Open on your phone: ${pairingUrl}`)}`}
                        style={{
                          flex: 1, padding: '8px 6px', borderRadius: 9,
                          background: '#eff6ff', border: '1px solid #bfdbfe',
                          color: '#1e40af', fontSize: 10, fontWeight: 700,
                          textDecoration: 'none', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', gap: 4,
                        }}
                      >
                        <span style={{ fontSize: 14 }}>📧</span> Email
                      </a>
                    </div>
                  )}

                  {/* All available IPs as chips */}
                  {allLanIps.length > 1 && (
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: '#64748b', textTransform: 'uppercase', marginBottom: 5 }}>
                        Available Network Adapters
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {allLanIps.map((ip) => (
                          <button
                            key={ip}
                            onClick={() => setCustomLanIp(ip)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 20,
                              border: `1px solid ${customLanIp === ip ? '#2563eb' : '#e2e8f0'}`,
                              background: customLanIp === ip ? '#eff6ff' : '#fff',
                              color: customLanIp === ip ? '#2563eb' : '#475569',
                              fontSize: 10,
                              fontFamily: 'monospace',
                              fontWeight: customLanIp === ip ? 700 : 500,
                              cursor: 'pointer',
                              transition: 'all 0.12s ease',
                            }}
                          >
                            {customLanIp === ip && '✓ '}{ip}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div style={{
                padding: '12px',
                borderRadius: 12,
                background: '#eff6ff',
                border: '1px solid #dbeafe',
                fontSize: 11,
                color: '#1e40af',
                lineHeight: 1.5,
              }}>
                <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={13} color="#2563eb" />
                  <span>How to connect:</span>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18 }}>
                  <li>Connect your phone to the <strong>same Wi-Fi network</strong> as your laptop.</li>
                  <li>Scan the QR code using your phone&apos;s camera app.</li>
                  <li>Transactions executed on your phone will appear live in the Bank SOC!</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => setShowPairPhoneModal(false)}
                style={{
                  width: '100%',
                  padding: '11px',
                  borderRadius: 10,
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close Pairing Window
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } } @keyframes pulse-orange { 0%, 100% { box-shadow: 0 0 0 0 rgba(234,88,12,0.4); } 50% { box-shadow: 0 0 0 4px rgba(234,88,12,0); } }`}</style>
    </div>
  );
}
