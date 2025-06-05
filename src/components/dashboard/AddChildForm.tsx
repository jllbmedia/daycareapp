'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Child } from '@/types';
import { toast } from 'react-hot-toast';

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
    if (!user) {
      toast.error('You must be logged in to add a child');
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

      const docRef = await addDoc(collection(db, 'children'), childData);

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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
              First Name
            </label>
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
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              {...register('lastName', { required: 'Last name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
            type="date"
            {...register('dateOfBirth', { required: 'Date of birth is required' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
            type="text"
            {...register('allergies')}
            placeholder="e.g., peanuts, milk, eggs"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Emergency Contact</h3>
          <div>
            <label htmlFor="emergencyContactName" className="block text-sm font-medium text-gray-700">
              Name
            </label>
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
            <label htmlFor="emergencyContactRelationship" className="block text-sm font-medium text-gray-700">
              Relationship
            </label>
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
            <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-gray-700">
              Phone
            </label>
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
      </div>

      <div>
        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
            loading 
              ? 'bg-indigo-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          }`}
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding Child...
            </>
          ) : (
            'Add Child'
          )}
        </button>
      </div>
    </form>
  );
}
