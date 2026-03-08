// ========================================
// src/components/AuthProvider.tsx
// 認証コンテキスト（Server Component → Client Component へユーザー情報を受け渡す）
// ========================================

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { AuthUser } from '@/lib/auth';

// Context
const AuthContext = createContext<AuthUser | null>(null);

// useAuth hook
export function useAuth(): AuthUser | null {
  return useContext(AuthContext);
}

// Provider
export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: ReactNode;
}) {
  return (
    <AuthContext.Provider value={user}>
      {children}
    </AuthContext.Provider>
  );
}
