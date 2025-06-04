'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Child, CheckInRecord } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
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

interface ValidationErrors {
  checkInTime?: string;
  checkOutTime?: string;
}

export function CheckInHistoryContent({ child, onClose }: CheckInHistoryProps) {
  const { user } = useAuth();
  const [checkIns, setCheckIns] = useState<EditableCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingRecord, setEditingRecord] = useState<EditableCheckIn | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCheckIns();
  }, [child.id]);

  const fetchCheckIns = async () => {
    try {
      setLoading(true);
      setError('');
      const checkInsRef = collection(db, 'checkIns');
      const q = query(
        checkInsRef,
        where('childId', '==', child.id),
        orderBy('checkInTime', 'desc'),
        limit(30)
      );
      
      const querySnapshot = await getDocs(q);
      const checkInData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isEditing: false
      })) as EditableCheckIn[];
      
      // Check for any active check-ins (no check-out time)
      const activeCheckIns = checkInData.filter(record => !record.checkOutTime);
      if (activeCheckIns.length > 0) {
        console.log('Found active check-ins:', activeCheckIns.length);
        toast(`${child.firstName} has ${activeCheckIns.length} active check-in${activeCheckIns.length === 1 ? '' : 's'}`, {
          duration: 5000,
          icon: 'ℹ️',
          style: {
            background: '#EFF6FF',
            color: '#1E40AF',
            border: '1px solid #93C5FD'
          }
        });
      }
      
      setCheckIns(checkInData);
      toast.success('Check-in history loaded successfully');
    } catch (err) {
      console.error('Error fetching check-in history:', err);
      setError('Failed to load check-in history');
      toast.error('Failed to load check-in history');
    } finally {
      setLoading(false);
    }
  };

  const validateDates = (checkInTime: Date, checkOutTime: Date | null): ValidationErrors => {
    const errors: ValidationErrors = {};
    const now = new Date();

    if (checkInTime > now) {
      errors.checkInTime = 'Check-in time cannot be in the future';
    }

    if (checkOutTime) {
      if (checkOutTime > now) {
        errors.checkOutTime = 'Check-out time cannot be in the future';
      }
      if (checkOutTime < checkInTime) {
        errors.checkOutTime = 'Check-out time must be after check-in time';
      }
    }

    return errors;
  };

  const handleEdit = (record: EditableCheckIn) => {
    setEditingRecord(record);
    setValidationErrors({});
  };

  const handleSave = async () => {
    if (!editingRecord) return;

    try {
      const checkInTime = new Date(editingRecord.checkInTime);
      const checkOutTime = editingRecord.checkOutTime ? new Date(editingRecord.checkOutTime) : null;

      // Validate dates
      const errors = validateDates(checkInTime, checkOutTime);
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        return;
      }

      setIsSaving(true);
      await updateDoc(doc(db, 'checkIns', editingRecord.id), {
        ...editingRecord,
        checkInTime,
        checkOutTime,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid,
        isEditing: undefined // Remove the UI-only field
      });

      // Refresh the list
      await fetchCheckIns();
      setEditingRecord(null);
      toast.success('Check-in record updated successfully');
    } catch (err) {
      console.error('Error updating check-in record:', err);
      setError('Failed to update record');
      toast.error('Failed to update record');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toISOString().slice(0, 16); // Format for datetime-local input
  };

  const formatDisplayDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
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

        <div className="space-y-4">
          {checkIns.map((record) => (
            <div
              key={record.id}
              className={`p-4 rounded-lg border ${
                record.checkOutTime
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              {editingRecord?.id === record.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-in Time</label>
                    <input
                      type="datetime-local"
                      value={formatDate(editingRecord.checkInTime)}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord,
                        checkInTime: new Date(e.target.value)
                      })}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
                        ${validationErrors.checkInTime 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                        }`}
                    />
                    {validationErrors.checkInTime && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.checkInTime}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Check-out Time</label>
                    <input
                      type="datetime-local"
                      value={editingRecord.checkOutTime ? formatDate(editingRecord.checkOutTime) : ''}
                      onChange={(e) => setEditingRecord({
                        ...editingRecord,
                        checkOutTime: e.target.value ? new Date(e.target.value) : null
                      })}
                      className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm
                        ${validationErrors.checkOutTime 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                        }`}
                    />
                    {validationErrors.checkOutTime && (
                      <p className="mt-1 text-sm text-red-600">{validationErrors.checkOutTime}</p>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setEditingRecord(null);
                        setValidationErrors({});
                      }}
                      disabled={isSaving}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <LoadingSpinner size="sm" variant="white" />
                          <span className="ml-2">Saving...</span>
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        Check-in: {formatDisplayDate(record.checkInTime)}
                      </p>
                      <p className={`text-sm ${record.checkOutTime ? 'text-gray-500' : 'text-yellow-600 font-medium'}`}>
                        {record.checkOutTime 
                          ? `Check-out: ${formatDisplayDate(record.checkOutTime)}`
                          : '⚠️ Not checked out yet'}
                      </p>
                      {record.checkOutTime && record.pickUpInfo && (
                        <div className="mt-2 text-sm text-gray-600">
                          <p>Picked up by: {record.pickUpInfo.personName} ({record.pickUpInfo.relationship})</p>
                          {record.pickUpInfo.notes && (
                            <p className="mt-1">Notes: {record.pickUpInfo.notes}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => handleEdit(record)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                      Edit
                    </button>
                  </div>
                  {record.healthStatus?.hasFever && (
                    <div className="mt-2 flex items-center text-red-600">
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-sm">Fever recorded: {record.healthStatus.temperature}°F</span>
                    </div>
                  )}
                  {record.healthStatus?.symptoms?.length > 0 && (
                    <p className="text-sm text-gray-600">
                      Symptoms: {record.healthStatus.symptoms.join(', ')}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
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