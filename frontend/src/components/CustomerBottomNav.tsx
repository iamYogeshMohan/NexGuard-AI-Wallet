'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, History, Send, ShieldCheck, User } from 'lucide-react';

export default function CustomerBottomNav() {
  const pathname = usePathname() || '';

  const navItems = [
    { label: 'Home', href: '/home', icon: Home, match: ['/home', '/mobile/dashboard'] },
    { label: 'Activity', href: '/activity', icon: History, match: ['/activity', '/mobile/transactions'] },
    { label: 'Pay', href: '/send', icon: Send, isAction: true, match: ['/send', '/scan', '/mobile/send-money'] },
    { label: 'Security', href: '/security', icon: ShieldCheck, match: ['/security', '/mobile/security', '/devices'] },
    { label: 'Profile', href: '/profile', icon: User, match: ['/profile'] },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 transition-colors duration-200"
      style={{
        background: 'var(--bg-overlay)',
        borderTop: '1px solid var(--border-subtle)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        paddingBottom: 'env(safe-area-inset-bottom, 8px)',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.match.some((m) => pathname.startsWith(m));
          const Icon = item.icon;

          if (item.isAction) {
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex flex-col items-center -mt-6 group"
              >
                <div
                  className="w-13 h-13 rounded-full flex items-center justify-center text-white shadow-lg transition-transform active:scale-95"
                  style={{
                    backgroundColor: '#2563eb',
                    boxShadow: '0 8px 18px rgba(37, 99, 235, 0.35)',
                  }}
                >
                  <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                </div>
                <span className="text-[11px] font-semibold text-blue-600 mt-1">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center py-1 px-3 transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
