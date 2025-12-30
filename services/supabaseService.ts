// Supabase Service - CRUD operations for Jalanea Forge
import { supabase } from '../lib/supabase';
import type { Profile, Project, UsageLog, UserRole } from '../lib/database.types';

// ============================================
// PROFILE OPERATIONS
// ============================================

export const getProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data;
};

export const updateProfile = async (
  userId: string,
  updates: Partial<Omit<Profile, 'id' | 'created_at'>>
): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  return data;
};

export const incrementAiGenerations = async (userId: string): Promise<boolean> => {
  // Fall back to manual update since RPC might not exist
  const profile = await getProfile(userId);
  if (profile) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ ai_generations_used: profile.ai_generations_used + 1 })
      .eq('id', userId);
    return !updateError;
  }
  return false;
};

export const canUseAiGeneration = async (userId: string): Promise<boolean> => {
  const profile = await getProfile(userId);
  if (!profile) return false;

  // Owner and beta_tester have unlimited access
  if (profile.role === 'owner' || profile.role === 'beta_tester') {
    return true;
  }

  // Check if user has generations remaining
  return profile.ai_generations_used < profile.ai_generations_limit;
};

export const saveApiKey = async (userId: string, apiKey: string): Promise<boolean> => {
  // Note: In production, encrypt the API key before storing
  // For now, we'll store it as-is (Supabase handles encryption at rest)
  const { error } = await supabase
    .from('profiles')
    .update({ api_key_encrypted: apiKey })
    .eq('id', userId);

  return !error;
};

export const getApiKey = async (userId: string): Promise<string | null> => {
  const profile = await getProfile(userId);
  return profile?.api_key_encrypted || null;
};

// ============================================
// PROJECT OPERATIONS
// ============================================

export const createProject = async (
  userId: string,
  name: string = 'Untitled Project'
): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      name,
      current_step: 1,
      research_data: [],
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating project:', error);
    return null;
  }
  return data;
};

export const getProject = async (projectId: string): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error('Error fetching project:', error);
    return null;
  }
  return data;
};

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching user projects:', error);
    return [];
  }
  return data || [];
};

export const updateProject = async (
  projectId: string,
  updates: Partial<Omit<Project, 'id' | 'user_id' | 'created_at'>>
): Promise<Project | null> => {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Error updating project:', error);
    return null;
  }
  return data;
};

export const deleteProject = async (projectId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('Error deleting project:', error);
    return false;
  }
  return true;
};

// ============================================
// USAGE LOGGING
// ============================================

export type ActionType =
  | 'vision_generation'
  | 'prd_generation'
  | 'task_generation'
  | 'prd_refinement'
  | 'research_prompt_generation'
  | 'report_generation';

export const logUsage = async (
  userId: string,
  actionType: ActionType,
  tokensUsed?: number
): Promise<boolean> => {
  const { error } = await supabase
    .from('usage_logs')
    .insert({
      user_id: userId,
      action_type: actionType,
      tokens_used: tokensUsed,
    });

  if (error) {
    console.error('Error logging usage:', error);
    return false;
  }
  return true;
};

export const getUsageStats = async (
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ total: number; byAction: Record<string, number> }> => {
  let query = supabase
    .from('usage_logs')
    .select('action_type, tokens_used')
    .eq('user_id', userId);

  if (startDate) {
    query = query.gte('created_at', startDate.toISOString());
  }
  if (endDate) {
    query = query.lte('created_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error || !data) {
    return { total: 0, byAction: {} };
  }

  const byAction: Record<string, number> = {};
  let total = 0;

  data.forEach((log) => {
    byAction[log.action_type] = (byAction[log.action_type] || 0) + 1;
    total++;
  });

  return { total, byAction };
};

// ============================================
// ADMIN OPERATIONS (Owner only)
// ============================================

export const getAllUsers = async (): Promise<Profile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
  return data || [];
};

export const updateUserRole = async (
  userId: string,
  role: UserRole
): Promise<boolean> => {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  return !error;
};

export const getAllUsageLogs = async (
  limit: number = 100
): Promise<UsageLog[]> => {
  const { data, error } = await supabase
    .from('usage_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching usage logs:', error);
    return [];
  }
  return data || [];
};

export const getUsageStatsByUser = async (): Promise<
  { userId: string; email: string; totalGenerations: number }[]
> => {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, ai_generations_used');

  if (error || !profiles) {
    return [];
  }

  return profiles.map((p) => ({
    userId: p.id,
    email: p.email || 'Unknown',
    totalGenerations: p.ai_generations_used,
  }));
};
