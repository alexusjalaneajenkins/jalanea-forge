'use client';

import React from 'react';
import Link from 'next/link';
import { FlaskConical, LogOut, Menu, Search, Command } from 'lucide-react';
import { logout } from '@/lib/auth';

interface HeaderProps {
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}

export function Header({ onMenuClick, onSearchClick }: HeaderProps) {
  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <header className="sticky top-0 z-20 bg-lab-bg/80 backdrop-blur-lg border-b border-lab-border">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-lg hover:bg-lab-card text-lab-muted hover:text-lab-text transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo for mobile */}
          <Link href="/dashboard" className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-lab-accent rounded-lg flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-lab-bg" />
            </div>
            <span className="font-bold text-lab-text">Jalanea Lab</span>
          </Link>

          {/* Welcome message for desktop */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-lab-text">Welcome back, Jalanea</h1>
            <p className="text-sm text-lab-muted">Here&apos;s what&apos;s happening in your lab</p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Search button */}
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-lab-card border border-lab-border hover:border-lab-accent/50 text-lab-muted hover:text-lab-text transition-all"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline text-sm">Search</span>
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 text-xs bg-lab-border rounded">
              <Command className="w-3 h-3" />K
            </kbd>
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-lab-muted hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
