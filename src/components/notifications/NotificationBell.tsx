'use client';

import { useState, useRef, useEffect } from 'react';
import { Notification } from '@/types';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { useNotifications } from './NotificationProvider';

export function NotificationBell() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    switch (notification.type) {
      case 'message':
        router.push(`/dashboard/messages/${notification.data?.senderId}`);
        break;
      case 'check-in':
      case 'check-out':
        router.push(`/dashboard/children/${notification.data?.childId}`);
        break;
      case 'activity':
        router.push(`/dashboard/activities/${notification.data?.childId}`);
        break;
      default:
        break;
    }

    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Notifications</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => markAllAsRead()}
                  className="text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Mark all as read
                </button>
                <button
                  onClick={() => clearNotifications()}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No notifications
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      notification.isRead
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-indigo-50 hover:bg-indigo-100'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {format(notification.timestamp, 'MMM d, h:mm a')}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 bg-indigo-600 rounded-full" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'message':
      return (
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-lg">💬</span>
        </div>
      );
    case 'check-in':
      return (
        <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
          <span className="text-lg">✅</span>
        </div>
      );
    case 'check-out':
      return (
        <div className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
          <span className="text-lg">👋</span>
        </div>
      );
    case 'activity':
      return (
        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
          <span className="text-lg">📸</span>
        </div>
      );
    default:
      return (
        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
          <span className="text-lg">ℹ️</span>
        </div>
      );
  }
}