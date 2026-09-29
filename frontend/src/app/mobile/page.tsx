'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MobileRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mobile/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[300px] text-xs text-slate-400 font-mono">
      Loading NexGuard Secure Wallet...
    </div>
  );
}
