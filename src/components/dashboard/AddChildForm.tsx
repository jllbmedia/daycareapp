'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp, Timestamp, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Child } from '@/types';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface AddChildFormProps {
  setChildren: React.Dispatch<React.SetStateAction<Child[]>>;
}

interface AddChildFormInputs {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

export function AddChildForm({ setChildren }: AddChildFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddChildFormInputs>();

  const onSubmit = async (formData: AddChildFormInputs) => {
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);

      // Format the allergies array
      const allergiesArray = formData.allergies
        ? formData.allergies.split(',').map(allergy => allergy.trim())
        : [];

      // Structure the child data for Firestore
      const childData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        parentId: user.uid,
        emergencyContacts: [{
          name: formData.emergencyContactName,
          relationship: formData.emergencyContactRelationship,
          phone: formData.emergencyContactPhone,
          email: '' // Add a default empty email as it's required by the type
        }],
        medicalInfo: {
          allergies: allergiesArray,
          medications: [],
          conditions: [],
          notes: ''
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const firestore = db as Firestore;
      const childrenRef = collection(firestore, 'children');
      const docRef = await addDoc(childrenRef, childData);

      // Create a new child object with proper Timestamp objects
      const now = Timestamp.now();
      const newChild: Child = {
        ...childData,
        id: docRef.id,
        createdAt: now,
        updatedAt: now
      };

      setChildren((prevChildren: Child[]) => [...prevChildren, newChild]);
      
      // Reset the form
      reset();
      toast.success('Child added successfully');
    } catch (error) {
      console.error('Error adding child:', error);
      toast.error('Failed to add child. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">First Name</label>
        <input
          type="text"
          {...register('firstName', { required: 'First name is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.firstName && (
          <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Last Name</label>
        <input
          type="text"
          {...register('lastName', { required: 'Last name is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.lastName && (
          <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
        <input
          type="date"
          {...register('dateOfBirth', { required: 'Date of birth is required' })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
        {errors.dateOfBirth && (
          <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Allergies (comma-separated)</label>
        <input
          type="text"
          {...register('allergies')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="e.g., peanuts, dairy, eggs"
        />
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Emergency Contact</h4>
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.emergencyContactName && (
            <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Relationship</label>
          <input
            type="text"
            {...register('emergencyContactRelationship', { required: 'Relationship is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.emergencyContactRelationship && (
            <p className="mt-1 text-sm text-red-600">{errors.emergencyContactRelationship.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            {...register('emergencyContactPhone', { required: 'Phone number is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
          {errors.emergencyContactPhone && (
            <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone.message}</p>
          )}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" variant="white" />
              <span className="ml-2">Adding Child...</span>
            </>
          ) : (
            'Add Child'
          )}
        </button>
      </div>
    </form>
  );
}
