'use client';

import { useState, useEffect } from 'react';
import { Child, DailyActivity } from '@/types';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, orderBy, limit, Timestamp, Firestore } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface DailyActivitiesProps {
  child: Child;
  limit?: number;
}

export function DailyActivities({ child, limit: recordLimit = 10 }: DailyActivitiesProps) {
  const [activities, setActivities] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    const fetchActivities = async () => {
      if (!db) {
        setError('Database is not initialized');
        setLoading(false);
        return;
      }

      const firestore = db as Firestore;

      try {
        setLoading(true);
        setError('');
        const activitiesRef = collection(firestore, 'activities');
        const q = query(
          activitiesRef,
          where('childId', '==', child.id),
          orderBy('timestamp', 'desc'),
          limit(recordLimit)
        );
        
        const querySnapshot = await getDocs(q);
        const records = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as DailyActivity[];
        
        setActivities(records);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setError('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [child.id, recordLimit]);

  const handleAddActivity = async (type: string, description: string) => {
    if (!db) {
      toast.error('Database is not initialized');
      return;
    }

    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    const firestore = db as Firestore;

    try {
      setLoading(true);
      
      const activityRef = collection(firestore, 'activities');
      await addDoc(activityRef, {
        childId: child.id,
        type,
        description,
        timestamp: Timestamp.now(),
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      toast.success('Activity added successfully');
      // Refresh activities list
      const activitiesRef = collection(firestore, 'activities');
      const q = query(
        activitiesRef,
        where('childId', '==', child.id),
        orderBy('timestamp', 'desc'),
        limit(recordLimit)
      );
      
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DailyActivity[];
      
      setActivities(records);
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('Failed to add activity');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading activities...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Daily Activities</h3>
      <div className="divide-y divide-gray-200">
        {activities.map(activity => (
          <div key={activity.id} className="py-3">
            <div className="flex justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {activity.type}
                </p>
                <p className="text-sm text-gray-500">
                  {activity.description}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {activity.timestamp.toDate().toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 