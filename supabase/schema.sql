-- Jalanea Forge Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'free' CHECK (role IN ('owner', 'beta_tester', 'free', 'starter', 'pro')),
  api_key_encrypted TEXT, -- For beta testers who bring their own key
  ai_generations_used INT DEFAULT 0,
  ai_generations_limit INT DEFAULT 25,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE,
  is_student BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Project',
  current_step INT DEFAULT 1,
  idea_input TEXT,
  synthesized_idea TEXT,
  research_data JSONB DEFAULT '[]'::jsonb,
  prd_content TEXT,
  prd_version_history JSONB DEFAULT '[]'::jsonb,
  roadmap_output TEXT,
  design_system_output TEXT,
  code_prompt_output TEXT,
  research_mission_prompt TEXT,
  report_generation_prompt TEXT,
  completed_roadmap_steps TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USAGE LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'vision_generation', 'prd_generation', 'task_generation', 'prd_refinement'
  tokens_used INT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON public.profiles(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON public.projects(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON public.usage_logs(action_type);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Owner can view all profiles (for admin panel)
CREATE POLICY "Owner can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Owner can update any profile (for role management)
CREATE POLICY "Owner can update any profile"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- Projects policies
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view their own usage logs"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own usage logs"
  ON public.usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Owner can view all usage logs
CREATE POLICY "Owner can view all usage logs"
  ON public.usage_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to reset monthly usage (run via cron)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET ai_generations_used = 0
  WHERE current_period_end IS NULL
     OR current_period_end < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================

-- To set yourself as owner, run this after signing up:
-- UPDATE public.profiles SET role = 'owner' WHERE email = 'your-email@example.com';
