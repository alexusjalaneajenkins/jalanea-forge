// Database types for Supabase
// These match the actual schema in Supabase

export type UserRole = 'owner' | 'beta_tester' | 'free' | 'starter' | 'pro';

export interface Profile {
  id: string;
  email: string | null;
  display_name: string | null;
  role: UserRole;
  api_key_encrypted: string | null;
  ai_generations_used: number;
  ai_generations_limit: number;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  is_student: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string; // Project name/title
  idea_input: string | null;
  vision_statement: string | null; // Synthesized idea
  research_data: any | null; // JSONB array of research documents
  prd_content: string | null;
  realization_tasks: string | null; // Roadmap/tasks output
  current_step: number;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: string;
  user_id: string;
  action_type: string;
  tokens_used: number | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>;
      };
      usage_logs: {
        Row: UsageLog;
        Insert: Omit<UsageLog, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<UsageLog, 'id' | 'created_at'>>;
      };
    };
  };
}
