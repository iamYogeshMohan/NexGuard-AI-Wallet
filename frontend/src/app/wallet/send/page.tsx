'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Check,
  Lock,
  Smartphone,
  Fingerprint,
  RefreshCw,
  User,
  ChevronRight,
  Zap,
  Building2,
  CreditCard,
  Plus,
  Copy,
  KeyRound,
  Sliders,
  Send,
} from 'lucide-react';
import Link from 'next/link';

function CleanFintechSendMoneyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams ? searchParams.get('category') || 'DINING' : 'DINING';
  const initialDevice = searchParams ? searchParams.get('device') || 'DEVICE-001' : 'DEVICE-001';
  const initialRecipient = searchParams ? searchParams.get('recipient') || '' : '';
  const initialUpi = searchParams ? searchParams.get('upi') || '' : '';
  const initialAmount = searchParams ? searchParams.get('amount') || '' : '';

  const [recipientName, setRecipientName] = useState<string>(initialRecipient || 'Swiggy Online Food');
  const [recipientUpi, setRecipientUpi] = useState<string>(initialUpi || 'swiggy@icici');
  const [amount, setAmount] = useState<string>(initialAmount || '500');
  const [purpose, setPurpose] = useState<string>('Dinner & Restaurant Bill');
  const [category, setCategory] = useState<string>(initialCategory);
  const [activeDeviceId, setActiveDeviceId] = useState<string>(initialDevice);

  // Dynamic wallet balance and beneficiaries
  const [walletBalance, setWalletBalance] = useState<number>(1000000);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);

  // States: 'FORM' | 'ANALYZING' | 'RESULT'
  const [paymentState, setPaymentState] = useState<'FORM' | 'ANALYZING' | 'RESULT'>('FORM');
  const [txnResult, setTxnResult] = useState<any>(null);

  // Step-Up verification loading & mode
  const [verifyingIdentity, setVerifyingIdentity] = useState<boolean>(false);
  const [stepUpMode, setStepUpMode] = useState<'BIOMETRIC' | 'OTP'>('BIOMETRIC');
  const [otpCode, setOtpCode] = useState<string>('849201');
  const [copiedTxn, setCopiedTxn] = useState<boolean>(false);

  // Analysis checklist animation step
  const [analysisStep, setAnalysisStep] = useState<number>(0);

  // Fetch real-time wallet balance and beneficiaries
  const refreshBalance = async () => {
    try {
      const balData = await api('/wallet/balance').catch(() => null);
      if (balData?.balance !== undefined) {
        setWalletBalance(Number(balData.balance));
      }
    } catch {
      // background update fallback
    }
  };

  useEffect(() => {
    const loadWalletData = async () => {
      try {
        const [balData, benData] = await Promise.all([
          api('/wallet/balance').catch(() => ({ balance: 1000000 })),
          api('/beneficiaries').catch(() => []),
        ]);
        if (balData?.balance !== undefined) setWalletBalance(Number(balData.balance));
        if (Array.isArray(benData) && benData.length > 0) {
          setBeneficiaries(benData);
        }
      } catch (err) {
        console.error('Error loading send form data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    loadWalletData();
  }, []);

  // Quick Viva presentation preset test scenarios
  const presetPayees = [
    {
      name: 'Safe Routine',
      recipient: 'Swiggy Online Food',
      upi: 'swiggy@icici',
      amount: '500',
      purpose: 'Dinner & Food Delivery',
      category: 'DINING',
      device: 'DEVICE-001',
      badge: 'ALLOW',
      color: 'emerald',
    },
    {
      name: 'Unusual Amount',
      recipient: 'Global Tech Electronics',
      upi: 'globaltech@hdfc',
      amount: '38000',
      purpose: 'New Work Laptop',
      category: 'ELECTRONICS',
      device: 'DEVICE-001',
      badge: 'VERIFY',
      color: 'amber',
    },
    {
      name: 'Offshore Mule Attack',
      recipient: 'Cayman Island Wire Exchange',
      upi: 'cayman.wire@offshore',
      amount: '85000',
      purpose: 'Urgent Wire Transfer',
      category: 'WIRE',
      device: 'DEVICE-002',
      badge: 'BLOCK',
      color: 'rose',
    },
  ];

  const handleSelectPreset = (p: any) => {
    setRecipientName(p.recipient);
    setRecipientUpi(p.upi);
    setAmount(p.amount);
    setPurpose(p.purpose);
    setCategory(p.category);
    setActiveDeviceId(p.device);
    setPaymentState('FORM');
    setTxnResult(null);
  };

  const handleSelectBeneficiary = (b: any) => {
    setRecipientName(b.name);
    setRecipientUpi(b.upi_id);
    setCategory(b.category || 'RETAIL');
    setPurpose(`Payment to ${b.name}`);
  };

  const cleanAmtStr = String(amount || '').replace(/,/g, '').trim();
  const parsedAmount = parseFloat(cleanAmtStr);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;
  const isExceedingBalance = isValidAmount && parsedAmount > walletBalance;

  const handleQuickAdd = (add: number) => {
    const curr = !isNaN(parsedAmount) && parsedAmount > 0 ? parsedAmount : 0;
    setAmount(String(curr + add));
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidAmount || isExceedingBalance) return;

    // Transition to Security Analysis Screen
    setPaymentState('ANALYZING');
    setAnalysisStep(1);

    const stepTimer1 = setTimeout(() => setAnalysisStep(2), 200);
    const stepTimer2 = setTimeout(() => setAnalysisStep(3), 400);

    const isPhoneB = activeDeviceId === 'DEVICE-002';
    const isPhoneC = activeDeviceId === 'DEVICE-003';

    try {
      const res = await api('/transactions', {
        method: 'POST',
        body: JSON.stringify({
          amount: parsedAmount,
          currency: 'INR',
          merchant: recipientName.trim() || 'UPI Transfer',
          merchant_category: category,
          purpose: purpose.trim() || 'Payment Transfer',
          device_id: activeDeviceId,
          session_id: isPhoneB ? 'SES-8821' : isPhoneC ? 'SES-9901' : 'SES-1024',
          location: isPhoneB ? 'London, UK [SYNTHETIC]' : isPhoneC ? 'Mumbai, IN [SYNTHETIC]' : 'Chennai, IN [SYNTHETIC]',
          demo_ip: isPhoneB ? '92.43.11.88' : isPhoneC ? '192.168.1.108' : '192.168.1.104',
          ip_type: isPhoneB ? 'VPN' : 'PRIVATE',
          transaction_type: category === 'WIRE' ? 'WIRE' : 'UPI_TRANSFER',
          payment_method: 'UPI',
          biometric_verified: !isPhoneB,
          biometric_confidence: isPhoneB ? 0.35 : 0.98,
          pin: '1234',
        }),
      });

      if (res.remaining_balance !== undefined) {
        setWalletBalance(Number(res.remaining_balance));
      }
      refreshBalance();

      setTimeout(() => {
        setTxnResult(res);
        setPaymentState('RESULT');
      }, 650);
    } catch (err: any) {
      setTimeout(() => {
        setTxnResult({
          status: 'BLOCK',
          amount: parsedAmount,
          merchant: recipientName,
          risk_score: 95,
          incident_id: 'INC-0001',
          reasons: [err.message || 'Transaction rejected by security policy.'],
        });
        setPaymentState('RESULT');
      }, 650);
    } finally {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
    }
  };

  const handleVerifyIdentity = async () => {
    const txnId = txnResult?.id || txnResult?.transaction_id;
    if (!txnId) return;

    setVerifyingIdentity(true);
    try {
      let res: any = null;
      try {
        res = await api(`/transactions/${txnId}/verify-step-up`, {
          method: 'POST',
          body: JSON.stringify({
            verification_type: stepUpMode === 'BIOMETRIC' ? 'BIOMETRIC' : 'OTP',
            otp_code: stepUpMode === 'OTP' ? otpCode : null,
          }),
        });
      } catch (err) {
        res = await api(`/transactions/${txnId}/verify`, {
          method: 'POST',
          body: JSON.stringify({
            verification_type: stepUpMode === 'BIOMETRIC' ? 'BIOMETRIC' : 'OTP',
            otp_code: stepUpMode === 'OTP' ? otpCode : null,
          }),
        });
      }

      if (res?.remaining_balance !== undefined) {
        setWalletBalance(Number(res.remaining_balance));
      }
      refreshBalance();

      setTxnResult((prev: any) => ({
        ...prev,
        ...res,
        status: 'ALLOW',
        reasons: [
          stepUpMode === 'BIOMETRIC'
            ? 'Biometric Touch ID confirmed customer identity successfully. Funds debited.'
            : 'SMS OTP Code verified successfully. Payment cleared.',
        ],
      }));
    } catch (err: any) {
      console.error('Step-up verification error:', err);
      alert(err.message || 'Verification challenge failed.');
    } finally {
      setVerifyingIdentity(false);
    }
  };

  const handleCopyTxnId = () => {
    const idToCopy = txnResult?.transaction_id_str || `TXN-${txnResult?.id || '9024'}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy);
      setCopiedTxn(true);
      setTimeout(() => setCopiedTxn(false), 2000);
    }
  };

  // ─── 1. SECURITY ANALYSIS SCREEN ──────────────────────────────────────────
  if (paymentState === 'ANALYZING') {
    return (
      <div style={{ padding: '36px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 460, textAlign: 'center', gap: 20 }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 20,
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1d4ed8',
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
            NexGuard Multi-Agent Engine
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '4px 0 2px' }}>
            Evaluating Transaction
          </h2>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
            Auditing 10 real-time security vectors before debiting ledger
          </p>
        </div>

        {/* Pulse / Analyzing Circle */}
        <div style={{ position: 'relative', width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#dbeafe', opacity: 0.5, animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
          <div style={{ width: 56, height: 56, borderRadius: 16, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(37,99,235,0.35)', position: 'relative' }}>
            <RefreshCw className="animate-spin text-white" size={24} />
          </div>
        </div>

        {/* Progressive Customer Trust Checklist */}
        <div style={{ width: '100%', maxWidth: 360, background: '#fff', padding: 16, borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left', fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>1. Amount Baseline Anomaly (Z-score)</span>
            {analysisStep >= 1 ? (
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Check size={13} className="stroke-[3]" /> Evaluated
              </span>
            ) : (
              <span style={{ color: '#cbd5e1' }}>○</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>2. Device Integrity & Biometrics</span>
            {analysisStep >= 1 ? (
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Check size={13} className="stroke-[3]" /> Verified
              </span>
            ) : (
              <span style={{ color: '#cbd5e1' }}>○</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>3. Geo-Velocity & Impossible Travel</span>
            {analysisStep >= 2 ? (
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Check size={13} className="stroke-[3]" /> Calculated
              </span>
            ) : (
              <span style={{ color: '#cbd5e1' }}>○</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 6, borderBottom: '1px solid #f1f5f9' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>4. Beneficiary Trust & Mule History</span>
            {analysisStep >= 2 ? (
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Check size={13} className="stroke-[3]" /> Scored
              </span>
            ) : (
              <span style={{ color: '#cbd5e1' }}>○</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, color: '#0f172a' }}>5. NIST PQC Cryptography Channel</span>
            {analysisStep >= 3 ? (
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                <Check size={13} className="stroke-[3]" /> Protected
              </span>
            ) : (
              <span style={{ color: '#cbd5e1' }}>○</span>
            )}
          </div>
        </div>

        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
          NexGuard is verifying cryptographic trust before debiting your ledger.
        </p>
      </div>
    );
  }

  // ─── 2. RESULT SCREENS: ALLOW, VERIFY, BLOCK ───────────────────────────────
  if (paymentState === 'RESULT' && txnResult) {
    const isAllow = txnResult.status === 'ALLOW' || txnResult.status === 'ALLOWED' || txnResult.status === 'COMPLETED';
    const isVerify = txnResult.status === 'VERIFY' || txnResult.status === 'PENDING_VERIFICATION' || txnResult.status === 'CHALLENGE_REQUIRED';
    const isBlock = txnResult.status === 'BLOCK' || txnResult.status === 'BLOCKED';

    // ─── ALLOW SCREEN ────────────────────────────────────────────────────────
    if (isAllow) {
      return (
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 460, textAlign: 'center', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(22,163,74,0.22)' }}>
            <Check size={38} className="stroke-[3]" />
          </div>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
              ✓ INSTANT SETTLEMENT
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Payment Transferred</h2>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
              ₹{isValidAmount ? parsedAmount.toLocaleString('en-IN') : Number(txnResult.amount || 0).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginTop: 4 }}>{recipientName}</div>
          </div>

          <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Transaction ID</span>
              <button
                type="button"
                onClick={handleCopyTxnId}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <span>{txnResult.transaction_id_str || `TXN-${txnResult.id || '9024'}`}</span>
                {copiedTxn ? <Check size={12} color="#059669" /> : <Copy size={12} />}
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>AI Risk Score</span>
              <span style={{ fontWeight: 700, color: '#059669', background: '#f0fdf4', padding: '2px 8px', borderRadius: 6, border: '1px solid #bbf7d0' }}>
                {txnResult.risk_score ?? 8} / 100 (Safe)
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Remaining Balance</span>
              <span style={{ fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                ₹{Number(walletBalance).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => router.push('/home')}
              style={{ width: '100%', padding: '14px', borderRadius: 16, background: '#2563eb', color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.30)' }}
            >
              Done
            </button>
            <button
              onClick={() => {
                setPaymentState('FORM');
                setTxnResult(null);
                setAmount('');
                refreshBalance();
              }}
              style={{ width: '100%', padding: '12px', borderRadius: 16, background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}
            >
              Send Another Payment
            </button>
          </div>
        </div>
      );
    }

    // ─── VERIFY SCREEN (Adaptive Step-Up) ───────────────────────────────────
    if (isVerify) {
      return (
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 460, textAlign: 'center', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(217,119,6,0.22)' }}>
            <AlertTriangle size={36} className="stroke-[2.5]" />
          </div>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
              ⚡ ADAPTIVE STEP-UP REQUIRED
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>Verify Identity</h2>
            <p style={{ fontSize: 11, color: '#94a3b8', maxWidth: 320, margin: '0 auto' }}>
              NexGuard AI flagged an elevated risk score ({txnResult.risk_score || 52}/100). Please authenticate to authorize this transfer.
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#64748b' }}>Transfer Amount</span>
              <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                ₹{isValidAmount ? parsedAmount.toLocaleString('en-IN') : Number(txnResult.amount || 0).toLocaleString('en-IN')}
              </span>
            </div>

            <div style={{ paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: 9.5, textTransform: 'uppercase', fontWeight: 700, color: '#94a3b8' }}>Recipient</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginTop: 2 }}>{recipientName}</div>
              <div style={{ fontSize: 10, color: '#64748b', fontFamily: 'monospace' }}>{recipientUpi}</div>
            </div>

            <div>
              <div style={{ fontSize: 9.5, textTransform: 'uppercase', fontWeight: 700, color: '#b45309' }}>Verification Factors</div>
              <ul style={{ margin: '4px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4, color: '#475569', fontSize: 10.5 }}>
                {(txnResult.reasons && txnResult.reasons.length > 0 ? txnResult.reasons.slice(0, 2) : [
                  'High transaction value deviates from daily baseline',
                  'Beneficiary category requires step-up approval'
                ]).map((r: string, idx: number) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#d97706' }} />
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mode Selector */}
          <div style={{ width: '100%', maxWidth: 360, display: 'flex', background: '#f1f5f9', borderRadius: 14, padding: 3, gap: 4, fontSize: 11 }}>
            <button
              type="button"
              onClick={() => setStepUpMode('BIOMETRIC')}
              style={{ flex: 1, padding: '7px', borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: stepUpMode === 'BIOMETRIC' ? '#fff' : 'transparent', color: stepUpMode === 'BIOMETRIC' ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: stepUpMode === 'BIOMETRIC' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}
            >
              <Fingerprint size={14} /> Touch ID
            </button>
            <button
              type="button"
              onClick={() => setStepUpMode('OTP')}
              style={{ flex: 1, padding: '7px', borderRadius: 12, fontWeight: 700, border: 'none', cursor: 'pointer', background: stepUpMode === 'OTP' ? '#fff' : 'transparent', color: stepUpMode === 'OTP' ? '#0f172a' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, boxShadow: stepUpMode === 'OTP' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none' }}
            >
              <KeyRound size={14} /> SMS OTP
            </button>
          </div>

          {stepUpMode === 'OTP' && (
            <div style={{ width: '100%', maxWidth: 360, background: '#fff', padding: 12, borderRadius: 16, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Enter 6-Digit OTP</div>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                maxLength={6}
                style={{ width: '100%', textAlign: 'center', fontFamily: 'monospace', fontSize: 20, fontWeight: 800, padding: 8, borderRadius: 10, border: '1px solid #cbd5e1', outline: 'none' }}
              />
            </div>
          )}

          <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={handleVerifyIdentity}
              disabled={verifyingIdentity}
              style={{ width: '100%', padding: '14px', borderRadius: 16, background: '#d97706', color: '#fff', fontWeight: 800, fontSize: 13, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 4px 14px rgba(217,119,6,0.30)' }}
            >
              {stepUpMode === 'BIOMETRIC' ? <Fingerprint size={18} /> : <KeyRound size={16} />}
              <span>{verifyingIdentity ? 'Authenticating...' : stepUpMode === 'BIOMETRIC' ? 'Authorize with Touch ID' : 'Verify OTP'}</span>
            </button>
            <button
              onClick={() => {
                setPaymentState('FORM');
                setTxnResult(null);
                refreshBalance();
              }}
              style={{ width: '100%', padding: '12px', borderRadius: 16, background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}
            >
              Cancel Transfer
            </button>
          </div>
        </div>
      );
    }

    // ─── BLOCK SCREEN (AI Threat Defense) ───────────────────────────────────
    if (isBlock) {
      return (
        <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 460, textAlign: 'center', gap: 16 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(220,38,38,0.22)' }}>
            <ShieldAlert size={38} className="stroke-[2.5]" />
          </div>

          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px', borderRadius: 20, background: '#fff1f2', border: '1px solid #fecaca', color: '#991b1b', fontSize: 10, fontWeight: 700, marginBottom: 6 }}>
              🚫 AI BLOCKED — FUNDS SAFE
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#dc2626', margin: '0 0 4px' }}>Payment Blocked</h2>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>
              ₹{isValidAmount ? parsedAmount.toLocaleString('en-IN') : Number(txnResult.amount || 0).toLocaleString('en-IN')}
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', maxWidth: 320, margin: '4px auto 0' }}>
              Transaction aborted. Autonomous AI engines intercepted an account takeover attack indicator.
            </p>
          </div>

          <div style={{ width: '100%', maxWidth: 360, background: '#fff', borderRadius: 20, border: '1px solid #fecaca', boxShadow: '0 1px 4px rgba(0,0,0,0.04)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 11, textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
              Autonomous Threat Interception Evidence
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 5, color: '#475569', fontSize: 10.5 }}>
              {(txnResult.reasons && txnResult.reasons.length > 0 ? txnResult.reasons.slice(0, 3) : [
                'Unrecognized rogue hardware / spoofed device fingerprint',
                'Unusual geographical location and VPN exit node detected',
                'Beneficiary matches known offshore mule account patterns'
              ]).map((reason: string, i: number) => (
                <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>

            <div style={{ paddingTop: 8, borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace', fontSize: 10.5 }}>
              <span style={{ color: '#64748b' }}>Incident Ticket</span>
              <span style={{ color: '#991b1b', fontWeight: 800, background: '#fff1f2', padding: '2px 8px', borderRadius: 6, border: '1px solid #fecaca' }}>
                {txnResult.incident_id || 'INC-0001'}
              </span>
            </div>
          </div>

          <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link
              href="/security"
              style={{ width: '100%', padding: '14px', borderRadius: 16, background: '#0f172a', color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'block', textAlign: 'center' }}
            >
              Review Security Center
            </Link>
            <button
              onClick={() => {
                setPaymentState('FORM');
                setTxnResult(null);
                refreshBalance();
              }}
              style={{ width: '100%', padding: '12px', borderRadius: 16, background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}
            >
              Return to Send Form
            </button>
          </div>
        </div>
      );
    }
  }

  // ─── 3. SEND MONEY FORM: Matches Home Page Aesthetics ────────────────────
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
            Direct Transfer
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0, lineHeight: 1.2 }}>
            Send Money
          </h1>
        </div>

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
            Protected by AI
          </span>
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

        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase' }}>
            Enter Amount
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.14)',
              borderRadius: 20,
              backdropFilter: 'blur(8px)',
              fontSize: 10.5,
              fontWeight: 600,
            }}
          >
            <span>Balance:</span>
            <strong style={{ fontFamily: 'monospace' }}>₹{walletBalance.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Amount Input Row */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '4px 0 16px' }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: 'rgba(255,255,255,0.7)' }}>₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="1"
            max="500000"
            step="any"
            style={{
              width: '100%',
              textAlign: 'right',
              fontSize: 34,
              fontWeight: 800,
              color: '#fff',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              letterSpacing: '-0.02em',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          />
        </div>

        {/* Quick Amount Chips */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            paddingTop: 12,
            borderTop: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {[500, 1000, 3500, 10000, 38000, 85000].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setAmount(String(val))}
              style={{
                padding: '4px 10px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff',
                fontSize: 10.5,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'background 0.12s ease',
              }}
            >
              ₹{val.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Recipient Details Card: Matches Home Style ── */}
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
            <div style={{ width: 22, height: 22, borderRadius: 6, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={13} color="#2563eb" />
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', letterSpacing: '0.02em' }}>
              Payee Information
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '10px 14px' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>Name or Business</span>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="e.g. Swiggy, Amazon, Rahul"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 13, fontWeight: 700, color: '#0f172a', marginTop: 2 }}
              required
            />
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: '10px 14px' }}>
            <span style={{ fontSize: 9.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block' }}>UPI ID</span>
            <input
              type="text"
              value={recipientUpi}
              onChange={(e) => setRecipientUpi(e.target.value)}
              placeholder="username@bank"
              style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 12, fontFamily: 'monospace', fontWeight: 600, color: '#475569', marginTop: 2 }}
              required
            />
          </div>
        </div>

        {/* Quick Beneficiaries Carousel */}
        {beneficiaries.length > 0 && (
          <div style={{ paddingTop: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 6 }}>
              Frequent Contacts
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
              {beneficiaries.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => handleSelectBeneficiary(b)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 10px',
                    borderRadius: 14,
                    background: recipientUpi === b.upi_id ? '#eff6ff' : '#f8fafc',
                    border: `1px solid ${recipientUpi === b.upi_id ? '#bfdbfe' : '#e2e8f0'}`,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#2563eb', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {b.name.charAt(0)}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>{b.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 1-Tap Viva Scenarios Card ── */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Zap size={13} color="#2563eb" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>
              1-Tap Test Scenarios
            </span>
          </div>
          <span style={{ fontSize: 9.5, color: '#94a3b8', fontWeight: 600 }}>Viva Testing</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {presetPayees.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => handleSelectPreset(p)}
              style={{
                padding: '10px 8px',
                borderRadius: 14,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textAlign: 'left',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                transition: 'all 0.12s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name.split(' ')[0]}
                </span>
                <span
                  style={{
                    fontSize: 8,
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: 6,
                    background: p.badge === 'ALLOW' ? '#dcfce7' : p.badge === 'VERIFY' ? '#fef3c7' : '#fee2e2',
                    color: p.badge === 'ALLOW' ? '#166534' : p.badge === 'VERIFY' ? '#92400e' : '#991b1b',
                  }}
                >
                  {p.badge}
                </span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb' }}>
                ₹{Number(p.amount).toLocaleString('en-IN')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Origin Device Selector ── */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Smartphone size={15} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a' }}>Origin Device</div>
            <div style={{ fontSize: 9.5, color: '#94a3b8' }}>Simulated client hardware</div>
          </div>
        </div>

        <select
          value={activeDeviceId}
          onChange={(e) => setActiveDeviceId(e.target.value)}
          style={{
            fontSize: 11,
            fontWeight: 700,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 12,
            padding: '6px 10px',
            color: '#0f172a',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          <option value="DEVICE-001">Phone A (Trusted Pixel 8)</option>
          <option value="DEVICE-002">Phone B (Rogue S24 / Tor)</option>
          <option value="DEVICE-003">Phone C (New Device)</option>
        </select>
      </div>

      {/* ── Pay Button: High-End Royal Blue Gradient ── */}
      <button
        type="button"
        onClick={handleContinue}
        disabled={!isValidAmount || isExceedingBalance}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 18,
          background: !isValidAmount || isExceedingBalance ? '#cbd5e1' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
          color: '#fff',
          fontWeight: 800,
          fontSize: 14,
          border: 'none',
          cursor: !isValidAmount || isExceedingBalance ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: !isValidAmount || isExceedingBalance ? 'none' : '0 6px 20px rgba(37,99,235,0.35)',
          transition: 'all 0.15s ease',
        }}
      >
        <span>Pay ₹{isValidAmount ? parsedAmount.toLocaleString('en-IN') : '0'}</span>
        <ChevronRight size={16} />
      </button>

      {isExceedingBalance && (
        <p style={{ fontSize: 11, color: '#dc2626', textAlign: 'center', margin: 0, fontWeight: 600 }}>
          Amount exceeds available wallet balance of ₹{walletBalance.toLocaleString('en-IN')}.
        </p>
      )}

      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default function CleanFintechSendMoneyPage() {
  return (
    <Suspense fallback={<div style={{ padding: 24, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>Loading payment engine...</div>}>
      <CleanFintechSendMoneyForm />
    </Suspense>
  );
}
