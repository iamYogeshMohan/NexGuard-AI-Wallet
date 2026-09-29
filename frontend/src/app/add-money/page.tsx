'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PlusCircle, Building2, CreditCard, ArrowRight, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import NexGuardMobileLayout from '@/app/mobile/layout';
import { api } from '@/lib/api';

function CleanAddMoneyContent() {
  const router = useRouter();
  const [amount, setAmount] = useState<string>('10000');
  const [source, setSource] = useState<string>('Simulated NG Bank Primary');
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState<number>(999500);

  useEffect(() => {
    api('/wallet/balance')
      .then((data) => setCurrentBalance(data.balance))
      .catch(() => {});
  }, []);

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await api('/wallet/add-money', {
        method: 'POST',
        body: JSON.stringify({
          amount: val,
          source: source,
        }),
      });

      setSuccessMsg(res.message || `₹${val.toLocaleString('en-IN')} added to wallet.`);
      setCurrentBalance(res.new_balance);
      setTimeout(() => router.push('/home'), 1200);
    } catch (err: any) {
      setError(err?.message || 'Deposit failed');
    } finally {
      setLoading(false);
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
            Add Demo Funds
          </h1>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
            Top up wallet balance from Simulated NG Bank
          </p>
        </div>
      </div>

      {/* Current Balance Pill */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '16px 18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <span style={{ fontSize: 11, color: '#64748b' }}>Current Available Balance</span>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 2 }}>
            ₹{Number(currentBalance).toLocaleString('en-IN')}
          </div>
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 12, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
          Simulated NG Bank
        </span>
      </div>

      {/* Form */}
      <form onSubmit={handleAddMoney} style={{
        background: '#fff',
        borderRadius: 20,
        padding: '20px 18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
            Amount (INR)
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 6,
            padding: '12px 14px',
            background: '#f8fafc',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
          }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#0f172a',
                border: 'none',
                background: 'transparent',
                outline: 'none',
                width: '100%',
              }}
            />
          </div>
        </div>

        {/* Quick Amount Chips */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['5000', '10000', '25000', '50000'].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => setAmount(val)}
              style={{
                flex: 1,
                padding: '8px 4px',
                borderRadius: 10,
                border: amount === val ? '1.5px solid #2563eb' : '1px solid #e2e8f0',
                background: amount === val ? '#eff6ff' : '#fff',
                color: amount === val ? '#1d4ed8' : '#475569',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              +₹{Number(val).toLocaleString('en-IN')}
            </button>
          ))}
        </div>

        {/* Source info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px',
          background: '#f8fafc',
          borderRadius: 12,
          border: '1px solid #f1f5f9',
        }}>
          <Building2 size={20} color="#2563eb" />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>NG Bank Simulated Reserve</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>Account: NG **** 8819 • Instant Top-up</div>
          </div>
        </div>

        {error && (
          <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>{error}</div>
        )}

        {successMsg && (
          <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle2 size={13} />
            <span>{successMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '14px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 800,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Adding Demo Funds...' : `Add ₹${Number(amount || 0).toLocaleString('en-IN')} to Wallet`}
        </button>
      </form>
    </div>
  );
}

export default function AddMoneyPage() {
  return (
    <NexGuardMobileLayout>
      <CleanAddMoneyContent />
    </NexGuardMobileLayout>
  );
}
