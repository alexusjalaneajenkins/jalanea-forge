'use client';

import React from 'react';
import type { LabStatus, ClientStatus, DevStatus, ToolCategory } from '@/lib/types';

type BadgeVariant = LabStatus | ClientStatus | DevStatus | ToolCategory | 'default';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export function Badge({ variant, children, size = 'sm' }: BadgeProps) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const variants: Record<BadgeVariant, string> = {
    // Lab statuses
    idea: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    building: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    testing: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    graduated: 'bg-green-500/20 text-green-400 border border-green-500/30',

    // Client statuses
    draft: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
    sent: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    viewed: 'bg-green-500/20 text-green-400 border border-green-500/30',
    expired: 'bg-red-500/20 text-red-400 border border-red-500/30',

    // Dev statuses
    development: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    staging: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    production: 'bg-green-500/20 text-green-400 border border-green-500/30',

    // Tool categories
    Learning: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    Productivity: 'bg-lab-accent/20 text-lab-accent border border-lab-accent/30',
    Business: 'bg-green-500/20 text-green-400 border border-green-500/30',
    Development: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    Research: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',

    // Default
    default: 'bg-lab-border text-lab-muted border border-lab-border',
  };

  return (
    <span className={`${baseStyles} ${sizes[size]} ${variants[variant] || variants.default}`}>
      {children}
    </span>
  );
}
