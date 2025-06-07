'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Child } from '@/types';
import { ChildList } from '@/components/dashboard/ChildList';
import { AddChildForm } from '@/components/dashboard/AddChildForm';
import { ParentAttendanceHistory } from '@/components/dashboard/ParentAttendanceHistory';
import { ErrorBoundary, FallbackProps } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Something went wrong
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error.message}
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            Refresh Page
          </button>
          <button
            onClick={resetErrorBoundary}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('Dashboard page mounted, auth state:', { user, authLoading });
    
    // Check authentication status after auth is initialized
    if (!authLoading && !user) {
      console.log('No user found, redirecting to login...');
      router.replace('/login');
      return;
    }

    if (!user) return; // Don't fetch data if no user

    const fetchChildren = async () => {
      try {
        if (!db) throw new Error('Firestore is not initialized');
        console.log('Fetching children for user:', user.uid);
        const childrenRef = collection(db, 'children');
        const q = query(childrenRef, where('parentId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const childrenData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setChildren(childrenData);
      } catch (error) {
        console.error('Error fetching children:', error);
        setError('Failed to load children. Please try refreshing the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [user, router, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          setError('');
          setLoading(true);
        }}
      >
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}
          <div className="px-4 py-6 sm:px-0">
            <div className="grid grid-cols-1 gap-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Your Children</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage your registered children and their attendance</p>
                  </div>
                  <ChildList childrenData={children} setChildren={setChildren} />
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="border-b border-gray-200 pb-4 mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Add a New Child</h2>
                    <p className="mt-1 text-sm text-gray-500">Register a new child to your account</p>
                  </div>
                  <AddChildForm setChildren={setChildren} />
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Attendance History</h2>
                  <p className="mt-1 text-sm text-gray-500">View and track your children&apos;s attendance records</p>
                </div>
                <ParentAttendanceHistory />
              </div>
            </div>
          </div>
        </main>
      </ErrorBoundary>
    </div>
  );
} 