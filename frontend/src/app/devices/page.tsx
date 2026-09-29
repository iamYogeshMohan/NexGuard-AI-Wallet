'use client';

import React from 'react';
import NexGuardMobileLayout from '@/app/mobile/layout';
import CleanFintechDevicesPage from '@/app/mobile/devices/page';

export default function DevicesPage() {
  return (
    <NexGuardMobileLayout>
      <CleanFintechDevicesPage />
    </NexGuardMobileLayout>
  );
}
