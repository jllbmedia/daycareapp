'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { AttendanceRecord } from '@/types';
import toast from 'react-hot-toast';
import { EditAttendanceModal } from './EditAttendanceModal';

interface AttendanceData {
  [key: string]: AttendanceRecord[];
}

export function ParentAttendanceHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  const fetchChildrenAndAttendance = useCallback(async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      setError(null);

      const checkInsRef = collection(db, 'checkIns');
      const q = query(
        checkInsRef,
        where('parentId', '==', user.uid),
        orderBy('checkInTime', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AttendanceRecord[];

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

  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    return timestamp.toDate().toLocaleString();
  };

  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!user?.uid || !attendanceData[user.uid]?.length) {
    return (
      <div className="bg-white shadow rounded-lg p-4">
        <p className="text-gray-500 text-center">No attendance records found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Attendance History</h2>
        <button
          onClick={fetchChildrenAndAttendance}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Refresh
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Child
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Drop-off By
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pick-up By
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Health Notes
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {user?.uid && attendanceData[user.uid]?.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {record.childName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(record.checkInTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.dropOffInfo?.personName} ({record.dropOffInfo?.relationship})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {record.pickUpInfo ? (
                      <>{record.pickUpInfo.personName} ({record.pickUpInfo.relationship})</>
                    ) : (
                      'Not picked up yet'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      record.checkOutTime 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.checkOutTime ? 'Completed' : 'Checked In'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {record.healthStatus.hasFever && (
                      <div className="text-red-600">
                        Fever: {record.healthStatus.temperature}°F
                      </div>
                    )}
                    {record.healthStatus.symptoms.length > 0 && (
                      <div>Symptoms: {record.healthStatus.symptoms.join(', ')}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isEditModalOpen && selectedRecord && (
        <EditAttendanceModal
          record={selectedRecord}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={(updatedRecord) => {
            setAttendanceData(prev => ({
              ...prev,
              [user.uid]: prev[user.uid].map(record =>
                record.id === updatedRecord.id ? updatedRecord : record
              )
            }));
            setIsEditModalOpen(false);
          }}
        />
      )}
    </div>
  );
} 