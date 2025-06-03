'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Child } from '@/types';
import { ChildList } from '@/components/dashboard/ChildList';
import { AddChildForm } from '@/components/dashboard/AddChildForm';

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
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
        console.log('Fetching children for user:', user.uid);
        const childrenRef = collection(db, 'children');
        const q = query(childrenRef, where('parentId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const childrenData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Child[];
        console.log('Children fetched:', childrenData.length);
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

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      setError('Failed to log out. Please try again.');
    }
  };

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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Parent Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-gray-600">
                {user.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-lg font-medium mb-4">Your Children</h2>
              <ChildList children={children} setChildren={setChildren} />
            </div>
            <div>
              <h2 className="text-lg font-medium mb-4">Add a Child</h2>
              <AddChildForm setChildren={setChildren} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 