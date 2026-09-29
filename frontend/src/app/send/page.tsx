'use client';

import React, { Suspense } from 'react';
import NexGuardMobileLayout from '@/app/mobile/layout';
import GPaySendPage from '@/app/wallet/send/page';

export default function SendPage() {
  return (
    <NexGuardMobileLayout>
      <Suspense fallback={<div className="p-4 text-center text-xs text-slate-500">Loading...</div>}>
        <GPaySendPage />
      </Suspense>
    </NexGuardMobileLayout>
  );
}
