'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { doc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Child } from '@/types';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface EditChildFormProps {
  child: Child;
  onClose: () => void;
  onUpdate: (child: Child) => void;
}

interface EditChildFormInputs {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  allergies: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  emergencyContactEmail: string;
}

export function EditChildForm({ child, onClose, onUpdate }: EditChildFormProps) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<EditChildFormInputs>({
    defaultValues: {
      firstName: child.firstName,
      lastName: child.lastName,
      dateOfBirth: child.dateOfBirth,
      allergies: child.medicalInfo?.allergies?.join(', ') || '',
      emergencyContactName: child.emergencyContacts[0]?.name || '',
      emergencyContactRelationship: child.emergencyContacts[0]?.relationship || '',
      emergencyContactPhone: child.emergencyContacts[0]?.phone || '',
      emergencyContactEmail: child.emergencyContacts[0]?.email || ''
    }
  });

  const onSubmit = async (data: EditChildFormInputs) => {
    if (!db) {
      toast.error('Database not initialized');
      return;
    }

    try {
      setLoading(true);

      // Format allergies into an array
      const allergiesArray = data.allergies
        ? data.allergies.split(',').map(allergy => allergy.trim())
        : [];

      const updatedChild = {
        ...child,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        emergencyContacts: [{
          name: data.emergencyContactName,
          relationship: data.emergencyContactRelationship,
          phone: data.emergencyContactPhone,
          email: data.emergencyContactEmail
        }],
        medicalInfo: {
          ...(child.medicalInfo || {}),
          allergies: allergiesArray,
          medications: child.medicalInfo?.medications || [],
          conditions: child.medicalInfo?.conditions || [],
          notes: child.medicalInfo?.notes || ''
        },
        updatedAt: serverTimestamp()
      };

      const firestore = db as Firestore;
      const docRef = doc(firestore, 'children', child.id);
      await updateDoc(docRef, updatedChild);
      
      onUpdate(updatedChild as Child);
      onClose();
      toast.success('Child information updated successfully');
    } catch (error) {
      console.error('Error updating child:', error);
      toast.error('Failed to update child information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Edit Child Information</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">Emergency Contact</h4>
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

            <div>
              <label htmlFor="emergencyContactEmail" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                {...register('emergencyContactEmail', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.emergencyContactEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.emergencyContactEmail.message}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" variant="white" />
                  <span className="ml-2">Updating...</span>
                </>
              ) : (
                'Update Child'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 