'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Copy, Check, QrCode, Share2, Sparkles, Smartphone } from 'lucide-react';

export default function ReceivePage() {
  const router = useRouter();
  const upiId = 'karthik@nexguard';
  const [amount, setAmount] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const qrValue = amount && parseFloat(amount) > 0
    ? `upi://pay?pa=${upiId}&pn=Karthik%20Nair&am=${amount}&cu=INR`
    : `upi://pay?pa=${upiId}&pn=Karthik%20Nair&cu=INR`;

  const handleCopy = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          <h1 className="text-base font-extrabold text-white">Receive Money</h1>
          <p className="text-[11px] text-slate-400 font-mono">Scan QR or Share UPI ID</p>
        </div>
      </div>

      {/* QR Code Container */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-xl">
        <div className="flex items-center justify-center gap-2 text-xs text-sky-400 font-bold">
          <Sparkles size={14} />
          <span>Zero-Fee Instant UPI QR</span>
        </div>

        <div className="p-4 bg-white rounded-2xl w-fit mx-auto shadow-md">
          <QRCodeSVG value={qrValue} size={200} level="H" includeMargin={true} />
        </div>

        <div>
          <div className="text-sm font-bold text-white">Karthik Nair</div>
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
              {upiId}
            </span>
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              title="Copy UPI ID"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Set Specific Amount */}
        <div className="pt-2 border-t border-slate-800/80">
          <label className="text-[11px] text-slate-400 font-semibold block mb-1">
            REQUEST SPECIFIC AMOUNT (OPTIONAL)
          </label>
          <div className="relative max-w-xs mx-auto">
            <span className="absolute left-3 top-2 text-slate-400 font-bold">₹</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500"
              className="w-full pl-7 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-center focus:border-sky-500 focus:outline-none text-sm"
            />
          </div>
        </div>
      </div>

      {/* Banking & Security Assurance Note */}
      <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <div className="font-bold text-slate-300 flex items-center gap-1.5">
          <Smartphone size={13} className="text-sky-400" />
          <span>Inbound Fraud Shield Active</span>
        </div>
        <p className="text-[10px] text-slate-500">
          All incoming payments are verified against NexGuard Money Mule and Darknet Beneficiary watchlists in real time.
        </p>
      </div>
    </div>
  );
}
