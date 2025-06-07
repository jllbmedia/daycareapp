'use client';

import { useState } from 'react';
import { Child } from '@/types';
import { CheckInForm } from './CheckInForm';
import { CheckInHistory } from './CheckInHistory';
import { EditChildForm } from './EditChildForm';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { differenceInYears } from 'date-fns';
import { Modal } from '@/components/ui/Modal';

interface ChildListProps {
  childrenData: Child[];
  setChildren: React.Dispatch<React.SetStateAction<Child[]>>;
}

function ChildListContent({ childrenData, setChildren }: ChildListProps) {
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showHistory, setShowHistory] = useState<Child | null>(null);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [showCheckInForm, setShowCheckInForm] = useState<Child | null>(null);

  if (childrenData.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No children registered yet</p>
      </div>
    );
  }

  const handleUpdateChild = (updatedChild: Child) => {
    setChildren(childrenData.map(child => 
      child.id === updatedChild.id ? updatedChild : child
    ));
  };

  const calculateAge = (dateOfBirth: string) => {
    return differenceInYears(new Date(), new Date(dateOfBirth));
  };

  return (
    <div className="space-y-4">
      {childrenData.map((child) => (
        <ErrorBoundary key={child.id} errorComponent="inline">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {child.firstName} {child.lastName}
                </h3>
                <p className="text-sm text-gray-500">Age: {calculateAge(child.dateOfBirth)}</p>
                {child.medicalInfo?.allergies?.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    Allergies: {child.medicalInfo.allergies.join(', ')}
                  </p>
                )}
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setEditingChild(child)}
                  className="px-3 py-1 text-sm font-medium text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowHistory(child)}
                  className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-600 rounded"
                >
                  History
                </button>
                <button
                  onClick={() => setShowCheckInForm(child)}
                  className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded"
                >
                  Check In/Out
                </button>
              </div>
            </div>
          </div>
        </ErrorBoundary>
      ))}

      {showCheckInForm && (
        <Modal
          isOpen={!!showCheckInForm}
          onClose={() => setShowCheckInForm(null)}
          title={`Check In/Out - ${showCheckInForm.firstName}`}
        >
          <CheckInForm
            child={showCheckInForm}
          />
        </Modal>
      )}

      {showHistory && (
        <Modal
          isOpen={!!showHistory}
          onClose={() => setShowHistory(null)}
          title={`Check-in History - ${showHistory.firstName}`}
        >
          <CheckInHistory
            child={showHistory}
            limit={10}
          />
        </Modal>
      )}

      {editingChild && (
        <ErrorBoundary errorComponent="modal">
          <EditChildForm
            child={editingChild}
            onClose={() => setEditingChild(null)}
            onUpdate={handleUpdateChild}
          />
        </ErrorBoundary>
      )}
    </div>
  );
}

export function ChildList(props: ChildListProps) {
  return (
    <ErrorBoundary errorComponent="fullscreen">
      <ChildListContent {...props} />
    </ErrorBoundary>
  );
} 