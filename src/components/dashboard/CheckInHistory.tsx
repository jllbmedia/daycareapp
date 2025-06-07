'use client';

import { useState, useEffect } from 'react';
import { Child, CheckInRecord } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy, limit, Timestamp, Firestore } from 'firebase/firestore';
import { format } from 'date-fns';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface CheckInHistoryProps {
  child: Child;
  limit?: number;
}

function CheckInHistoryContent({ child, limit: recordLimit = 10 }: CheckInHistoryProps) {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCheckIns = async () => {
      if (!db) {
        setError('Database is not initialized');
        setLoading(false);
        return;
      }

      const firestore = db as Firestore;

      try {
        setLoading(true);
        setError('');
        const checkInsRef = collection(firestore, 'checkIns');
        const q = query(
          checkInsRef,
          where('childId', '==', child.id),
          orderBy('checkInTime', 'desc'),
          limit(recordLimit)
        );
        
        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CheckInRecord[];
        
        setCheckIns(records);
      } catch (error) {
        console.error('Error fetching check-in history:', error);
        setError('Failed to load check-in history');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckIns();
  }, [child.id, recordLimit]);

  if (loading) {
    return <div>Loading check-in history...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (checkIns.length === 0) {
    return <div>No check-in records found</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Check-ins</h3>
      <div className="divide-y divide-gray-200">
        {checkIns.map(record => (
          <div key={record.id} className="py-3">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {format(record.checkInTime.toDate(), 'PPp')}
                </p>
                <p className="text-sm text-gray-500">
                  Dropped off by: {record.dropOffInfo.personName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {record.checkOutTime
                    ? `Checked out: ${format(record.checkOutTime.toDate(), 'p')}`
                    : 'Not checked out'}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CheckInHistory(props: CheckInHistoryProps) {
  return (
    <ErrorBoundary>
      <CheckInHistoryContent {...props} />
    </ErrorBoundary>
  );
} 