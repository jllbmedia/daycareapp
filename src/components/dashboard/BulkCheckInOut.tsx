'use client';

import { useState, useEffect } from 'react';
import { Child, CheckInRecord } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, Timestamp, Firestore } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { toast } from 'react-hot-toast';

interface ChildStatus {
  child: Child;
  isCheckedIn: boolean;
  activeCheckIn: CheckInRecord | null;
  selected: boolean;
}

export function BulkCheckInOut({ parentId }: { parentId: string }) {
  const [children, setChildren] = useState<ChildStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checkInNotes, setCheckInNotes] = useState('');
  const [selectedChildren, setSelectedChildren] = useState<string[]>([]);
  const { user } = useAuth();

  const fetchChildren = async (parentId: string) => {
    if (!db) {
      console.error('Firestore is not initialized');
      toast.error('Failed to load children');
      setLoading(false);
      return;
    }

    const firestore = db as Firestore;

    try {
      setLoading(true);
      
      // Fetch all children for the parent
      const childrenRef = collection(firestore, 'children');
      const childrenQuery = query(childrenRef, where('parentId', '==', parentId));
      const childrenSnapshot = await getDocs(childrenQuery);
      
      // Fetch check-in status for each child
      const childrenData = await Promise.all(
        childrenSnapshot.docs.map(async (doc) => {
          const childData = doc.data();
          const child: Child = {
            id: doc.id,
            firstName: childData.firstName || '',
            lastName: childData.lastName || '',
            dateOfBirth: childData.dateOfBirth || '',
            parentId: childData.parentId || parentId,
            emergencyContacts: childData.emergencyContacts || [],
            medicalInfo: childData.medicalInfo || {
              allergies: [],
              medications: [],
              conditions: [],
              notes: ''
            },
            createdAt: childData.createdAt as Timestamp || Timestamp.now(),
            updatedAt: childData.updatedAt as Timestamp || Timestamp.now()
          };
          
          // Check if child is already checked in
          const checkInsRef = collection(firestore, 'checkIns');
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
    } catch (error) {
      console.error('Error fetching children:', error);
      toast.error('Failed to load children');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChildren(parentId);
  }, [parentId]);

  const handleSelectAll = (selected: boolean) => {
    setChildren(prev => prev.map(child => ({
      ...child,
      selected
    })));
  };

  const handleSelectChild = (childId: string, selected: boolean) => {
    setChildren(prev => prev.map(child => 
      child.child.id === childId ? { ...child, selected } : child
    ));
  };

  const handleBulkCheckIn = async () => {
    if (!db) {
      toast.error('Firestore is not initialized');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    const firestore = db as Firestore;

    try {
      setSubmitting(true);
      const timestamp = Timestamp.now();
      
      // Get selected children
      const selectedChildrenData = children.filter(child => child.selected);
      
      // Create check-in records for each selected child
      const checkInPromises = selectedChildrenData.map(async ({ child }) => {
        const checkInRef = collection(firestore, 'checkIns');
        await addDoc(checkInRef, {
          childId: child.id,
          parentId: user.uid,
          timestamp,
          type: 'check-in',
          notes: checkInNotes
        });
      });
      
      await Promise.all(checkInPromises);
      toast.success('Children checked in successfully');
      
      // Reset form and refresh data
      handleSelectAll(false);
      setCheckInNotes('');
      await fetchChildren(parentId);
    } catch (error) {
      console.error('Error during bulk check-in:', error);
      toast.error('Failed to check in children');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Bulk Check-In/Out</h2>
        <button
          onClick={() => handleSelectAll(!children.some(c => c.selected))}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {children.some(c => c.selected) ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="space-y-2">
        {children.map(({ child, isCheckedIn, selected }) => (
          <div
            key={child.id}
            className="flex items-center space-x-3 p-2 bg-white rounded-lg shadow-sm"
          >
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => handleSelectChild(child.id, e.target.checked)}
              className="h-4 w-4 text-blue-600"
            />
            <span>{child.firstName} {child.lastName}</span>
            <span className={`text-sm ${isCheckedIn ? 'text-green-600' : 'text-red-600'}`}>
              {isCheckedIn ? 'Checked In' : 'Not Checked In'}
            </span>
          </div>
        ))}
      </div>

      {children.some(c => c.selected) && (
        <div className="space-y-4">
          <textarea
            value={checkInNotes}
            onChange={(e) => setCheckInNotes(e.target.value)}
            placeholder="Add notes for check-in (optional)"
            className="w-full p-2 border rounded-md"
            rows={3}
          />
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleBulkCheckIn}
              disabled={submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {submitting ? 'Processing...' : 'Check In Selected'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 