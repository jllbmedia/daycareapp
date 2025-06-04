'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Child } from '@/types';

interface AddChildFormInputs {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
}

interface AddChildFormProps {
  setChildren: React.Dispatch<React.SetStateAction<Child[]>>;
}

export function AddChildForm({ setChildren }: AddChildFormProps) {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<AddChildFormInputs>();

  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const ageDiff = Date.now() - birthDate.getTime();
    return Math.floor(ageDiff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const onSubmit = async (data: AddChildFormInputs) => {
    try {
      setError('');

      const allergiesArray = data.allergies
        ? data.allergies.split(',').map(allergy => allergy.trim())
        : [];

      const childData = {
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        parentId: user?.uid ?? '', // ✅ Ensures it's always a string
        allergies: allergiesArray,
        emergencyContacts: [
          {
            name: data.emergencyContactName,
            relationship: data.emergencyContactRelationship,
            phone: data.emergencyContactPhone,
          },
        ],
      };

      const docRef = await addDoc(collection(db, 'children'), childData);

      const newChild: Child = {
        id: docRef.id,
        ...childData,
        age: calculateAge(childData.dateOfBirth),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setChildren(prev => [...prev, newChild]);
      reset();
    } catch (err) {
      setError('Failed to add child.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white shadow rounded-lg p-6">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              {...register('firstName', { required: 'First name is required' })}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            />
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              {...register('lastName', { required: 'Last name is required' })}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            />
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
            Date of Birth
          </label>
          <input
            {...register('dateOfBirth', { required: 'Date of birth is required' })}
            type="date"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
          />
          {errors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
            Allergies (comma-separated)
          </label>
          <input
            {...register('allergies')}
            type="text"
            placeholder="e.g., peanuts, milk, eggs"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>

          <div>
            <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              {...register('emergencyContactName', { required: 'Emergency contact name is required' })}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            />
            {errors.emergencyContactName && (
              <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="emergencyContactRelationship" className="block text-sm font-medium text-gray-700">
              Relationship
            </label>
            <input
              {...register('emergencyContactRelationship', { required: 'Relationship is required' })}
              type="text"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            />
            {errors.emergencyContactRelationship && (
              <p className="mt-1 text-sm text-red-600">{errors.emergencyContactRelationship.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
              Phone Number
            </label>
            <input
              {...register('emergencyContactPhone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^\+?[\d\s-]+$/,
                  message: 'Invalid phone number',
                },
              })}
              type="tel"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm text-gray-900"
            />
            {errors.emergencyContactPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone.message}</p>
            )}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Child
          </button>
        </div>
      </div>
    </form>
  );
}
