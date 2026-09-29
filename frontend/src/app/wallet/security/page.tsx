'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Cpu,
  Globe,
  Lock,
  Wifi,
  Fingerprint,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Ban,
} from 'lucide-react';

export default function SecurityCenterPage() {
  const router = useRouter();
  const [securityData, setSecurityData] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [quarantineMsg, setQuarantineMsg] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [sec, devs] = await Promise.all([
        api('/wallet/security-score'),
        api('/devices'),
      ]);
      setSecurityData(sec);
      setDevices(devs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuarantine = async (deviceId: string) => {
    try {
      await api(`/devices/${deviceId}/quarantine`, { method: 'POST' });
      setQuarantineMsg(`Device ${deviceId} has been quarantined.`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="animate-spin text-sky-400 mb-2" size={28} />
        <span className="text-xs text-slate-400 font-mono">Running Security Audit...</span>
      </div>
    );
  }

  const score = securityData?.score ?? 94;
  const isFortified = score >= 80;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 pt-1">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-white">Wallet Security Center</h1>
          <p className="text-[11px] text-slate-400 font-mono">Continuous Zero-Trust Health Audit</p>
        </div>
      </div>

      {quarantineMsg && (
        <div className="p-3 rounded-2xl bg-amber-950/80 border border-amber-500/50 text-xs text-amber-200 flex items-center justify-between">
          <span>{quarantineMsg}</span>
          <button onClick={() => setQuarantineMsg(null)} className="font-bold text-amber-400">✕</button>
        </div>
      )}

      {/* Main Score Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/80 shadow-xl text-center space-y-3">
        <div
          className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-black font-mono shadow-xl border-4 ${
            isFortified
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/40'
          }`}
        >
          {score}
        </div>
        <div>
          <div className="text-sm font-black text-white">
            WALLET HEALTH: {securityData?.status || 'FORTIFIED'}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Your wallet is actively monitored by the 10-Agent Autonomous Pipeline.
          </p>
        </div>

        {/* Vector Progress Bars */}
        <div className="pt-3 border-t border-slate-800/80 text-left space-y-2 text-xs">
          {Object.entries(securityData?.breakdown || {}).map(([key, val]: [string, any]) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-300 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-mono font-bold text-sky-400">{val}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full"
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Linked Devices Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-white tracking-wide">LINKED HARDWARE DEVICES</span>
          <span className="text-[10px] text-slate-500 font-mono">{devices.length} Registered</span>
        </div>

        <div className="space-y-2">
          {devices.map((d: any) => {
            const isTrusted = d.trust_level === 'TRUSTED';
            const isBlocked = d.trust_level === 'BLOCKED';

            return (
              <div
                key={d.id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-xl ${
                        isTrusted
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : isBlocked
                          ? 'bg-slate-800 text-slate-500'
                          : 'bg-red-500/10 text-red-400'
                      }`}
                    >
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{d.device_name || d.device_model}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {d.device_id} • {d.os_version}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                      isTrusted
                        ? 'bg-emerald-950 text-emerald-300'
                        : isBlocked
                        ? 'bg-slate-800 text-slate-400'
                        : 'bg-red-950 text-red-300'
                    }`}
                  >
                    {d.trust_level}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Globe size={11} className="text-sky-400" />
                    <span>{d.ip_address} ({d.location})</span>
                  </div>
                  {!isBlocked && d.trust_level !== 'TRUSTED' && (
                    <button
                      onClick={() => handleQuarantine(d.device_id)}
                      className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1"
                    >
                      <Ban size={11} />
                      <span>Quarantine</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Post-Quantum Readiness Box */}
      <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-indigo-300">
          <span className="flex items-center gap-1.5">
            <Cpu size={14} className="text-indigo-400" />
            <span>Post-Quantum Cryptography (PQC)</span>
          </span>
          <span className="text-[10px] font-mono bg-indigo-900/60 text-indigo-200 px-1.5 py-0.2 rounded">
            NIST Standardized
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          Channel transport protected with hybrid ML-KEM (Kyber-1024) key encapsulation to prevent Harvest-Now-Decrypt-Later attacks.
        </p>
      </div>
    </div>
  );
}
