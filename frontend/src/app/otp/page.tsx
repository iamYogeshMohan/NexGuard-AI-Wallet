'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, KeyRound, ArrowRight, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api, setAuthToken } from '@/lib/api';

function OTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifier = searchParams.get('identifier') || 'karthik@nexguard.bank';
  const purpose = searchParams.get('purpose') || 'LOGIN';

  const [otpCode, setOtpCode] = useState<string>('');
  const [demoOtp, setDemoOtp] = useState<string>('123456');
  const [cooldown, setCooldown] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Request demo OTP on initial load
  const requestOtp = async () => {
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await api('/auth/otp', {
        method: 'POST',
        body: JSON.stringify({ identifier, purpose }),
      });
      if (res.demo_otp) {
        setDemoOtp(res.demo_otp);
        setOtpCode(res.demo_otp); // Auto-fill for convenience in demo mode
        setSuccessMsg(`Demo OTP generated: ${res.demo_otp}`);
      }
      setCooldown(res.cooldown_seconds || 30);
    } catch (err: any) {
      setError(err?.message || 'Failed to request OTP');
    }
  };

  useEffect(() => {
    requestOtp();
  }, [identifier, purpose]);

  // Cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setError('Please enter a 6-digit OTP code');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api('/auth/verify', {
        method: 'POST',
        body: JSON.stringify({
          identifier,
          otp_code: otpCode,
          purpose,
        }),
      });

      if (res.verified) {
        if (res.access_token) {
          setAuthToken(res.access_token);
        }
        router.push('/home');
      } else {
        setError('Verification failed');
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center px-4 py-8">
      {/* Required Demo Environment Banner */}
      <div className="fixed top-0 left-0 right-0 bg-amber-500/10 border-b border-amber-500/20 px-3 py-1.5 text-center">
        <p className="text-[10px] font-semibold tracking-wider text-amber-800 uppercase">
          DEMO BANKING ENVIRONMENT — NO REAL MONEY INVOLVED
        </p>
      </div>

      <div className="max-w-sm w-full mx-auto space-y-6 mt-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-md">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Verify Identity</h1>
          <p className="text-xs text-slate-500 font-medium">
            Enter the 6-digit OTP sent to <strong className="text-slate-800">{identifier}</strong>
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Demo OTP Helper Callout */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
              Demo OTP Mechanism
            </span>
            <span className="font-mono text-xl font-extrabold text-blue-900 tracking-widest block">
              {demoOtp}
            </span>
            <span className="text-[10px] text-blue-600">
              Auto-filled for demonstration. Expires in 5 minutes.
            </span>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="text-[11px] font-semibold text-slate-600 block mb-1.5 text-center">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="••••••"
                required
                className="w-full text-center text-3xl font-extrabold tracking-[0.5em] py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Verifying OTP...' : 'Verify & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Didn't receive code?</span>
            <button
              type="button"
              disabled={cooldown > 0}
              onClick={requestOtp}
              className="font-semibold text-blue-600 hover:underline disabled:text-slate-400 disabled:no-underline"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OTPPage() {
  return (
    <React.Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading verification...</div>}>
      <OTPContent />
    </React.Suspense>
  );
}

