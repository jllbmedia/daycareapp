export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  age: number;
  parentId: string;
  allergies: string[];
  createdAt: any;
  updatedAt: any;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface CheckInRecord {
  id: string;
  childId: string;
  parentId: string;
  checkInTime: any;
  checkOutTime: any | null;
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
    time: any;
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
  createdAt: any;
  createdBy: string;
  updatedAt?: any;
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