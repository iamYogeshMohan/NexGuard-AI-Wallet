'use client';

import React from 'react';
import NexGuardMobileLayout from '@/app/mobile/layout';
import MobileNotificationsPage from '@/app/mobile/notifications/page';

export default function NotificationsPage() {
  return (
    <NexGuardMobileLayout>
      <MobileNotificationsPage />
    </NexGuardMobileLayout>
  );
}
