'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Smartphone, RefreshCw, ArrowRight } from 'lucide-react';

export default function ConnectPhonePage() {
  const router = useRouter();

  useEffect(() => {
    // Seamlessly redirect to the customer wallet with QR pairing modal active
    router.replace('/mobile/dashboard?pair=true');
  }, [router]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '400px',
          width: '100%',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '32px 24px',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--primary-light)',
            border: '1px solid var(--primary-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)',
          }}
        >
          <Smartphone size={24} />
        </div>

        <div>
          <h2 style={{ fontSize: '17px', fontWeight: '700', marginBottom: '4px', color: 'var(--text-primary)' }}>
            Opening Customer Wallet
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
            Redirecting to live wallet pairing experience...
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontSize: '13px', fontWeight: '600' }}>
          <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Connecting...</span>
        </div>

        <Link
          href="/mobile/dashboard?pair=true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '8px',
            padding: '8px 16px',
            background: 'var(--primary)',
            color: '#ffffff',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            textDecoration: 'none',
          }}
        >
          Open Wallet Directly <ArrowRight size={13} />
        </Link>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
