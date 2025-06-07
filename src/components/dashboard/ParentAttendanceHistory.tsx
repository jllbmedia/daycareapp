'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp, doc, getDoc, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { CheckInRecord, Child } from '@/types';
import toast from 'react-hot-toast';
import { EditAttendanceModal } from './EditAttendanceModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

interface AttendanceData {
  [key: string]: (CheckInRecord & { childName?: string })[];
}

export function ParentAttendanceHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<CheckInRecord | null>(null);

  const fetchChildrenAndAttendance = useCallback(async () => {
    if (!user?.uid) return;

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
        where('parentId', '==', user.uid),
        orderBy('checkInTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const records = await Promise.all(
        querySnapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          // Fetch child data
          const childDocRef = doc(firestore, 'children', data.childId);
          const childDoc = await getDoc(childDocRef);
          const childData = childDoc.data() as Child;
          return {
            ...data,
            id: docSnapshot.id,
            checkInTime: data.checkInTime as Timestamp,
            checkOutTime: data.checkOutTime as Timestamp | null,
            childName: childData ? `${childData.firstName} ${childData.lastName}` : 'Unknown Child'
          } as CheckInRecord & { childName: string };
        })
      );

      setAttendanceData({
        [user.uid]: records
      });
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError('Failed to load attendance history');
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchChildrenAndAttendance();
  }, [fetchChildrenAndAttendance]);

  const handleEditRecord = (record: CheckInRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  const handleUpdateRecord = (updatedRecord: CheckInRecord) => {
    setAttendanceData(prev => ({
      ...prev,
      [user?.uid || '']: prev[user?.uid || ''].map(record =>
        record.id === updatedRecord.id ? { ...record, ...updatedRecord } : record
      )
    }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  const records = user?.uid ? attendanceData[user.uid] || [] : [];

  if (records.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No attendance records found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900">Attendance History</h2>
      <div className="grid gap-4">
        {records.map((record) => (
          <div key={record.id} className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {record.childName}
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
              <button
                onClick={() => handleEditRecord(record)}
                className="text-sm text-indigo-600 hover:text-indigo-900"
              >
                Edit
              </button>
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
          </div>
        ))}
      </div>

      {isEditModalOpen && selectedRecord && (
        <EditAttendanceModal
          record={selectedRecord}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRecord(null);
          }}
          onUpdate={handleUpdateRecord}
        />
      )}
    </div>
  );
} 