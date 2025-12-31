'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, LayoutDashboard, FlaskConical, Wrench, Users, Code, Settings } from 'lucide-react';

interface SearchItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  category: string;
}

const searchItems: SearchItem[] = [
  { id: '1', title: 'Dashboard', description: 'Main overview', href: '/dashboard', icon: <LayoutDashboard className="w-4 h-4" />, category: 'Navigation' },
  { id: '2', title: 'Lab / Sandbox', description: 'Experiments and ideas', href: '/dashboard/lab', icon: <FlaskConical className="w-4 h-4" />, category: 'Navigation' },
  { id: '3', title: 'Internal Tools', description: 'Productivity tools', href: '/dashboard/tools', icon: <Wrench className="w-4 h-4" />, category: 'Navigation' },
  { id: '4', title: 'Client Previews', description: 'Client project previews', href: '/dashboard/clients', icon: <Users className="w-4 h-4" />, category: 'Navigation' },
  { id: '5', title: 'Dev Environment', description: 'Development deployments', href: '/dashboard/dev', icon: <Code className="w-4 h-4" />, category: 'Navigation' },
  { id: '6', title: 'Settings', description: 'App settings', href: '/dashboard/settings', icon: <Settings className="w-4 h-4" />, category: 'Navigation' },
];

interface QuickSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSearch({ isOpen, onClose }: QuickSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = searchItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = useCallback((item: SearchItem) => {
    router.push(item.href);
    onClose();
    setQuery('');
  }, [router, onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleSelect(filteredItems[selectedIndex]);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredItems, selectedIndex, handleSelect, onClose]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // This would need to be handled by the parent
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Search modal */}
      <div className="relative w-full max-w-lg mx-4 bg-lab-card border border-lab-border rounded-xl shadow-2xl animate-slide-down overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-lab-border">
          <Search className="w-5 h-5 text-lab-muted" />
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-lab-text placeholder:text-lab-muted-dark focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-lab-border text-lab-muted hover:text-lab-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-lab-muted">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-1">
              {filteredItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                    transition-colors
                    ${index === selectedIndex
                      ? 'bg-lab-accent/10 text-lab-accent'
                      : 'text-lab-text hover:bg-lab-border'
                    }
                  `}
                >
                  <div className={`p-1.5 rounded-lg ${index === selectedIndex ? 'bg-lab-accent/20' : 'bg-lab-border'}`}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.title}</div>
                    <div className="text-xs text-lab-muted truncate">{item.description}</div>
                  </div>
                  <span className="text-xs text-lab-muted-dark">{item.category}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-lab-border text-xs text-lab-muted-dark">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-lab-border rounded">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-lab-border rounded">↵</kbd> Select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-lab-border rounded">Esc</kbd> Close
          </span>
        </div>
      </div>
    </div>
  );
}
