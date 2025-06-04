'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { format, subDays, startOfDay, endOfDay } from 'date-fns'; // ✅ Only once, all together
import { db } from '@/lib/firebase';
import { Child, CheckInRecord } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AttendanceData {
  date: string;
  totalCheckins: number;
  avgDuration: number;
  childrenPresent: string[];
}

interface ChildAttendance {
  childId: string;
  firstName: string;
  lastName: string;
  totalDays: number;
  avgDuration: number;
  lastCheckIn: Date | null;
}

export function AttendanceReports() {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState<AttendanceData[]>([]);
  const [childrenStats, setChildrenStats] = useState<ChildAttendance[]>([]);
  const [dateRange, setDateRange] = useState<'week' | 'month'>('week');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendanceData();
  }, [dateRange]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const days = dateRange === 'week' ? 7 : 30;
      const startDate = startOfDay(subDays(new Date(), days));
      
      // Fetch all check-ins for the period
      const checkInsRef = collection(db, 'checkIns');
      const q = query(
        checkInsRef,
        where('checkInTime', '>=', Timestamp.fromDate(startDate)),
        orderBy('checkInTime', 'desc')
      );
      
      const checkInsSnapshot = await getDocs(q);
      const checkIns = checkInsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CheckInRecord[];

      // Fetch all children
      const childrenRef = collection(db, 'children');
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

      checkIns.forEach(checkIn => {
        const child = children.get(checkIn.childId);
        if (!child) return;

        const date = format(checkIn.checkInTime.toDate(), 'yyyy-MM-dd');
        const duration = checkIn.checkOutTime
          ? (checkIn.checkOutTime.toDate().getTime() - checkIn.checkInTime.toDate().getTime()) / (1000 * 60 * 60)
          : 0;

        // Update daily stats
        const dayData = dailyMap.get(date) || {
          date,
          totalCheckins: 0,
          avgDuration: 0,
          childrenPresent: []
        };

        dayData.totalCheckins++;
        dayData.avgDuration = ((dayData.avgDuration * (dayData.totalCheckins - 1)) + duration) / dayData.totalCheckins;
        if (!dayData.childrenPresent.includes(child.firstName)) {
          dayData.childrenPresent.push(child.firstName);
        }
        dailyMap.set(date, dayData);

        // Update child stats
        const childStats = childAttendance.get(child.id) || {
          childId: child.id,
          firstName: child.firstName,
          lastName: child.lastName,
          totalDays: 0,
          avgDuration: 0,
          lastCheckIn: null
        };

        childStats.totalDays++;
        childStats.avgDuration = ((childStats.avgDuration * (childStats.totalDays - 1)) + duration) / childStats.totalDays;
        childStats.lastCheckIn = checkIn.checkInTime.toDate();
        childAttendance.set(child.id, childStats);
      });

      setDailyData(Array.from(dailyMap.values()));
      setChildrenStats(Array.from(childAttendance.values()));
    } catch (err) {
      console.error('Error fetching attendance data:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <LoadingSpinner text="Loading attendance data..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Attendance Reports</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setDateRange('week')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              dateRange === 'week'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDateRange('month')}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              dateRange === 'month'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Attendance Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Attendance</h3>
          <div className="space-y-4">
            {dailyData.map(day => (
              <div key={day.date} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{format(new Date(day.date), 'MMM d, yyyy')}</span>
                  <span className="text-sm text-gray-500">{day.totalCheckins} check-ins</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Average duration: {day.avgDuration.toFixed(1)} hours</p>
                  <p>Children present: {day.childrenPresent.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Child Statistics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Child Statistics</h3>
          <div className="space-y-4">
            {childrenStats.map(stat => (
              <div key={stat.childId} className="border-b border-gray-200 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{stat.firstName} {stat.lastName}</span>
                  <span className="text-sm text-gray-500">{stat.totalDays} days attended</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Average daily duration: {stat.avgDuration.toFixed(1)} hours</p>
                  <p>Last check-in: {stat.lastCheckIn ? format(stat.lastCheckIn, 'MMM d, yyyy') : 'N/A'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 