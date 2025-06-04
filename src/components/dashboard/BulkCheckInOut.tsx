import { useState, useEffect } from 'react';
import { Child, CheckInRecord } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

interface BulkCheckInOutProps {
  parentId: string;
  onComplete: () => void;
}

interface ChildStatus {
  child: Child;
  isCheckedIn: boolean;
  activeCheckIn: CheckInRecord | null;
  selected: boolean;
}

export function BulkCheckInOut({ parentId, onComplete }: BulkCheckInOutProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [children, setChildren] = useState<ChildStatus[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChildren();
  }, [parentId]);

  const fetchChildren = async () => {
    try {
      setLoading(true);
      // Fetch all children for the parent
      const childrenRef = collection(db, 'children');
      const childrenQuery = query(childrenRef, where('parentId', '==', parentId));
      const childrenSnapshot = await getDocs(childrenQuery);
      
      // Fetch check-in status for each child
      const childrenData = await Promise.all(
        childrenSnapshot.docs.map(async (doc) => {
          const child = { id: doc.id, ...doc.data() } as Child;
          
          // Check if child is already checked in
          const checkInsRef = collection(db, 'checkIns');
          const checkInQuery = query(
            checkInsRef,
            where('childId', '==', child.id),
            where('checkOutTime', '==', null)
          );
          const checkInSnapshot = await getDocs(checkInQuery);
          
          const activeCheckIn = !checkInSnapshot.empty
            ? { id: checkInSnapshot.docs[0].id, ...checkInSnapshot.docs[0].data() } as CheckInRecord
            : null;

          return {
            child,
            isCheckedIn: !checkInSnapshot.empty,
            activeCheckIn,
            selected: false
          };
        })
      );

      setChildren(childrenData);
    } catch (err) {
      console.error('Error fetching children:', err);
      setError('Failed to load children data');
      toast.error('Failed to load children data');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (selected: boolean) => {
    setChildren(prev => prev.map(child => ({ ...child, selected })));
  };

  const handleToggleChild = (childId: string) => {
    setChildren(prev =>
      prev.map(child =>
        child.child.id === childId
          ? { ...child, selected: !child.selected }
          : child
      )
    );
  };

  const handleBulkAction = async (action: 'check-in' | 'check-out') => {
    try {
      setProcessing(true);
      const selectedChildren = children.filter(c => c.selected);
      
      if (selectedChildren.length === 0) {
        toast.error('Please select at least one child');
        return;
      }

      for (const { child, isCheckedIn, activeCheckIn } of selectedChildren) {
        if (action === 'check-out' && isCheckedIn && activeCheckIn) {
          // Process check-out
          await updateDoc(doc(db, 'checkIns', activeCheckIn.id), {
            checkOutTime: serverTimestamp(),
            updatedAt: serverTimestamp(),
            updatedBy: user?.uid
          });
        } else if (action === 'check-in' && !isCheckedIn) {
          // Process check-in
          const checkInData = {
            childId: child.id,
            parentId: user?.uid,
            checkInTime: serverTimestamp(),
            checkOutTime: null,
            healthStatus: {
              hasFever: false,
              temperature: null,
              symptoms: [],
              medications: [],
            },
            meals: {
              breakfast: false,
              lunch: false,
              snack: false,
            },
            concerns: null,
            alternativePickup: null,
            createdAt: serverTimestamp(),
            createdBy: user?.uid,
          };

          await addDoc(collection(db, 'checkIns'), checkInData);
        }
      }

      toast.success(`Successfully ${action === 'check-in' ? 'checked in' : 'checked out'} selected children`);
      await fetchChildren(); // Refresh the list
    } catch (err) {
      console.error('Error processing bulk action:', err);
      setError(`Failed to ${action} children`);
      toast.error(`Failed to ${action} children`);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <LoadingSpinner text="Loading children..." />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No children found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Bulk Check-in/out</h3>
          <button
            onClick={() => handleSelectAll(children.some(c => !c.selected))}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {children.every(c => c.selected) ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="divide-y divide-gray-200">
          {children.map(({ child, isCheckedIn, selected }) => (
            <div
              key={child.id}
              className="py-3 flex items-center justify-between"
            >
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => handleToggleChild(child.id)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-3 block text-sm font-medium text-gray-700">
                  {child.firstName} {child.lastName}
                  <span className={`ml-2 text-sm ${isCheckedIn ? 'text-green-600' : 'text-gray-500'}`}>
                    ({isCheckedIn ? 'Checked In' : 'Not Checked In'})
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          onClick={() => handleBulkAction('check-in')}
          disabled={processing || children.every(c => c.isCheckedIn)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {processing ? (
            <>
              <LoadingSpinner size="sm" variant="white" />
              <span className="ml-2">Processing...</span>
            </>
          ) : (
            'Check In Selected'
          )}
        </button>
        <button
          onClick={() => handleBulkAction('check-out')}
          disabled={processing || children.every(c => !c.isCheckedIn)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
        >
          {processing ? (
            <>
              <LoadingSpinner size="sm" variant="white" />
              <span className="ml-2">Processing...</span>
            </>
          ) : (
            'Check Out Selected'
          )}
        </button>
      </div>
    </div>
  );
} 