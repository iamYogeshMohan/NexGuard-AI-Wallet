'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, ArrowDownLeft, Share2, Building2, ArrowLeft, ShieldCheck } from 'lucide-react';
import NexGuardMobileLayout from '@/app/mobile/layout';
import { api } from '@/lib/api';

function CleanReceiveContent() {
  const [profile, setProfile] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [receiveMsg, setReceiveMsg] = useState<string | null>(null);

  useEffect(() => {
    api('/wallet/profile')
      .then((data) => setProfile(data))
      .catch(() => {
        setProfile({
          full_name: 'Karthik Nair',
          upi_id: 'karthik@nexguard',
          balance: 999500,
        });
      });
  }, []);

  const upiId = profile?.upi_id || 'karthik@nexguard';
  const qrValue = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(
    profile?.full_name || 'Karthik Nair'
  )}&cu=INR`;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSimulateReceive = async () => {
    setSimulating(true);
    setReceiveMsg(null);
    try {
      const res = await api('/wallet/add-money', {
        method: 'POST',
        body: JSON.stringify({ amount: 5000, source: 'UPI Transfer from Ravi' }),
      });
      setReceiveMsg(res.message || '₹5,000 received successfully!');
      const updated = await api('/wallet/profile');
      setProfile(updated);
    } catch (err: any) {
      setReceiveMsg(err?.message || 'Simulated receive failed');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 24px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Link
          href="/home"
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: '#fff', border: '1px solid #e2e8f0',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#475569', textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Receive Money
          </h1>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
            Scan QR or share your personal UPI ID
          </p>
        </div>
      </div>

      {/* QR Card */}
      <div style={{
        background: '#fff',
        borderRadius: 24,
        padding: '24px 20px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 2px' }}>
            {profile?.full_name || 'Karthik Nair'}
          </h2>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            NexGuard Protected Customer Account
          </span>
        </div>

        {/* QR Code Container */}
        <div style={{
          padding: 16,
          background: '#fff',
          borderRadius: 20,
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        }}>
          <QRCodeSVG value={qrValue} size={190} level="H" includeMargin={false} />
        </div>

        {/* UPI ID Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          background: '#f8fafc',
          borderRadius: 14,
          border: '1px solid #e2e8f0',
        }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', fontFamily: 'monospace' }}>
            {upiId}
          </span>
          <button
            onClick={handleCopy}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              background: copied ? '#dcfce7' : '#2563eb',
              color: copied ? '#166534' : '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              transition: 'all 0.15s ease',
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Simulate incoming transfer */}
        <button
          onClick={handleSimulateReceive}
          disabled={simulating}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: 14,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#166534',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <ArrowDownLeft size={16} />
          <span>{simulating ? 'Processing Demo Transfer...' : 'Simulate Instant ₹5,000 Credit'}</span>
        </button>

        {receiveMsg && (
          <div style={{ fontSize: 11, fontWeight: 600, color: '#059669' }}>
            {receiveMsg}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReceivePage() {
  return (
    <NexGuardMobileLayout>
      <CleanReceiveContent />
    </NexGuardMobileLayout>
  );
}
