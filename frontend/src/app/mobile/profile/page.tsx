'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User,
  ShieldCheck,
  Building2,
  Smartphone,
  Users,
  Bell,
  Lock,
  LogOut,
  Copy,
  Check,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  QrCode,
  CreditCard,
  KeyRound,
  Fingerprint,
  ExternalLink,
} from 'lucide-react';
import { api, clearAuthToken } from '@/lib/api';

export default function CleanFintechProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [bankAccount, setBankAccount] = useState<any>(null);
  const [devicesCount, setDevicesCount] = useState<number>(2);
  const [beneficiariesCount, setBeneficiariesCount] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [accountFrozen, setAccountFrozen] = useState<boolean>(false);
  const [freezeLoading, setFreezeLoading] = useState<boolean>(false);
  const [freezeMessage, setFreezeMessage] = useState<string | null>(null);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [walletData, bankData, devicesData, bensData] = await Promise.all([
        api('/wallet/profile').catch(() => null),
        api('/bank/account').catch(() => null),
        api('/devices').catch(() => []),
        api('/beneficiaries').catch(() => []),
      ]);

      if (walletData) {
        setProfile(walletData);
        setAccountFrozen(walletData.account_status === 'FROZEN');
      } else {
        setProfile({
          full_name: 'Karthik Nair',
          username: 'karthik',
          email: 'karthik.nair@nexguard.bank',
          phone_number: '+91 98765 43210',
          upi_id: 'karthik@nexguard',
          balance: 999500,
          security_score: 94,
          account_status: 'ACTIVE',
        });
      }

      if (bankData) setBankAccount(bankData);
      if (Array.isArray(devicesData)) setDevicesCount(devicesData.length || 2);
      if (Array.isArray(bensData)) setBeneficiariesCount(bensData.length || 3);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const handleCopyUpi = () => {
    const upi = profile?.upi_id || 'karthik@nexguard';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(upi);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    }
  };

  const handleToggleFreeze = async () => {
    setFreezeLoading(true);
    setFreezeMessage(null);
    try {
      const newStatus = accountFrozen ? 'unfreeze' : 'freeze';
      await api(`/accounts/1/${newStatus}`, { method: 'POST' });
      setAccountFrozen(!accountFrozen);
      setFreezeMessage(
        accountFrozen
          ? 'Account security hold removed. Payments active.'
          : 'Account frozen. All outgoing transactions are locked.'
      );
      await fetchProfileData();
    } catch (err: any) {
      setFreezeMessage(err?.message || 'Operation failed');
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    router.push('/login');
  };

  if (loading && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="animate-spin text-blue-600" size={26} />
        <span className="text-xs text-slate-500 font-medium">Loading customer profile...</span>
      </div>
    );
  }

  const fullName = profile?.full_name || 'Karthik Nair';
  const initial = fullName.charAt(0).toUpperCase();
  const upiId = profile?.upi_id || 'karthik@nexguard';
  const phone = profile?.phone_number || '+91 98765 43210';
  const email = profile?.email || 'karthik.nair@nexguard.bank';
  const balance = profile?.balance ?? 999500;
  const score = profile?.security_score ?? 94;

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: '16px 16px 20px', display: 'flex', flexDirection: 'column', gap: 16, fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ── Page Title ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', margin: 0 }}>
            Profile & Account
          </h1>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '2px 0 0' }}>
            Customer Identity • NG Bank Simulated
          </p>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 10px', borderRadius: 20,
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          color: '#166534', fontSize: 10, fontWeight: 700,
        }}>
          <ShieldCheck size={12} color="#16a34a" />
          <span>KYC Verified</span>
        </div>
      </div>

      {/* ── User Profile Card ── */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <div style={{
            position: 'relative',
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 22,
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
            flexShrink: 0,
          }}>
            {initial}
            <div style={{
              position: 'absolute', bottom: -1, right: -1,
              width: 16, height: 16, borderRadius: '50%',
              background: '#10b981', border: '2px solid #fff',
            }} />
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fullName}
              </h2>
            </div>
            
            {/* UPI ID with copy */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#2563eb', fontFamily: 'monospace' }}>
                {upiId}
              </span>
              <button
                onClick={handleCopyUpi}
                style={{
                  background: copiedUpi ? '#dcfce7' : '#eff6ff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '2px 6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 600,
                  color: copiedUpi ? '#166534' : '#1d4ed8',
                  transition: 'all 0.15s ease',
                }}
                title="Copy UPI ID"
              >
                {copiedUpi ? <Check size={11} /> : <Copy size={11} />}
                <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Contact info list */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: 6,
          background: '#f8fafc',
          borderRadius: 12,
          padding: '10px 12px',
          border: '1px solid #f1f5f9',
          fontSize: 11,
          color: '#475569',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Mobile</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{phone}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Email</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>{email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Account Type</span>
            <span style={{ fontWeight: 600, color: '#1e293b' }}>Simulated Primary Wallet</span>
          </div>
        </div>
      </div>

      {/* ── Simulated NG Bank Account Card ── */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        padding: '16px 18px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: '#eff6ff', color: '#2563eb',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Building2 size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
                NG Bank (Simulated)
              </div>
              <div style={{ fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>
                {bankAccount?.account_number_masked || 'NG **** 8819'}
              </div>
            </div>
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 12,
            background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0',
          }}>
            Active
          </span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9',
        }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>Available Funds</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
              ₹{Number(balance).toLocaleString('en-IN')}
            </div>
          </div>
          <Link
            href="/receive"
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              background: '#2563eb',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <QrCode size={13} />
            <span>My QR</span>
          </Link>
        </div>
      </div>

      {/* ── Quick Navigation Section ── */}
      <div style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '12px 16px 8px', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Security & Controls
        </div>

        {[
          {
            title: 'Security Center',
            subtitle: `Score ${score}/100 • 10 AI Agents Active`,
            icon: ShieldCheck,
            href: '/security',
            badge: '94 SECURE',
            badgeColor: '#16a34a',
            badgeBg: '#f0fdf4',
          },
          {
            title: 'Registered Hardware Devices',
            subtitle: `${devicesCount} devices connected`,
            icon: Smartphone,
            href: '/devices',
            badge: 'Pixel 8 Active',
            badgeColor: '#2563eb',
            badgeBg: '#eff6ff',
          },
          {
            title: 'Saved Beneficiaries',
            subtitle: `${beneficiariesCount} trusted contacts`,
            icon: Users,
            href: '/beneficiaries',
            badge: 'Manage',
            badgeColor: '#475569',
            badgeBg: '#f1f5f9',
          },
          {
            title: 'Security Notifications',
            subtitle: 'Real-time defense & login alerts',
            icon: Bell,
            href: '/notifications',
            badge: 'Active',
            badgeColor: '#d97706',
            badgeBg: '#fffbeb',
          },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderTop: '1px solid #f1f5f9',
                textDecoration: 'none',
                transition: 'background 0.12s ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#f8fafc'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = '#fff'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10,
                  background: '#f8fafc', border: '1px solid #e2e8f0',
                  color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{item.subtitle}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                  background: item.badgeBg, color: item.badgeColor,
                }}>
                  {item.badge}
                </span>
                <ChevronRight size={14} color="#94a3b8" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* ── Emergency Account Freeze ── */}
      <div style={{
        background: accountFrozen ? '#fff1f2' : '#fff',
        borderRadius: 20,
        padding: '16px 18px',
        border: `1px solid ${accountFrozen ? '#fecaca' : '#e2e8f0'}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: accountFrozen ? '#fee2e2' : '#fef2f2',
              color: '#dc2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Lock size={16} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: accountFrozen ? '#991b1b' : '#0f172a' }}>
                {accountFrozen ? 'Account Suspended / Frozen' : 'Emergency Wallet Freeze'}
              </div>
              <div style={{ fontSize: 11, color: accountFrozen ? '#b91c1c' : '#64748b' }}>
                {accountFrozen ? 'Outgoing payments blocked' : 'Immediately lock outgoing payments'}
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleFreeze}
            disabled={freezeLoading}
            style={{
              padding: '6px 12px',
              borderRadius: 10,
              background: accountFrozen ? '#16a34a' : '#dc2626',
              color: '#fff',
              fontSize: 11,
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              opacity: freezeLoading ? 0.6 : 1,
            }}
          >
            {freezeLoading ? 'Updating...' : accountFrozen ? 'Unfreeze' : 'Freeze Now'}
          </button>
        </div>
        {freezeMessage && (
          <div style={{ fontSize: 11, color: accountFrozen ? '#991b1b' : '#047857', marginTop: 6, fontWeight: 600 }}>
            {freezeMessage}
          </div>
        )}
      </div>

      {/* ── Logout Button ── */}
      <button
        onClick={handleLogout}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 14,
          background: '#fff',
          border: '1px solid #fee2e2',
          color: '#dc2626',
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; }}
      >
        <LogOut size={16} />
        <span>Log Out of Wallet</span>
      </button>

      {/* Version footer */}
      <div style={{ textAlign: 'center', fontSize: 10, color: '#94a3b8', paddingBottom: 8 }}>
        NexGuard AI Wallet • v2.4 Academic Closed-Loop Demo
      </div>
    </div>
  );
}
