'use client';

import { useState, useEffect } from 'react';
import { Child, CheckInRecord } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, Firestore } from 'firebase/firestore';
import { format } from 'date-fns';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface CheckInHistoryProps {
  child: Child;
  limit?: number;
}

export function CheckInHistory({ child, limit: recordLimit = 10 }: CheckInHistoryProps) {
  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!db) {
        setError('Database not initialized');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const firestore = db as Firestore;
        const checkInsRef = collection(firestore, 'checkIns');
        const q = query(
          checkInsRef,
          where('childId', '==', child.id),
          orderBy('checkInTime', 'desc'),
          limit(recordLimit)
        );

        const querySnapshot = await getDocs(q);
        const checkInRecords = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CheckInRecord[];

        setRecords(checkInRecords);
      } catch (err) {
        console.error('Error fetching check-in history:', err);
        setError('Failed to load check-in history');
        toast.error('Failed to load check-in history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [child.id, recordLimit]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (records.length === 0) {
    return <div className="text-gray-500">No check-in history available</div>;
  }

  return (
    <div className="space-y-4">
      {records.map((record) => (
        <div key={record.id} className="bg-white shadow rounded-lg p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {record.checkOutTime ? 'Completed Visit' : 'Active Visit'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Check-in: {format(record.checkInTime.toDate(), 'PPp')}
              </p>
              {record.checkOutTime && (
                <p className="mt-1 text-sm text-gray-500">
                  Check-out: {format(record.checkOutTime.toDate(), 'PPp')}
                </p>
              )}
            </div>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full ${
                record.checkOutTime
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {record.checkOutTime ? 'Completed' : 'Active'}
            </span>
          </div>

          {record.dropOffInfo && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900">Drop-off Information</h4>
              <p className="mt-1 text-sm text-gray-500">
                By: {record.dropOffInfo.personName} ({record.dropOffInfo.relationship})
              </p>
              {record.dropOffInfo.notes && (
                <p className="mt-1 text-sm text-gray-500">Notes: {record.dropOffInfo.notes}</p>
              )}
            </div>
          )}

          {record.healthStatus && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900">Health Status</h4>
              {record.healthStatus.hasFever && (
                <p className="mt-1 text-sm text-red-600">
                  Temperature: {record.healthStatus.temperature}°F
                </p>
              )}
              {record.healthStatus.symptoms.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Symptoms: {record.healthStatus.symptoms.join(', ')}
                </p>
              )}
              {record.healthStatus.medications.length > 0 && (
                <p className="mt-1 text-sm text-gray-500">
                  Medications: {record.healthStatus.medications.join(', ')}
                </p>
              )}
            </div>
          )}

          {record.concerns && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900">Concerns</h4>
              <p className="mt-1 text-sm text-gray-500">{record.concerns}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 