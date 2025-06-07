'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp, Timestamp, Firestore } from 'firebase/firestore';
import { Child, CheckInRecord } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';

interface CheckInFormProps {
  child: Child;
  onComplete?: () => void;
}

interface CheckInFormInputs {
  hasFever: boolean;
  temperature?: string;
  symptoms: string;
  medications: string;
  breakfast: boolean;
  lunch: boolean;
  snack: boolean;
  concerns: string;
  // Drop-off information
  dropOffPersonName: string;
  dropOffRelationship: string;
  dropOffSignature: string;
  dropOffNotes: string;
  // Alternative pickup information
  alternativePickupName: string;
  alternativePickupRelationship: string;
  alternativePickupPhone: string;
  // Pick-up information
  pickUpPersonName: string;
  pickUpRelationship: string;
  pickUpSignature: string;
  pickUpNotes: string;
}

function CheckInFormContent({ child, onComplete }: CheckInFormProps) {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeCheckIn, setActiveCheckIn] = useState<CheckInRecord | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [checkOutData, setCheckOutData] = useState<CheckInFormInputs | null>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckInFormInputs>();
  const hasFever = watch('hasFever');

  const fetchActiveCheckIn = useCallback(async () => {
    if (!db) {
      console.error('Firestore is not initialized');
      toast.error('Failed to load check-in status');
      setLoading(false);
      return;
    }

    const firestore = db as Firestore;

    try {
      console.log('Fetching active check-in for child:', child.id);
      const checkInsRef = collection(firestore, 'checkIns');
      const q = query(
        checkInsRef,
        where('childId', '==', child.id),
        where('checkOutTime', '==', null)
      );
      
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0];
        setActiveCheckIn({
          id: docData.id,
          ...docData.data()
        } as CheckInRecord);
      } else {
        setActiveCheckIn(null);
      }
    } catch (error) {
      console.error('Error fetching check-in status:', error);
      toast.error('Failed to load check-in status');
    } finally {
      setLoading(false);
    }
  }, [child.id]);

  useEffect(() => {
    fetchActiveCheckIn();
  }, [fetchActiveCheckIn]);

  const handleCheckOut = async () => {
    if (!db) {
      toast.error('Firestore is not initialized');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    if (!activeCheckIn) {
      toast.error('No active check-in found');
      return;
    }

    const firestore = db as Firestore;

    try {
      setLoading(true);
      
      const checkInDocRef = doc(firestore, 'checkIns', activeCheckIn.id);
      await updateDoc(checkInDocRef, {
        checkOutTime: serverTimestamp(),
        updatedAt: serverTimestamp(),
        updatedBy: user.uid
      });
      
      toast.success(`${child.firstName} checked out successfully`);
      await fetchActiveCheckIn();
      onComplete?.();
    } catch (error) {
      console.error('Error during check-out:', error);
      toast.error('Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (data: CheckInFormInputs) => {
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
      setLoading(true);
      
      const checkInData = {
        childId: child.id,
        parentId: user.uid,
        checkInTime: serverTimestamp(),
        checkOutTime: null,
        dropOffInfo: {
          personName: data.dropOffPersonName.trim(),
          relationship: data.dropOffRelationship.trim(),
          signature: data.dropOffSignature.trim(),
          notes: data.dropOffNotes?.trim() || ''
        },
        healthStatus: {
          hasFever: data.hasFever,
          temperature: data.temperature || null,
          symptoms: data.symptoms || [],
          medications: data.medications || []
        },
        createdAt: serverTimestamp(),
        createdBy: user.uid
      };

      const checkInsRef = collection(firestore, 'checkIns');
      await addDoc(checkInsRef, checkInData);
      
      toast.success(`${child.firstName} checked in successfully`);
      await fetchActiveCheckIn();
      onComplete?.();
    } catch (error) {
      console.error('Error during check-in:', error);
      toast.error('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CheckInFormInputs) => {
    try {
      if (activeCheckIn) {
        // For check-out, show confirmation dialog
        setCheckOutData(data);
        setShowConfirmDialog(true);
        return;
      }

      // For check-in, proceed as normal
      setError('');
      setLoading(true);
      console.log('Creating new check-in record');
      
      await handleCheckIn(data);
    } catch (err) {
      console.error('Error processing check-in:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to process check-in: ${errorMessage}`);
      toast.error(`Failed to process check-in: ${errorMessage}`, {
        duration: 7000,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <LoadingSpinner text={activeCheckIn ? "Processing check-out..." : "Processing check-in..."} />
      </div>
    );
  }

  if (activeCheckIn) {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-green-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">Currently Checked In</h4>
              <p className="mt-1 text-sm text-green-600">
                Since {activeCheckIn.checkInTime.toDate().toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h4 className="text-lg font-medium text-gray-900">Pick-up Information</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Person Picking Up *
              </label>
              <input
                {...register('pickUpPersonName', { required: 'Name is required' })}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              />
              {errors.pickUpPersonName && (
                <p className="mt-1 text-sm text-red-600">{errors.pickUpPersonName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Relationship to Child *
              </label>
              <input
                {...register('pickUpRelationship', { required: 'Relationship is required' })}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              />
              {errors.pickUpRelationship && (
                <p className="mt-1 text-sm text-red-600">{errors.pickUpRelationship.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Signature *
              </label>
              <input
                {...register('pickUpSignature', { required: 'Signature is required' })}
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
              />
              {errors.pickUpSignature && (
                <p className="mt-1 text-sm text-red-600">{errors.pickUpSignature.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Additional Notes
              </label>
              <textarea
                {...register('pickUpNotes')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                placeholder="Any notes about the pick-up"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" variant="white" />
              <span className="ml-2">Processing Check-out...</span>
            </>
          ) : (
            'Check Out'
          )}
        </button>
      </form>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <div className="flex">
              <svg className="h-5 w-5 text-red-400 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Drop-off Information</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Person Dropping Off *
                </label>
                <input
                  {...register('dropOffPersonName', { required: 'Name is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                />
                {errors.dropOffPersonName && (
                  <p className="mt-1 text-sm text-red-600">{errors.dropOffPersonName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Relationship to Child *
                </label>
                <input
                  {...register('dropOffRelationship', { required: 'Relationship is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                />
                {errors.dropOffRelationship && (
                  <p className="mt-1 text-sm text-red-600">{errors.dropOffRelationship.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Signature *
                </label>
                <input
                  {...register('dropOffSignature', { required: 'Signature is required' })}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                />
                {errors.dropOffSignature && (
                  <p className="mt-1 text-sm text-red-600">{errors.dropOffSignature.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  {...register('dropOffNotes')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
                  placeholder="Any special instructions or notes for today"
                />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Health Status</h4>
            
            <div className="flex items-center">
              <input
                {...register('hasFever')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Has Fever
              </label>
            </div>

            {hasFever && (
              <div className="ml-6">
                <label className="block text-sm font-medium text-gray-700">
                  Temperature (°F)
                </label>
                <input
                  {...register('temperature', {
                    required: hasFever ? 'Temperature is required when fever is checked' : false,
                    pattern: {
                      value: /^\d*\.?\d*$/,
                      message: 'Please enter a valid temperature',
                    },
                  })}
                  type="number"
                  step="0.1"
                  className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
                    errors.temperature
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                  }`}
                />
                {errors.temperature && (
                  <p className="mt-1 text-sm text-red-600">{errors.temperature.message}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Symptoms (comma-separated)
              </label>
              <input
                {...register('symptoms')}
                type="text"
                placeholder="e.g., cough, runny nose"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Medications (comma-separated)
              </label>
              <input
                {...register('medications')}
                type="text"
                placeholder="e.g., acetaminophen, antihistamine"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Meals</h4>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  {...register('breakfast')}
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Will have breakfast
                </label>
              </div>
              <div className="flex items-center">
                <input
                  {...register('lunch')}
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Will have lunch
                </label>
              </div>
              <div className="flex items-center">
                <input
                  {...register('snack')}
                  type="checkbox"
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Will have snack
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Any concerns or notes for today?
              </label>
              <textarea
                {...register('concerns')}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Alternative Pickup (Optional)</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  {...register('alternativePickupName')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Relationship
                </label>
                <input
                  {...register('alternativePickupRelationship')}
                  type="text"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  {...register('alternativePickupPhone', {
                    pattern: {
                      value: /^\+?[\d\s-]+$/,
                      message: 'Invalid phone number',
                    },
                  })}
                  type="tel"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {errors.alternativePickupPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.alternativePickupPhone.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onComplete}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" variant="white" />
                  <span className="ml-2">Processing...</span>
                </>
              ) : (
                'Check In'
              )}
            </button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={handleCheckOut}
        title="Confirm Check-Out"
        message={`Are you sure you want to check out ${child.firstName}? This action cannot be undone.`}
        confirmText="Check Out"
        cancelText="Cancel"
      />
    </>
  );
}

export function CheckInForm({ child, onComplete }: CheckInFormProps) {
  return (
    <ErrorBoundary errorComponent="inline">
      <CheckInFormContent child={child} onComplete={onComplete} />
    </ErrorBoundary>
  );
} 