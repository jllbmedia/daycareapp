'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Message } from '@/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface MessagingProps {
  recipientId?: string;
  recipientName?: string;
}

interface MessageFormInputs {
  content: string;
}

export function Messaging({ recipientId, recipientName }: MessagingProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset } = useForm<MessageFormInputs>();

  useEffect(() => {
    const fetchMessages = async () => {
      if (!db || !user || !recipientId) {
        setLoading(false);
        return;
      }

      try {
        const firestore = db as Firestore;
        const messagesRef = collection(firestore, 'messages');
        const q = query(
          messagesRef,
          where('participants', 'array-contains', user.uid),
          orderBy('timestamp', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const fetchedMessages = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];

        setMessages(fetchedMessages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast.error('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user, recipientId]);

  const onSubmit = async (data: MessageFormInputs) => {
    if (!db || !user || !recipientId) {
      toast.error('Cannot send message at this time');
      return;
    }

    try {
      setLoading(true);
      const firestore = db as Firestore;
      const messagesRef = collection(firestore, 'messages');
      
      await addDoc(messagesRef, {
        content: data.content.trim(),
        senderId: user.uid,
        recipientId,
        timestamp: serverTimestamp(),
        read: false,
        participants: [user.uid, recipientId]
      });

      reset();
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="bg-white shadow rounded-lg p-4">
        <h2 className="text-lg font-medium text-gray-900">
          {recipientName ? `Messaging with ${recipientName}` : 'Messages'}
        </h2>
        
        <div className="mt-4 space-y-4">
          {messages.length > 0 ? (
            messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg ${
                  message.senderId === user?.uid
                    ? 'bg-indigo-100 ml-auto'
                    : 'bg-gray-100'
                } max-w-[80%]`}
              >
                <p className="text-sm text-gray-900">{message.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {message.timestamp?.toDate().toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center">No messages yet</p>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
          <div className="flex space-x-2">
            <input
              type="text"
              {...register('content', { required: true })}
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Type your message..."
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 