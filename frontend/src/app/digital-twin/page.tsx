'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DigitalTwinRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/soc?tab=digital-twin');
  }, [router]);
  return <div className="p-8 text-center text-xs text-slate-500 font-mono">Redirecting to Digital Twin Profile...</div>;
}
