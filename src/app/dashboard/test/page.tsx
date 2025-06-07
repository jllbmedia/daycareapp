'use client';

import { useState } from 'react';
import { BulkCheckInOut } from '@/components/dashboard/BulkCheckInOut';
import { AttendanceReports } from '@/components/dashboard/AttendanceReports';
import { DailyActivities } from '@/components/dashboard/DailyActivities';
import { Messaging } from '@/components/dashboard/Messaging';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { CheckInForm } from '@/components/dashboard/CheckInForm';
import { Child } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { CheckInHistory } from '@/components/dashboard/CheckInHistory';

export default function TestPage() {
  const dummyParentId = 'test-parent-1';
  const dummyChild: Child = {
    id: 'test-child-1',
    firstName: 'Test',
    lastName: 'Child',
    dateOfBirth: '2020-01-01',
    parentId: 'test-parent-1',
    emergencyContacts: [],
    medicalInfo: {
      allergies: [],
      medications: [],
      conditions: [],
      notes: ''
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  return (
    <NotificationProvider>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Component Testing Page</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-xl font-semibold mb-4">Check-in Form</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <CheckInForm child={dummyChild} />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Check-in History</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <CheckInHistory child={dummyChild} limit={5} />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Daily Activities</h2>
            <div className="bg-white rounded-lg shadow p-6">
              <DailyActivities child={dummyChild} limit={5} />
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Bulk Check-In/Out</h2>
            <BulkCheckInOut parentId={dummyParentId} />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Attendance Reports</h2>
            <AttendanceReports />
          </section>

          <section className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Messaging</h2>
            <div className="h-[500px]">
              <Messaging
                recipientId={dummyParentId}
                recipientName="Test Parent"
              />
            </div>
          </section>
        </div>
      </div>
    </NotificationProvider>
  );
}