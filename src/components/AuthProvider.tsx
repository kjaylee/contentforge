'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface Usage {
  isLoggedIn: boolean;
  tier: 'free' | 'pro';
  dailyLimit: number;
  used: number;
  remaining: number;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: User | null;
  usage: Usage | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUsage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  const fetchUsage = useCallback(async () => {
    try {
      const response = await fetch('/api/usage');
      if (response.ok) {
        const data = await response.json();
        setUsage(data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  }, []);

  useEffect(() => {
    // 초기 세션 체크
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      await fetchUsage();
      setIsLoading(false);
    };

    initAuth();

    // Auth 상태 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (event: any, session: any) => {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          await fetchUsage();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, fetchUsage]);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      throw error;
    }
    setUsage(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        usage,
        isLoading,
        signInWithGoogle,
        signOut,
        refreshUsage: fetchUsage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
