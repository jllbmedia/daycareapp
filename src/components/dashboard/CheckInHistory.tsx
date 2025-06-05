'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Child, CheckInRecord } from '@/types';
import { toast } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface CheckInHistoryProps {
  child: Child;
  onClose: () => void;
}

interface EditableCheckIn extends CheckInRecord {
  isEditing?: boolean;
}

export function CheckInHistoryContent({ child, onClose }: CheckInHistoryProps) {
  const [checkIns, setCheckIns] = useState<EditableCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCheckIns = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const checkInsRef = collection(db, 'checkIns');
      const q = query(
        checkInsRef,
        where('childId', '==', child.id),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const checkInData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isEditing: false
      })) as EditableCheckIn[];
      
      setCheckIns(checkInData);
      toast.success('Check-in history loaded successfully');
    } catch (err) {
      console.error('Error fetching check-in history:', err);
      setError('Failed to load check-in history');
      toast.error('Failed to load check-in history');
    } finally {
      setLoading(false);
    }
  }, [child.id]);

  useEffect(() => {
    fetchCheckIns();
  }, [fetchCheckIns]);

  const formatDisplayDate = (timestamp: Timestamp | null) => {
    if (!timestamp) return 'N/A';
    return timestamp.toDate().toLocaleString();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-xl text-center">
          <LoadingSpinner size="lg" text="Loading check-in history..." />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-6 border w-full max-w-2xl shadow-lg rounded-lg bg-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Check-in History for {child.firstName}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="mt-4">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-in Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Check-out Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {checkIns.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDisplayDate(record.checkInTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDisplayDate(record.checkOutTime)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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