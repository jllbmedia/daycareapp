import { db } from '../src/lib/firebase';
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  Firestore
} from 'firebase/firestore';

// Type guard to check if db is initialized
function isFirestoreInitialized(db: Firestore | null): db is Firestore {
  return db !== null;
}

const testData = {
  parent: {
    id: 'test-parent-1',
    firstName: 'Alice',
    lastName: 'Smith',
    email: 'alice@example.com',
    role: 'parent',
  },
  staff: {
    id: 'test-staff-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    role: 'staff',
  },
  children: [
    {
      id: 'test-child-1',
      firstName: 'Emma',
      lastName: 'Smith',
      parentId: 'test-parent-1',
      dateOfBirth: '2019-05-15',
      allergies: ['peanuts'],
      emergencyContact: {
        name: 'Bob Smith',
        phone: '555-0123',
        relationship: 'Father',
      },
    },
    {
      id: 'test-child-2',
      firstName: 'Liam',
      lastName: 'Smith',
      parentId: 'test-parent-1',
      dateOfBirth: '2020-03-10',
      allergies: [],
      emergencyContact: {
        name: 'Bob Smith',
        phone: '555-0123',
        relationship: 'Father',
      },
    },
  ],
  checkIns: [
    {
      childId: 'test-child-1',
      parentId: 'test-parent-1',
      checkInTime: Timestamp.fromDate(new Date(Date.now() - 3600000)), // 1 hour ago
      checkOutTime: null,
      healthStatus: {
        hasFever: false,
        temperature: null,
        symptoms: [],
        medications: [],
      },
      meals: {
        breakfast: true,
        lunch: true,
        snack: true,
      },
      concerns: null,
      createdAt: serverTimestamp(),
      createdBy: 'test-parent-1',
    },
  ],
  activities: [
    {
      childId: 'test-child-1',
      type: 'note',
      content: 'Emma enjoyed story time and participated actively in group discussion.',
      timestamp: serverTimestamp(),
      createdBy: 'test-staff-1',
    },
    {
      childId: 'test-child-2',
      type: 'note',
      content: 'Liam took a 2-hour nap after lunch.',
      timestamp: serverTimestamp(),
      createdBy: 'test-staff-1',
    },
  ],
  messages: [
    {
      content: 'Hi Alice, Emma had a great day today!',
      senderId: 'test-staff-1',
      senderName: 'John Doe',
      senderRole: 'staff',
      recipientId: 'test-parent-1',
      participants: ['test-staff-1', 'test-parent-1'],
      timestamp: serverTimestamp(),
      isRead: false,
    },
  ],
  notifications: [
    {
      type: 'check-in',
      title: 'Check-in Confirmation',
      message: 'Emma has been checked in successfully',
      recipientId: 'test-parent-1',
      timestamp: serverTimestamp(),
      isRead: false,
      data: {
        childId: 'test-child-1',
      },
    },
    {
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from John Doe',
      recipientId: 'test-parent-1',
      timestamp: serverTimestamp(),
      isRead: false,
      data: {
        senderId: 'test-staff-1',
      },
    },
  ],
};

async function seedTestData() {
  if (!isFirestoreInitialized(db)) {
    console.error('Firestore is not initialized');
    process.exit(1);
  }

  try {
    // Add children
    for (const child of testData.children) {
      await addDoc(collection(db, 'children'), child);
    }

    // Add check-ins
    for (const checkIn of testData.checkIns) {
      await addDoc(collection(db, 'checkIns'), checkIn);
    }

    // Add activities
    for (const activity of testData.activities) {
      await addDoc(collection(db, 'activities'), activity);
    }

    // Add messages
    for (const message of testData.messages) {
      await addDoc(collection(db, 'messages'), message);
    }

    // Add notifications
    for (const notification of testData.notifications) {
      await addDoc(collection(db, 'notifications'), notification);
    }

    console.log('Test data seeded successfully!');
  } catch (error) {
    console.error('Error seeding test data:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedTestData(); 