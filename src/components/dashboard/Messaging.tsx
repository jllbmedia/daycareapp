'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Message } from '@/types';

interface MessagingProps {
  recipientId?: string;
  recipientName?: string;
}

export function Messaging({ recipientId, recipientName }: MessagingProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ content: string }>();

  useEffect(() => {
    if (!user || !recipientId) return;

    const fetchMessages = async () => {
      try {
        setLoading(true);
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('participants', 'array-contains', user.uid),
          orderBy('createdAt', 'desc')
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

  const onSubmit = async ({ content }: { content: string }) => {
    if (!user || !recipientId || !content.trim()) return;

    try {
      setLoading(true);
      const newMessage = {
        senderId: user.uid,
        recipientId,
        content: content.trim(),
        createdAt: serverTimestamp(),
        participants: [user.uid, recipientId]
      };

      await addDoc(collection(db, 'messages'), newMessage);
      reset();
      toast.success('Message sent');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  if (!recipientId) {
    return (
      <div className="p-4 text-center text-gray-500">
        Select a recipient to start messaging
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
                className={`max-w-xs md:max-w-md p-3 rounded-lg ${
                message.senderId === user?.uid
                  ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-900'
              }`}
            >
                <p>{message.content}</p>
                <p className="text-xs mt-1 opacity-75">
                  {message.createdAt?.toDate().toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            {...register('content', { required: true })}
            placeholder={`Message ${recipientName || 'recipient'}...`}
            className="flex-1 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-white ${
              loading
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
} 