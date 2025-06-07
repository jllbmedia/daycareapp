'use client';

import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Child, CheckInRecord } from '@/types';
import { startOfDay, subDays, format } from 'date-fns';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface AttendanceData {
  date: string;
  totalCheckins: number;
  uniqueChildren: number;
  avgDuration: number;
}

interface ChildAttendance {
  childId: string;
  childName: string;
  totalVisits: number;
  avgDuration: number;
  lastVisit: Date | null;
}

export function AttendanceReports() {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<AttendanceData[]>([]);
  const [childrenStats, setChildrenStats] = useState<ChildAttendance[]>([]);
  const [dateRange, setDateRange] = useState<'week' | 'month'>('week');
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchAttendanceData = useCallback(async () => {
    if (!user) return;
    
    try {
      if (!db) throw new Error('Firestore is not initialized');
      setLoading(true);
      setError(null);

      const days = dateRange === 'week' ? 7 : 30;
      const startDate = startOfDay(subDays(new Date(), days));
      const endDate = new Date();
      
      const firestore = db as Firestore;
      // Fetch all check-ins for the period
      const checkInsRef = collection(firestore, 'checkIns');
      const q = query(
        checkInsRef,
        where('checkInTime', '>=', Timestamp.fromDate(startDate)),
        where('checkInTime', '<=', Timestamp.fromDate(endDate))
      );
      
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CheckInRecord[];

      // Fetch all children
      const childrenRef = collection(firestore, 'children');
      const childrenSnapshot = await getDocs(childrenRef);
      const children = new Map(
        childrenSnapshot.docs.map(doc => [
          doc.id,
          { id: doc.id, ...doc.data() } as Child
        ])
      );

      // Process daily attendance
      const dailyMap = new Map<string, AttendanceData>();
      const childAttendance = new Map<string, ChildAttendance>();

      records.forEach(record => {
        const date = format(record.checkInTime.toDate(), 'yyyy-MM-dd');
        const child = children.get(record.childId);
        
        if (!child) return;

        // Update daily stats
        const dailyStats = dailyMap.get(date) || {
          date,
          totalCheckins: 0,
          uniqueChildren: 0,
          avgDuration: 0
        };

        dailyStats.totalCheckins++;
        dailyMap.set(date, dailyStats);

        // Update child stats
        const childStats = childAttendance.get(record.childId) || {
          childId: record.childId,
          childName: `${child.firstName} ${child.lastName}`,
          totalVisits: 0,
          avgDuration: 0,
          lastVisit: null
        };

        childStats.totalVisits++;
        
        if (record.checkOutTime) {
          const duration = record.checkOutTime.toDate().getTime() - record.checkInTime.toDate().getTime();
          childStats.avgDuration = (childStats.avgDuration * (childStats.totalVisits - 1) + duration) / childStats.totalVisits;
        }

        const visitDate = record.checkInTime.toDate();
        if (!childStats.lastVisit || visitDate > childStats.lastVisit) {
          childStats.lastVisit = visitDate;
        }

        childAttendance.set(record.childId, childStats);
      });

      setDailyData(Array.from(dailyMap.values()));
      setChildrenStats(Array.from(childAttendance.values()));
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance data');
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, user]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Reports</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              dateRange === 'week'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last Week
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              dateRange === 'month'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Last Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Overview</h3>
          <div className="space-y-4">
            {dailyData.map(day => (
              <div key={day.date} className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-900">
                    {format(new Date(day.date), 'MMMM d, yyyy')}
                  </h4>
                  <span className="text-sm text-gray-500">
                    {day.totalCheckins} check-ins
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Unique Children</p>
                    <p className="text-lg font-medium text-gray-900">{day.uniqueChildren}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg Duration</p>
                    <p className="text-lg font-medium text-gray-900">
                      {Math.round(day.avgDuration / (1000 * 60 * 60))}h
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Child Attendance</h3>
          <div className="space-y-4">
            {childrenStats.map(child => (
              <div key={child.childId} className="border-b pb-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-gray-900">{child.childName}</h4>
                  <span className="text-sm text-gray-500">
                    {child.totalVisits} visits
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Avg Duration</p>
                    <p className="text-lg font-medium text-gray-900">
                      {Math.round(child.avgDuration / (1000 * 60 * 60))}h
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Visit</p>
                    <p className="text-lg font-medium text-gray-900">
                      {child.lastVisit ? format(child.lastVisit, 'MMM d') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 