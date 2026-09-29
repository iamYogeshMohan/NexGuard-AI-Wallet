'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/soc?tab=overview');
  }, [router]);
  return <div className="p-8 text-center text-xs text-slate-500 font-mono">Redirecting to SOC Command Center...</div>;
}
