'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Send,
  QrCode,
  Shield,
  ExternalLink,
  Sliders,
} from 'lucide-react';

export default function WalletLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', href: '/wallet', icon: Home },
    { label: 'Pay', href: '/wallet/send', icon: Send },
    { label: 'Receive', href: '/wallet/receive', icon: QrCode },
    { label: 'Security', href: '/wallet/security', icon: Shield },
  ];

  return (
    <div className="w-full min-h-[100dvh] bg-[#F8FAFC] text-slate-900 flex flex-col items-center justify-start p-0">
      <style>{`
        @media (max-width: 767px) {
          .wallet-simulator-shell {
            width: 100% !important;
            max-width: 100% !important;
            min-height: 100dvh !important;
            border-radius: 0 !important;
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          .wallet-bottom-nav {
            width: 100% !important;
            left: 0 !important;
            transform: none !important;
          }
        }
        @media (min-width: 768px) {
          .wallet-simulator-shell {
            max-width: 500px;
            min-height: 100dvh;
            border-left: 1px solid #E2E8F0;
            border-right: 1px solid #E2E8F0;
            box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          }
          .wallet-bottom-nav {
            max-width: 500px;
            left: 50% !important;
            transform: translateX(-50%) !important;
            border-left: 1px solid #E2E8F0;
            border-right: 1px solid #E2E8F0;
          }
        }
      `}</style>

      {/* Main Full Screen Container */}
      <div className="wallet-simulator-shell w-full flex flex-col flex-1 relative bg-[#F8FAFC] overflow-x-hidden">
        {/* Dynamic Page Content */}
        <div className="flex-1 overflow-y-auto px-0 py-0 pb-20">
          {children}
        </div>

        {/* Bottom Navigation Bar */}
        <nav className="wallet-bottom-nav fixed bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                  isActive
                    ? 'text-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition ${
                    isActive ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  <Icon size={18} />
                </div>
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
