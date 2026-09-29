'use client';

import React from 'react';
import NexGuardMobileLayout from '@/app/mobile/layout';
import CleanFintechTransactionsPage from '@/app/mobile/transactions/page';

export default function ActivityPage() {
  return (
    <NexGuardMobileLayout>
      <CleanFintechTransactionsPage />
    </NexGuardMobileLayout>
  );
}
