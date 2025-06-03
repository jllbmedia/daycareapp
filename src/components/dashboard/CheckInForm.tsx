'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Child, CheckInRecord } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

interface CheckInFormProps {
  child: Child;
  onComplete: () => void;
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
  alternativePickupName: string;
  alternativePickupRelationship: string;
  alternativePickupPhone: string;
}

export function CheckInForm({ child, onComplete }: CheckInFormProps) {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCheckIn, setActiveCheckIn] = useState<CheckInRecord | null>(null);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<CheckInFormInputs>();
  const hasFever = watch('hasFever');

  // Check for active check-in on component mount
  useEffect(() => {
    const fetchActiveCheckIn = async () => {
      try {
        console.log('Fetching active check-in for child:', child.id);
        const checkInsRef = collection(db, 'checkIns');
        const q = query(
          checkInsRef,
          where('childId', '==', child.id),
          where('checkOutTime', '==', null)
        );
        const querySnapshot = await getDocs(q);
        console.log('Query results:', querySnapshot.size, 'documents found');
        if (!querySnapshot.empty) {
          const checkInData = {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
          } as CheckInRecord;
          setActiveCheckIn(checkInData);
          console.log('Active check-in found:', checkInData);
        }
      } catch (error) {
        console.error('Error fetching active check-in:', error);
        setError('Error checking current status: ' + (error instanceof Error ? error.message : String(error)));
      }
    };

    fetchActiveCheckIn();
  }, [child.id]);

  const onSubmit = async (data: CheckInFormInputs) => {
    try {
      setError('');
      setLoading(true);
      console.log('Processing check-in/out for child:', child.id);

      if (activeCheckIn) {
        // Check out
        console.log('Processing check-out for existing check-in:', activeCheckIn.id);
        await updateDoc(doc(db, 'checkIns', activeCheckIn.id), {
          checkOutTime: serverTimestamp(),
          updatedAt: serverTimestamp(),
          updatedBy: user?.uid
        });
        console.log('Check-out completed successfully');
        setActiveCheckIn(null);
      } else {
        // Check in
        console.log('Creating new check-in record');
        const checkInData = {
          childId: child.id,
          parentId: user?.uid,
          checkInTime: serverTimestamp(),
          checkOutTime: null,
          createdAt: serverTimestamp(),
          createdBy: user?.uid,
          healthStatus: {
            hasFever: data.hasFever,
            temperature: data.hasFever ? parseFloat(data.temperature || '0') : null,
            symptoms: data.symptoms ? data.symptoms.split(',').map(s => s.trim()) : [],
            medications: data.medications ? data.medications.split(',').map(m => m.trim()) : [],
          },
          meals: {
            breakfast: data.breakfast,
            lunch: data.lunch,
            snack: data.snack,
          },
          concerns: data.concerns || null,
          alternativePickup: data.alternativePickupName ? {
            name: data.alternativePickupName,
            relationship: data.alternativePickupRelationship,
            phone: data.alternativePickupPhone,
          } : null,
        };

        console.log('Attempting to save check-in data:', checkInData);
        const docRef = await addDoc(collection(db, 'checkIns'), checkInData);
        console.log('Check-in created successfully with ID:', docRef.id);
      }

      onComplete();
    } catch (err) {
      console.error('Error processing check-in/out:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to process check-in/out: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (activeCheckIn) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 rounded-md p-4">
          <p className="text-green-700">
            Child is currently checked in (since {new Date(activeCheckIn.checkInTime).toLocaleString()})
          </p>
        </div>
        <button
          onClick={handleSubmit(onSubmit)}
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Check Out
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="text-lg font-medium">Health Status</h4>
        
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
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Temperature
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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

        <h4 className="text-lg font-medium">Meals</h4>
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

        <h4 className="text-lg font-medium">Alternative Pickup (Optional)</h4>
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

        <div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Check In
          </button>
        </div>
      </div>
    </form>
  );
} 