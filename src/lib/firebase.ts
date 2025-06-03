import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCyeZqPg92ajOou9RKcW15TR5j79zr_sGE",
  authDomain: "jllb-cursor01.firebaseapp.com",
  projectId: "jllb-cursor01",
  storageBucket: "jllb-cursor01.firebasestorage.app",
  messagingSenderId: "370343737369",
  appId: "1:370343737369:web:d68668141aff55e30dd288"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db }; 