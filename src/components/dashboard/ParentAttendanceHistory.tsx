'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Child, CheckInRecord } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { EditAttendanceModal } from './EditAttendanceModal';

interface AttendanceRecord extends CheckInRecord {
  childName?: string;
}

export function ParentAttendanceHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [error, setError] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    fetchChildrenAndAttendance();
  }, [user?.uid]);

  const fetchChildrenAndAttendance = async () => {
    try {
      setLoading(true);
      setError('');

      // First, fetch all children for the parent
      const childrenRef = collection(db, 'children');
      const childrenQuery = query(childrenRef, where('parentId', '==', user?.uid));
      const childrenSnapshot = await getDocs(childrenQuery);
      const childrenData = childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Child));
      setChildren(childrenData);

      // Then, fetch all check-in records for these children
      const checkInsRef = collection(db, 'checkIns');
      const childIds = childrenData.map(child => child.id);
      const checkInsQuery = query(
        checkInsRef,
        where('childId', 'in', childIds),
        orderBy('checkInTime', 'desc')
      );
      const checkInsSnapshot = await getDocs(checkInsQuery);
      
      // Combine check-in records with child names
      const records = checkInsSnapshot.docs.map(doc => {
        const data = doc.data();
        const child = childrenData.find(c => c.id === data.childId);
        return {
          ...data,
          id: doc.id,
          childName: child ? `${child.firstName} ${child.lastName}` : 'Unknown Child',
          // Ensure all required fields exist with default values
          dropOffInfo: data.dropOffInfo || {
            personName: '',
            relationship: '',
            signature: '',
            notes: ''
          },
          pickUpInfo: data.pickUpInfo || null,
          healthStatus: data.healthStatus || {
            hasFever: false,
            temperature: null,
            symptoms: [],
            medications: []
          },
          meals: data.meals || {
            breakfast: false,
            lunch: false,
            snack: false
          },
          concerns: data.concerns || null
        } as AttendanceRecord;
      });

      setAttendanceRecords(records);
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError('Failed to load attendance history');
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return format(date, 'MMM d, yyyy h:mm a');
  };

  const handleEdit = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setIsEditModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoadingSpinner text="Loading attendance history..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Attendance History</h2>
        <button
          onClick={() => fetchChildrenAndAttendance()}
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
              {attendanceRecords.map((record) => (
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

      {attendanceRecords.length === 0 && (
        <div className="text-center py-8 bg-white rounded-lg">
          <p className="text-gray-500">No attendance records found</p>
        </div>
      )}

      {isEditModalOpen && selectedRecord && (
        <EditAttendanceModal
          record={selectedRecord}
          onClose={() => setIsEditModalOpen(false)}
          onUpdate={fetchChildrenAndAttendance}
        />
      )}
    </div>
  );
} 