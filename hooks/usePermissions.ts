// Role-Based Access Control Hook for Jalanea Forge
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../lib/database.types';

// Permission definitions for each role
const ROLE_PERMISSIONS = {
  owner: {
    // Full access to everything
    canAccessAdmin: true,
    canManageUsers: true,
    canViewAllProjects: true,
    canViewAllUsageLogs: true,
    canUseOwnApiKey: true,
    canUseProxyApi: true,
    hasUnlimitedGenerations: true,
    canExportPrd: true,
    canAccessVersionHistory: true,
    maxProjects: Infinity,
    generationsLimit: Infinity,
  },
  beta_tester: {
    // Beta testers bring their own API key, unlimited usage
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAllProjects: false,
    canViewAllUsageLogs: false,
    canUseOwnApiKey: true,
    canUseProxyApi: false, // Must use own key
    hasUnlimitedGenerations: true,
    canExportPrd: true,
    canAccessVersionHistory: true,
    maxProjects: Infinity,
    generationsLimit: Infinity,
  },
  pro: {
    // Paid pro tier
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAllProjects: false,
    canViewAllUsageLogs: false,
    canUseOwnApiKey: true,
    canUseProxyApi: true,
    hasUnlimitedGenerations: false,
    canExportPrd: true,
    canAccessVersionHistory: true,
    maxProjects: Infinity,
    generationsLimit: 500, // Per month
  },
  starter: {
    // Paid starter tier
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAllProjects: false,
    canViewAllUsageLogs: false,
    canUseOwnApiKey: true,
    canUseProxyApi: true,
    hasUnlimitedGenerations: false,
    canExportPrd: true,
    canAccessVersionHistory: true,
    maxProjects: 10,
    generationsLimit: 100, // Per month
  },
  free: {
    // Free tier (default)
    canAccessAdmin: false,
    canManageUsers: false,
    canViewAllProjects: false,
    canViewAllUsageLogs: false,
    canUseOwnApiKey: true, // Can bring own key for unlimited
    canUseProxyApi: true,
    hasUnlimitedGenerations: false,
    canExportPrd: false, // Upgrade to export
    canAccessVersionHistory: false, // Upgrade for version history
    maxProjects: 3,
    generationsLimit: 25, // Per month
  },
} as const;

export type Permission = keyof (typeof ROLE_PERMISSIONS)['owner'];

export interface PermissionsState {
  role: UserRole | null;
  isOwner: boolean;
  isBetaTester: boolean;
  isPaidUser: boolean;
  permissions: (typeof ROLE_PERMISSIONS)[UserRole];
  hasPermission: (permission: Permission) => boolean;
  canPerformAction: (action: FeatureAction) => { allowed: boolean; reason?: string };
}

// Feature actions that can be gated
export type FeatureAction =
  | 'generate_ai'
  | 'export_prd'
  | 'view_version_history'
  | 'create_project'
  | 'access_admin'
  | 'manage_users';

export const usePermissions = (): PermissionsState => {
  const { profile } = useAuth();

  return useMemo(() => {
    const role = profile?.role ?? 'free';
    const permissions = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.free;

    const isOwner = role === 'owner';
    const isBetaTester = role === 'beta_tester';
    const isPaidUser = role === 'pro' || role === 'starter';

    const hasPermission = (permission: Permission): boolean => {
      return permissions[permission] as boolean;
    };

    const canPerformAction = (
      action: FeatureAction
    ): { allowed: boolean; reason?: string } => {
      switch (action) {
        case 'generate_ai': {
          if (permissions.hasUnlimitedGenerations) {
            return { allowed: true };
          }
          if (!profile) {
            return { allowed: false, reason: 'Please sign in to use AI features.' };
          }
          if (profile.ai_generations_used >= profile.ai_generations_limit) {
            return {
              allowed: false,
              reason: `You've used all ${profile.ai_generations_limit} generations this month. Upgrade for more!`,
            };
          }
          return { allowed: true };
        }

        case 'export_prd': {
          if (!permissions.canExportPrd) {
            return {
              allowed: false,
              reason: 'Upgrade to Starter or Pro to export PRDs.',
            };
          }
          return { allowed: true };
        }

        case 'view_version_history': {
          if (!permissions.canAccessVersionHistory) {
            return {
              allowed: false,
              reason: 'Upgrade to Starter or Pro to access version history.',
            };
          }
          return { allowed: true };
        }

        case 'create_project': {
          if (!profile) {
            return { allowed: false, reason: 'Please sign in to create projects.' };
          }
          // Note: Would need to fetch project count from database
          // For now, always allow - project limit checked elsewhere
          return { allowed: true };
        }

        case 'access_admin': {
          if (!permissions.canAccessAdmin) {
            return { allowed: false, reason: 'Admin access requires owner role.' };
          }
          return { allowed: true };
        }

        case 'manage_users': {
          if (!permissions.canManageUsers) {
            return { allowed: false, reason: 'User management requires owner role.' };
          }
          return { allowed: true };
        }

        default:
          return { allowed: false, reason: 'Unknown action.' };
      }
    };

    return {
      role: profile?.role ?? null,
      isOwner,
      isBetaTester,
      isPaidUser,
      permissions,
      hasPermission,
      canPerformAction,
    };
  }, [profile]);
};

// Hook to check a single permission easily
export const useHasPermission = (permission: Permission): boolean => {
  const { hasPermission } = usePermissions();
  return hasPermission(permission);
};

// Hook to check if user should see upgrade prompts
export const useShouldShowUpgrade = (): boolean => {
  const { role, isPaidUser, isOwner, isBetaTester } = usePermissions();
  // Don't show upgrade prompts to paid users, owners, or beta testers
  return !isPaidUser && !isOwner && !isBetaTester;
};

// Get tier display name
export const getTierDisplayName = (role: UserRole): string => {
  const names: Record<UserRole, string> = {
    owner: 'Owner',
    beta_tester: 'Beta Tester',
    pro: 'Pro',
    starter: 'Starter',
    free: 'Free',
  };
  return names[role] || 'Free';
};

// Get tier badge color class
export const getTierBadgeClass = (role: UserRole): string => {
  const classes: Record<UserRole, string> = {
    owner: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    beta_tester: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    pro: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    starter: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    free: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  };
  return classes[role] || classes.free;
};
