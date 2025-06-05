'use client';

import { BulkCheckInOut } from '@/components/dashboard/BulkCheckInOut';
import { AttendanceReports } from '@/components/dashboard/AttendanceReports';
import { DailyActivities } from '@/components/dashboard/DailyActivities';
import { Messaging } from '@/components/dashboard/Messaging';
import { NotificationProvider } from '@/components/notifications/NotificationProvider';
import { CheckInForm } from '@/components/dashboard/CheckInForm';
import { Child } from '@/types';
import { Timestamp } from 'firebase/firestore';

export default function TestPage() {
  const dummyParentId = 'test-parent-1';
  const dummyChildId = 'test-child-1';
  const dummyStaffId = 'staff123';
  const dummyChild: Child = {
    id: 'child123',
    firstName: 'Jane',
    lastName: 'Doe',
    dateOfBirth: '2020-01-01',
    parentId: 'parent123',
    emergencyContacts: [{
      name: 'John Doe',
      relationship: 'Father',
      phone: '123-456-7890',
      email: 'john@example.com'
    }],
    medicalInfo: {
      allergies: ['peanuts'],
      medications: [],
      conditions: [],
      notes: ''
    },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now()
  };

  return (
    <NotificationProvider>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Test Components</h1>

        <div className="grid grid-cols-1 gap-6">
          <section>
            <h2 className="text-xl font-semibold mb-4">Bulk Check-In/Out</h2>
            <BulkCheckInOut parentId={dummyParentId} />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Attendance Reports</h2>
            <AttendanceReports />
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4">Daily Activities</h2>
            <DailyActivities childId={dummyChildId} />
          </section>

          <section className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Check-In Form</h2>
            <CheckInForm child={dummyChild} onComplete={() => {}} />
          </section>

          <section className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Messaging</h2>
            <div className="h-[500px]">
              <Messaging
                recipientId={dummyStaffId}
                recipientName="John Doe"
              />
            </div>
          </section>
        </div>
      </div>
    </NotificationProvider>
  );
}