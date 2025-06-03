'use client';

import { useEffect, useState } from 'react';
import { getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export function FirebaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    try {
      const app = getApp();
      const auth = getAuth(app);
      
      // Test auth state change
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setStatus('connected');
        if (user) {
          console.log('User is signed in:', user.email);
        } else {
          console.log('No user is signed in.');
        }
      }, (error) => {
        console.error('Auth state change error:', error);
        setStatus('error');
        setErrorMessage(error.message);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Firebase connection error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
    }
  }, []);

  if (status === 'checking') {
    return <div className="text-gray-600">Checking Firebase connection...</div>;
  }

  if (status === 'error') {
    return (
      <div className="text-red-600">
        Failed to connect to Firebase: {errorMessage}
      </div>
    );
  }

  return (
    <div className="text-green-600">
      Connected to Firebase successfully
    </div>
  );
} 