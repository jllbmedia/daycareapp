'use client';

import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Don't show navbar on login or register pages
  if (pathname === '/login' || pathname === '/register') {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand Name */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <div className="relative w-8 h-8">
                <Image
                  src="/images/logo.png"
                  alt="Daycare Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-xl font-bold text-indigo-600">Daycare App</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    pathname === '/dashboard'
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">{user.email}</span>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            {user && (
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 