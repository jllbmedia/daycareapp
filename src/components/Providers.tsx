'use client';

import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from 'next-themes';
import '@/lib/i18n';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );
} 