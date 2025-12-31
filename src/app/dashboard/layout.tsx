'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, MobileNav, Header, QuickSearch, ToastProvider, KeyboardShortcuts } from '@/components';
import { DataProvider } from '@/lib/useLocalStorage';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Cmd/Ctrl + K: Quick search
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen((prev) => !prev);
    }
    // Cmd/Ctrl + /: Toggle sidebar
    if ((e.metaKey || e.ctrlKey) && e.key === '/') {
      e.preventDefault();
      setSidebarCollapsed((prev) => !prev);
    }
    // ?: Show keyboard shortcuts (only when not in input)
    if (e.key === '?' && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      setShortcutsOpen(true);
    }
    // Escape: Close modals
    if (e.key === 'Escape') {
      setSearchOpen(false);
      setShortcutsOpen(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <DataProvider>
      <ToastProvider>
        <div className="flex min-h-screen bg-lab-bg">
          {/* Desktop Sidebar */}
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            <Header onSearchClick={() => setSearchOpen(true)} />

            {/* Page content with padding for mobile nav */}
            <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
              {children}
            </main>
          </div>

          {/* Mobile Navigation */}
          <MobileNav />

          {/* Quick Search Modal */}
          <QuickSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />

          {/* Keyboard Shortcuts Modal */}
          <KeyboardShortcuts isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        </div>
      </ToastProvider>
    </DataProvider>
  );
}
