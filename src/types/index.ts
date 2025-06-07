import { Timestamp } from 'firebase/firestore';

export interface FirebaseTimestamp {
  seconds: number;
  nanoseconds: number;
}

export interface FirestoreDocument {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Child extends FirestoreDocument {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  parentId: string;
  emergencyContacts: EmergencyContact[];
  medicalInfo: MedicalInfo;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

export interface MedicalInfo {
  allergies: string[];
  medications: string[];
  conditions: string[];
  notes: string;
}

export interface AttendanceRecord extends FirestoreDocument {
  childId: string;
  parentId: string;
  checkInTime: Timestamp;
  checkOutTime?: Timestamp;
  status: 'checked-in' | 'checked-out';
  notes?: string;
  dropOffInfo: {
    personName: string;
    relationship: string;
    signature: string;
    notes: string;
  };
  pickUpInfo?: {
    personName: string;
    relationship: string;
    signature: string;
    notes: string;
    time: Timestamp;
  };
  healthStatus: {
    hasFever: boolean;
    temperature: number | null;
    symptoms: string[];
    medications: string[];
  };
}

export interface DailyActivity extends FirestoreDocument {
  childId: string;
  timestamp: Timestamp;
  type: 'meal' | 'nap' | 'activity' | 'incident' | 'medication';
  description: string;
  notes?: string;
}

export interface Message extends FirestoreDocument {
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface Notification extends FirestoreDocument {
  userId: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'message' | 'check-in' | 'check-out' | 'activity';
  title: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
  link?: string;
  data?: {
    senderId?: string;
    childId?: string;
    activityId?: string;
  };
}

export interface CheckInRecord {
  id: string;
  childId: string;
  parentId: string;
  checkInTime: Timestamp;
  checkOutTime: Timestamp | null;
  dropOffInfo: {
    personName: string;
    relationship: string;
    signature: string;
    notes: string;
  };
  pickUpInfo?: {
    personName: string;
    relationship: string;
    signature: string;
    notes: string;
    time: Timestamp;
  };
  healthStatus: {
    hasFever: boolean;
    temperature: number | null;
    symptoms: string[];
    medications: string[];
  };
  meals: {
    breakfast: boolean;
    lunch: boolean;
    snack: boolean;
  };
  concerns: string | null;
  alternativePickup: {
    name: string;
    relationship: string;
    phone: string;
  } | null;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt?: Timestamp;
  updatedBy?: string;
}

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  children: string[]; // Array of child IDs
}

export interface UserData extends FirestoreDocument {
  email: string;
  displayName?: string;
  role: 'parent' | 'staff' | 'admin';
  settings: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

export interface FirestoreError {
  code: string;
  message: string;
  name: string;
} 