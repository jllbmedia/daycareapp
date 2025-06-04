'use client';

import { useState } from 'react';
import { Child } from '@/types';
import { CheckInForm } from './CheckInForm';
import { CheckInHistory } from './CheckInHistory';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface ChildListProps {
  children: Child[];
  setChildren: (children: Child[]) => void;
}

function ChildListContent({ children, setChildren }: ChildListProps) {
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [showHistory, setShowHistory] = useState<Child | null>(null);

  if (children.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No children registered yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {children.map((child) => (
        <ErrorBoundary key={child.id} errorComponent="inline">
          <div className="border rounded-lg p-4 bg-white shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {child.firstName} {child.lastName}
                </h3>
                <p className="text-sm text-gray-500">Age: {child.age}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => setShowHistory(child)}
                  className="px-3 py-1 text-sm font-medium text-indigo-600 hover:text-indigo-800 border border-indigo-600 rounded"
                >
                  History
                </button>
                <button
                  onClick={() => setSelectedChild(child)}
                  className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded"
                >
                  Check In/Out
                </button>
              </div>
            </div>

            {selectedChild?.id === child.id && (
              <div className="mt-4">
                <ErrorBoundary errorComponent="inline">
                  <CheckInForm child={child} onComplete={() => setSelectedChild(null)} />
                </ErrorBoundary>
              </div>
            )}
          </div>
        </ErrorBoundary>
      ))}

      {showHistory && (
        <ErrorBoundary errorComponent="modal">
          <CheckInHistory
            child={showHistory}
            onClose={() => setShowHistory(null)}
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