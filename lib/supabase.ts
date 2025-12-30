import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Supabase configuration - anon key is safe for client-side use
const supabaseUrl = 'https://azdghysdkaacusknwoxf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6ZGdoeXNka2FhY3Vza253b3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMDkwODUsImV4cCI6MjA4MjY4NTA4NX0.uWlR73OJ9mMGiE6TOzRBRZL8LOv2QhSLkF5yzur8pK4';

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Helper to get the current user
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Helper to get the current session
export const getCurrentSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};
