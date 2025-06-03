'use client';

import { useState } from 'react';
import { Child } from '@/types';
import { CheckInForm } from './CheckInForm';

interface ChildListProps {
  children: Child[];
  setChildren: React.Dispatch<React.SetStateAction<Child[]>>;
}

export function ChildList({ children, setChildren }: ChildListProps) {
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  if (children.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-500 text-center">No children added yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {children.map((child) => (
        <div
          key={child.id}
          className="bg-white shadow rounded-lg p-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {child.firstName} {child.lastName}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Date of Birth: {new Date(child.dateOfBirth).toLocaleDateString()}
              </p>
              {child.allergies && child.allergies.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-red-600">Allergies:</p>
                  <ul className="mt-1 text-sm text-gray-500 list-disc list-inside">
                    {child.allergies.map((allergy, index) => (
                      <li key={index}>{allergy}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={() => setSelectedChild(selectedChild?.id === child.id ? null : child)}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              {selectedChild?.id === child.id ? 'Cancel' : 'Check In/Out'}
            </button>
          </div>

          {selectedChild?.id === child.id && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <CheckInForm child={child} onComplete={() => setSelectedChild(null)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
} 