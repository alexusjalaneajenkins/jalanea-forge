'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FlaskConical,
  Wrench,
  Sparkles,
  Users,
  Code,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { logout } from '@/lib/auth';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Lab / Sandbox', href: '/dashboard/lab', icon: <FlaskConical className="w-5 h-5" /> },
  { label: 'Brainstorm', href: '/dashboard/brainstorm', icon: <Sparkles className="w-5 h-5" /> },
  { label: 'Internal Tools', href: '/dashboard/tools', icon: <Wrench className="w-5 h-5" /> },
  { label: 'Client Previews', href: '/dashboard/clients', icon: <Users className="w-5 h-5" /> },
  { label: 'Dev Environment', href: '/dashboard/dev', icon: <Code className="w-5 h-5" /> },
  { label: 'Settings', href: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <aside
      className={`
        hidden md:flex flex-col
        bg-lab-card border-r border-lab-border
        transition-all duration-300 h-screen sticky top-0
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-lab-border">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-lab-accent rounded-lg flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-lab-bg" />
            </div>
            <span className="font-bold text-lab-text">Jalnaea Dev</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-lab-accent rounded-lg flex items-center justify-center mx-auto">
            <FlaskConical className="w-5 h-5 text-lab-bg" />
          </div>
        )}
        {onToggle && !collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-lab-border text-lab-muted hover:text-lab-text transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg
                transition-all duration-200
                ${isActive
                  ? 'bg-lab-accent/10 text-lab-accent border border-lab-accent/20'
                  : 'text-lab-muted hover:bg-lab-border hover:text-lab-text'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span className="font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-lab-border">
        {collapsed && onToggle && (
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center p-2.5 rounded-lg hover:bg-lab-border text-lab-muted hover:text-lab-text transition-colors mb-2"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
            text-lab-muted hover:bg-red-500/10 hover:text-red-400
            transition-all duration-200
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}
