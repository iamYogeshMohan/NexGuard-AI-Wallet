'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles, Check } from 'lucide-react';
import { api, setAuthToken } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('karthik');
  const [password, setPassword] = useState('nexguard2024');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      if (res.access_token) {
        setAuthToken(res.access_token);
        router.push('/home');
      } else {
        setError('Login failed: Token not received');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        boxSizing: 'border-box',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Demo Environment Banner */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fffbeb',
          borderBottom: '1px solid #fde68a',
          padding: '6px 12px',
          textAlign: 'center',
          zIndex: 50,
        }}
      >
        <p
          style={{
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#b45309',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          DEMO BANKING ENVIRONMENT — NO REAL MONEY INVOLVED
        </p>
      </div>

      {/* Auth Card Container */}
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          marginTop: 20,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)',
            }}
          >
            <ShieldCheck size={30} strokeWidth={2.2} />
          </div>
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.03em',
                margin: '0 0 2px',
              }}
            >
              NEXGUARD
            </h1>
            <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500, margin: 0 }}>
              AI-Protected Secure Digital Wallet
            </p>
          </div>
        </div>

        {/* Main Card */}
        <div
          style={{
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: 24,
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08)',
            padding: '28px 24px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
              Sign in to your wallet
            </h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              Access your simulated ₹10,00,000 balance
            </p>
          </div>

          {error && (
            <div
              style={{
                padding: '10px 14px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: '#b91c1c',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Username / Mobile Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Username / Mobile / Email
              </label>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 14,
                  padding: '0 12px',
                  height: 44,
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s',
                }}
              >
                <Mail size={16} color="#64748b" style={{ flexShrink: 0, marginRight: 10 }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. karthik or email"
                  required
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: 13,
                    color: '#0f172a',
                    fontWeight: 500,
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}
                >
                  Forgot?
                </Link>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 14,
                  padding: '0 12px',
                  height: 44,
                  boxSizing: 'border-box',
                }}
              >
                <Lock size={16} color="#64748b" style={{ flexShrink: 0, marginRight: 10 }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    width: '100%',
                    fontSize: 13,
                    color: '#0f172a',
                    fontWeight: 500,
                  }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                height: 44,
                width: '100%',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                transition: 'all 0.15s ease',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Credentials Pill */}
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#334155' }}>
                Quick Demo Login:
              </span>
              <button
                type="button"
                onClick={() => fillDemoCredentials('karthik', 'nexguard2024')}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#2563eb',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  padding: '3px 8px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <Sparkles size={11} />
                <span>Auto-Fill</span>
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
              <span>User: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>karthik</strong></span>
              <span>Pass: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>nexguard2024</strong></span>
            </div>
          </div>

          {/* Footer Link */}
          <div style={{ textAlign: 'center', paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Don&apos;t have an account? </span>
            <Link
              href="/register"
              style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}
            >
              Register now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
