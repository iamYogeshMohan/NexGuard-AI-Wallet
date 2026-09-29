'use client';

import React from 'react';
import NexGuardMobileLayout from '@/app/mobile/layout';
import NexGuardMobileDashboard from '@/app/mobile/dashboard/page';

export default function CustomerHomePage() {
  return (
    <NexGuardMobileLayout>
      <NexGuardMobileDashboard />
    </NexGuardMobileLayout>
  );
}
