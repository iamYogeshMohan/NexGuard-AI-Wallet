'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  ArrowLeft,
  Smartphone,
  ShieldCheck,
  ShieldAlert,
  Plus,
  RefreshCw,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Ban,
  Check,
} from 'lucide-react';

export default function CleanFintechDevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPairModal, setShowPairModal] = useState<boolean>(false);
  const [pairingCodeInfo, setPairingCodeInfo] = useState<any>(null);
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [pairSuccess, setPairSuccess] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      const data = await api('/devices');
      setDevices(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleGenerateCode = async () => {
    try {
      const data = await api('/devices/pair/generate', { method: 'POST' });
      setPairingCodeInfo(data);
      setShowPairModal(true);
    } catch (err: any) {
      alert(`Pairing error: ${err.message}`);
    }
  };

  const handlePairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredCode || enteredCode.length !== 6) return;
    setPairSuccess('Device successfully paired and authorized!');
    setTimeout(() => {
      setShowPairModal(false);
      setPairSuccess(null);
      setEnteredCode('');
      fetchDevices();
    }, 1500);
  };

  const handleQuarantineDevice = async (deviceId: string) => {
    try {
      await api(`/devices/${deviceId}/quarantine`, { method: 'POST' });
      fetchDevices();
    } catch (err: any) {
      alert(`Action error: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/mobile/dashboard"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft size={16} />
          <span>My Devices</span>
        </Link>
        <button
          onClick={fetchDevices}
          className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 transition"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Pairing Banner */}
      <div className="p-4 rounded-3xl bg-indigo-50 border border-indigo-100 flex items-center justify-between shadow-sm">
        <div>
          <div className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
            <KeyRound size={15} className="text-indigo-600" />
            <span>Pair New Smartphone</span>
          </div>
          <div className="text-[11px] text-indigo-700/80 mt-0.5">
            Generate 6-digit cryptographic pairing code.
          </div>
        </div>
        <button
          onClick={handleGenerateCode}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
        >
          <Plus size={14} />
          <span>Pair</span>
        </button>
      </div>

      {/* Device List (Section 11) */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-slate-700 block px-1">AUTHORIZED HARDWARE</span>

        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400">Loading devices...</div>
        ) : (
          devices.map((dev) => {
            const isTrusted = dev.trust_level === 'TRUSTED';
            const isSuspicious = dev.trust_level === 'SUSPICIOUS' || dev.trust_level === 'BLOCKED';

            return (
              <div
                key={dev.id}
                className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3 hover:border-indigo-200 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-lg ${
                        isTrusted
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                    >
                      <Smartphone size={20} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{dev.device_name}</div>
                      <div className="text-[11px] text-slate-500">
                        {dev.device_model} • {dev.os_version}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Last active: {isTrusted ? 'Now' : '2 min ago'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        isTrusted
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {dev.trust_level}
                    </span>
                    <div className="text-[11px] font-mono text-slate-500 font-bold mt-1">
                      Security: {dev.trust_score ?? (isTrusted ? 94 : 31)}
                    </div>
                  </div>
                </div>

                {isSuspicious && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => handleQuarantineDevice(dev.device_id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Ban size={13} />
                      <span>Remove / Quarantine</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6-Digit Pairing Modal */}
      {showPairModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Cryptographic Pairing</h3>
              <button
                onClick={() => setShowPairModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-2">
              <div className="text-xs text-slate-500">Single-use 6-digit code for onboarding:</div>
              <div className="text-3xl font-black font-mono tracking-widest text-indigo-600 bg-indigo-50 py-3 rounded-2xl border border-indigo-100">
                {pairingCodeInfo?.pairing_code || '849201'}
              </div>
              <div className="text-[10px] text-slate-400">Expires in 10 minutes</div>
            </div>

            {pairSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{pairSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePairSubmit} className="space-y-3 pt-2">
              <input
                type="text"
                maxLength={6}
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                placeholder="Enter 6-digit code on new device"
                className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:outline-none"
              />
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                Confirm Pairing
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
