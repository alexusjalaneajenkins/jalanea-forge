import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getProfile } from '../services/supabaseService';
import type { Profile, UserRole } from '../lib/database.types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName?: string) => Promise<void>;
  logOut: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile when user changes
  const fetchProfile = async (userId: string) => {
    const profileData = await getProfile(userId);
    setProfile(profileData);
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        }

        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          if (session?.user) {
            fetchProfile(session.user.id).catch(console.error);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Small delay to ensure profile trigger has completed
          setTimeout(() => {
            if (mounted) fetchProfile(session.user.id).catch(console.error);
          }, 100);
        } else {
          setProfile(null);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    console.log('signInWithGoogle called');
    setError(null);
    try {
      // Build redirect URL with base path for GitHub Pages
      const redirectUrl = `${window.location.origin}/jalanea-forge/`;
      console.log('Redirect URL:', redirectUrl);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      console.log('OAuth response:', { data, error });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      let msg = 'Failed to sign in with Google.';
      if (error.message) {
        msg = error.message;
      }
      setError(msg);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing in:', error);
      let msg = 'Failed to sign in.';
      if (error.message === 'Invalid login credentials') {
        msg = 'Invalid email or password.';
      } else if (error.message) {
        msg = error.message;
      }
      setError(msg);
    }
  };

  const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    setError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: displayName || email.split('@')[0],
          },
        },
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Error signing up:', error);
      let msg = 'Failed to create account.';
      if (error.message?.includes('already registered')) {
        msg = 'An account with this email already exists.';
      } else if (error.message) {
        msg = error.message;
      }
      setError(msg);
    }
  };

  const logOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setError(null);
    } catch (error: any) {
      console.error('Error signing out:', error);
      setError(error.message || 'Failed to sign out.');
    }
  };

  const clearError = () => setError(null);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        error,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logOut,
        clearError,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// Helper hook to check if user has a specific role
export const useUserRole = (): UserRole | null => {
  const { profile } = useAuth();
  return profile?.role ?? null;
};

// Helper hook to check if user can perform AI generations
export const useCanGenerate = (): boolean => {
  const { profile } = useAuth();
  if (!profile) return false;

  // Owner and beta_tester have unlimited access
  if (profile.role === 'owner' || profile.role === 'beta_tester') {
    return true;
  }

  return profile.ai_generations_used < profile.ai_generations_limit;
};

// Helper hook to get remaining generations
export const useRemainingGenerations = (): { used: number; limit: number; unlimited: boolean } => {
  const { profile } = useAuth();
  if (!profile) return { used: 0, limit: 0, unlimited: false };

  const unlimited = profile.role === 'owner' || profile.role === 'beta_tester';
  return {
    used: profile.ai_generations_used,
    limit: profile.ai_generations_limit,
    unlimited,
  };
};
