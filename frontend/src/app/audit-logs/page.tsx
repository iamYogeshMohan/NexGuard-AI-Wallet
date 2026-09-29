'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuditLogsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/soc?tab=audit-logs');
  }, [router]);
  return <div className="p-8 text-center text-xs text-slate-500 font-mono">Redirecting to Audit Logs...</div>;
}
