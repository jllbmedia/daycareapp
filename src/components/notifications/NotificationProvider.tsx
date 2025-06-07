'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp,
  DocumentData,
  Firestore
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { Notification } from '@/types';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotifications: () => Promise<void>;
}

interface NotificationProviderProps {
  children: ReactNode;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.uid || !db) return;

    const firestore = db as Firestore;
    // Subscribe to notifications
    const notificationsRef = collection(firestore, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as Notification[];

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter(n => !n.read).length);

      // Show toast for new notifications
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' && !change.doc.data().read) {
          const notification = change.doc.data() as DocumentData;
          toast(notification.message, {
            icon: getNotificationIcon(notification.type),
            duration: 5000,
          });
        }
      });
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return '💬';
      case 'check-in':
        return '✅';
      case 'check-out':
        return '👋';
      case 'activity':
        return '📸';
      default:
        return 'ℹ️';
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (!user?.uid || !db) return;

    try {
      const firestore = db as Firestore;
      const notificationRef = doc(firestore, 'notifications', notificationId);
      await updateDoc(notificationRef, {
        read: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      toast.error('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    if (!user?.uid || !db) return;

    try {
      const firestore = db as Firestore;
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(
        unreadNotifications.map(notification =>
          updateDoc(doc(firestore, 'notifications', notification.id), {
            read: true,
            updatedAt: serverTimestamp(),
          })
        )
      );
      toast.success('All notifications marked as read');
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      toast.error('Failed to update notifications');
    }
  };

  const clearNotifications = async () => {
    if (!user?.uid || !db) return;

    try {
      const firestore = db as Firestore;
      const readNotifications = notifications.filter(n => n.read);
      await Promise.all(
        readNotifications.map(notification =>
          updateDoc(doc(firestore, 'notifications', notification.id), {
            archived: true,
            updatedAt: serverTimestamp(),
          })
        )
      );
      toast.success('Notifications cleared');
    } catch (err) {
      console.error('Error clearing notifications:', err);
      toast.error('Failed to clear notifications');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
} 