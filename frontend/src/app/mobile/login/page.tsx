'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setAuthToken } from '@/lib/api';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  RefreshCw,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function MobileLoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('karthik');
  const [password, setPassword] = useState<string>('nexguard2024');
  const [fullName, setFullName] = useState<string>('Karthik Nair');
  const [email, setEmail] = useState<string>('karthik.nair@nexguard.bank');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        const res = await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            username,
            password,
            full_name: fullName,
            email,
          }),
        });
        if (res.access_token) setAuthToken(res.access_token);
        router.push('/mobile/dashboard');
      } else {
        const res = await api('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
        });
        if (res.access_token) setAuthToken(res.access_token);
        if (res.role === 'ANALYST') {
          router.push('/soc');
        } else {
          router.push('/mobile/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setIsRegister(false);
  };

  return (
    <div className="py-6 px-2 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-sky-500/20">
          <ShieldCheck size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-extrabold text-white">NexGuard Secure Wallet</h2>
        <p className="text-xs text-slate-400">Autonomous Multi-Agent AI Banking Security</p>
      </div>

      {/* 1-Click Demo Profiles */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="text-[10px] font-mono font-bold text-slate-400 flex items-center gap-1">
          <Zap size={12} className="text-amber-400" /> QUICK DEMO PROFILES (1-CLICK)
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickFill('karthik', 'nexguard2024')}
            className={`p-2 rounded-xl text-left border text-xs transition ${
              username === 'karthik'
                ? 'bg-sky-500/20 border-sky-500 text-sky-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="font-bold text-[11px]">Karthik Nair</div>
            <div className="text-[9px] opacity-75 font-mono">Demo Customer</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickFill('analyst', 'socanalyst2024')}
            className={`p-2 rounded-xl text-left border text-xs transition ${
              username === 'analyst'
                ? 'bg-indigo-500/20 border-indigo-500 text-indigo-200'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <div className="font-bold text-[11px]">Priya Sharma</div>
            <div className="text-[9px] opacity-75 font-mono">SOC Analyst Lead</div>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex border-b border-slate-800 text-xs font-bold mb-2">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 pb-2.5 transition border-b-2 ${
              !isRegister ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 pb-2.5 transition border-b-2 ${
              isRegister ? 'border-sky-500 text-sky-400' : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            Demo Register
          </button>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500 text-xs text-red-200">
            {error}
          </div>
        )}

        {isRegister && (
          <>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">FULL NAME</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">EMAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-sky-500 focus:outline-none"
              />
            </div>
          </>
        )}

        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">USERNAME</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-sky-500 focus:outline-none font-mono"
          />
        </div>

        <div>
          <label className="text-[11px] font-semibold text-slate-400 block mb-1">PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:border-sky-500 focus:outline-none font-mono"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
        >
          {loading ? (
            <RefreshCw className="animate-spin" size={16} />
          ) : (
            <>
              <span>{isRegister ? 'Create Demo Account' : 'Authenticate Session'}</span>
              <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
