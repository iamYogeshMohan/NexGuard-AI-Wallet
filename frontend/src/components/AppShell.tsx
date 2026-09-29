'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import SideMenu from './SideMenu';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const customerRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/otp',
    '/home',
    '/activity',
    '/send',
    '/receive',
    '/scan',
    '/add-money',
    '/security',
    '/devices',
    '/beneficiaries',
    '/notifications',
    '/profile',
    '/mobile',
    '/wallet',
  ];
  const isMobileRoute = customerRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isLiveDemo = pathname.startsWith('/live-demo');

  // Full-width shell for live demo
  if (isLiveDemo) {
    return (
      <div
        className="w-full min-h-screen transition-colors duration-200"
        style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
      >
        {children}
      </div>
    );
  }

  // Mobile Wallet Route: Edge-to-edge full-screen, no desktop sidebar
  if (isMobileRoute) {
    return (
      <div
        className="mobile-wallet-shell w-full min-h-[100dvh] flex flex-col transition-colors duration-200"
        style={{
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </div>
    );
  }

  const isServerRoute = pathname.startsWith('/server');

  // Desktop / Command Center / SOC Platform routes
  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <SideMenu />

      {/* Main Content — offset 260px only on desktop (lg: 1024px+), 0 on mobile/tablet */}
      <div
        className="main-content flex flex-col min-h-screen lg:ml-[260px] ml-0 transition-all duration-150"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-base)',
          color: 'var(--text-primary)',
        }}
      >
        {children}
      </div>
    </>
  );
}
