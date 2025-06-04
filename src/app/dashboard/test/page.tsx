'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { BulkCheckInOut } from '@/components/dashboard/BulkCheckInOut';
import { AttendanceReports } from '@/components/dashboard/AttendanceReports';
import { DailyActivities } from '@/components/dashboard/DailyActivities';
import { Messaging } from '@/components/dashboard/Messaging';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export default function TestPage() {
  const dummyParentId = 'test-parent-1';
  const dummyChildId = 'test-child-1';
  const dummyStaffId = 'test-staff-1';

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header with Notification Bell */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Feature Testing</h1>
            <NotificationBell />
          </div>

          <div className="space-y-8">
            {/* Bulk Check-in/out */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Bulk Check-in/out</h2>
              <BulkCheckInOut
                parentId={dummyParentId}
                onComplete={() => console.log('Bulk action completed')}
              />
            </div>

            {/* Attendance Reports */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance Reports</h2>
              <AttendanceReports />
            </div>

            {/* Daily Activities */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Daily Activities</h2>
              <DailyActivities childId={dummyChildId} />
            </div>

            {/* Messaging */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Messaging</h2>
              <Messaging
                recipientId={dummyStaffId}
                recipientName="John Doe"
                recipientRole="staff"
              />
            </div>
          </div>
        </div>
      </div>
    </NotificationProvider>
  );
}
