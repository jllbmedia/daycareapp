'use client';

import { useState, useEffect, useRef } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  onSnapshot,
  getDocs,
  DocumentData
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: 'staff' | 'parent';
  timestamp: Date;
  attachmentUrl?: string;
  isRead: boolean;
}

interface MessagingProps {
  recipientId: string;
  recipientName: string;
  recipientRole: 'staff' | 'parent';
}

export function Messaging({ recipientId, recipientName, recipientRole }: MessagingProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user?.uid) return;

    // Subscribe to messages
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      })) as Message[];

      setMessages(newMessages.reverse());
      setLoading(false);
      scrollToBottom();
    }, (err) => {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user?.uid) return;

    try {
      setSending(true);
      setError('');

      const messageData = {
        content: newMessage.trim(),
        senderId: user.uid,
        senderName: user.displayName || 'Unknown User',
        senderRole: recipientRole === 'staff' ? 'parent' : 'staff',
        recipientId,
        participants: [user.uid, recipientId],
        timestamp: serverTimestamp(),
        isRead: false,
      };

      await addDoc(collection(db, 'messages'), messageData);
      setNewMessage('');
      toast.success('Message sent');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAttachment = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.uid) return;

    try {
      setSending(true);
      setError('');

      // TODO: Implement file upload logic similar to DailyActivities component
      // For now, we'll just show a toast
      toast.error('File attachment feature coming soon!');
    } catch (err) {
      console.error('Error attaching file:', err);
      setError('Failed to attach file');
      toast.error('Failed to attach file');
    } finally {
      setSending(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <LoadingSpinner text="Loading messages..." />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Chat with {recipientName}
        </h3>
        <p className="text-sm text-gray-500">
          {recipientRole === 'staff' ? 'Staff Member' : 'Parent'}
        </p>
      </div>

      {error && (
        <div className="m-4 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.senderId === user?.uid
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs font-medium">
                  {message.senderId === user?.uid ? 'You' : message.senderName}
                </span>
                <span className="text-xs opacity-75">
                  {message.timestamp?.toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm">{message.content}</p>
              {message.attachmentUrl && (
                <div className="mt-2">
                  <Image
                    src={message.attachmentUrl}
                    alt="Attachment"
                    width={200}
                    height={150}
                    className="rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleAttachment}
            className="hidden"
            id="attachment"
          />
          <label
            htmlFor="attachment"
            className="flex-shrink-0 inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </label>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            disabled={sending || !newMessage.trim()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {sending ? (
              <>
                <LoadingSpinner size="sm" variant="white" />
                <span className="ml-2">Sending...</span>
              </>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 