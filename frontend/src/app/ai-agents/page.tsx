'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AIAgentsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/soc?tab=ai-agents');
  }, [router]);
  return <div className="p-8 text-center text-xs text-slate-500 font-mono">Redirecting to 10 AI Agents...</div>;
}
