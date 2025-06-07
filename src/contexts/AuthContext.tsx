'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  getAuth,
  setPersistence,
  browserLocalPersistence,
  UserCredential
} from 'firebase/auth';
import { auth as firebaseAuth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<UserCredential>;
  login: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => {
  return useContext(AuthContext);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only run auth state listener on client side
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    const auth = firebaseAuth || getAuth();
    if (!auth) {
      setLoading(false);
      return;
    }
    
    // Set persistence to LOCAL
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log('Persistence set to LOCAL');
      })
      .catch((error) => {
        console.error('Error setting persistence:', error);
      });

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? `User ${user.email} logged in` : 'No user');
      setUser(user);
      
      if (user) {
        // Get the ID token
        const idToken = await user.getIdToken();
        
        // Set the session cookie
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token: idToken }),
        });
      } else {
        // Clear the session cookie
        await fetch('/api/auth/session', {
          method: 'DELETE',
        });
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, password: string): Promise<UserCredential> => {
    const auth = firebaseAuth || getAuth();
    if (!auth) throw new Error('Firebase auth is not initialized');
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const login = async (email: string, password: string): Promise<UserCredential> => {
    const auth = firebaseAuth || getAuth();
    if (!auth) throw new Error('Firebase auth is not initialized');
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async (): Promise<void> => {
    const auth = firebaseAuth || getAuth();
    if (!auth) throw new Error('Firebase auth is not initialized');

    try {
      // Clear the session cookie first
      await fetch('/api/auth/session', {
        method: 'DELETE',
      });
      
      // Sign out from Firebase
      await signOut(auth);
      
      // Clear any local storage or session storage data
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 