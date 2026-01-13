'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User, Session } from '@supabase/supabase-js';
import {
  supabase,
  signInWithMagicLink,
  signOut as supabaseSignOut,
  getCurrentUser,
  getSession,
  onAuthStateChange,
} from '@/lib/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface UseAuthReturn extends AuthState {
  signIn: (email: string) => Promise<{ success: boolean; error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { session } = await getSession();
        const { user } = await getCurrentUser();

        setState({
          user: user || null,
          session: session || null,
          isLoading: false,
          isAuthenticated: !!user,
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        setState({
          user: null,
          session: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    };

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);

      setState((prev) => ({
        ...prev,
        user: session?.user || null,
        session: session || null,
        isAuthenticated: !!session?.user,
        isLoading: false,
      }));

      // Handle specific auth events
      if (event === 'SIGNED_IN') {
        router.push('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  // Sign in with magic link
  const signIn = useCallback(async (email: string) => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { error } = await signInWithMagicLink(email);

      if (error) {
        throw error;
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error as Error };
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));

      const { error } = await supabaseSignOut();

      if (error) {
        throw error;
      }

      setState({
        user: null,
        session: null,
        isLoading: false,
        isAuthenticated: false,
      });

      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [router]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        throw error;
      }

      setState((prev) => ({
        ...prev,
        user: session?.user || null,
        session: session || null,
        isAuthenticated: !!session?.user,
      }));
    } catch (error) {
      console.error('Session refresh error:', error);
    }
  }, []);

  return {
    ...state,
    signIn,
    signOut,
    refreshSession,
  };
}

// Hook for protected routes - redirects to login if not authenticated
export function useRequireAuth(redirectTo: string = '/login') {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push(redirectTo);
    }
  }, [auth.isLoading, auth.isAuthenticated, router, redirectTo]);

  return auth;
}

// Hook to redirect authenticated users away from auth pages
export function useRedirectIfAuthenticated(redirectTo: string = '/dashboard') {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && auth.isAuthenticated) {
      router.push(redirectTo);
    }
  }, [auth.isLoading, auth.isAuthenticated, router, redirectTo]);

  return auth;
}

export default useAuth;
