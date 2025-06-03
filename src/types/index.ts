export interface Child {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  parentId: string;
  allergies?: string[];
  emergencyContacts: EmergencyContact[];
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface CheckInRecord {
  id: string;
  childId: string;
  checkInTime: Date;
  checkOutTime?: Date;
  healthStatus: {
    hasFever: boolean;
    temperature?: number;
    symptoms?: string[];
    medications?: string[];
  };
  meals: {
    breakfast?: boolean;
    lunch?: boolean;
    snack?: boolean;
  };
  concerns?: string;
  alternativePickup?: {
    name: string;
    relationship: string;
    phone: string;
  };
}

export interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  children: string[]; // Array of child IDs
} 