'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CopilotRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/soc?tab=copilot');
  }, [router]);
  return <div className="p-8 text-center text-xs text-slate-500 font-mono">Redirecting to AI Security Copilot...</div>;
}
