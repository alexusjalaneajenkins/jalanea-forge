'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FlaskConical,
  Wrench,
  Users,
  MoreHorizontal,
  Code,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { logout } from '@/lib/auth';

const mainNavItems = [
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Lab', href: '/dashboard/lab', icon: <FlaskConical className="w-5 h-5" /> },
  { label: 'Tools', href: '/dashboard/tools', icon: <Wrench className="w-5 h-5" /> },
  { label: 'Clients', href: '/dashboard/clients', icon: <Users className="w-5 h-5" /> },
];

const moreItems = [
  { label: 'Dev Environment', href: '/dashboard/dev', icon: <Code className="w-5 h-5" /> },
  { label: 'Settings', href: '/dashboard/settings', icon: <Settings className="w-5 h-5" /> },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = React.useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowMore(false)}
          />
          <div className="absolute bottom-20 left-4 right-4 bg-lab-card border border-lab-border rounded-xl p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lab-text">More Options</h3>
              <button
                onClick={() => setShowMore(false)}
                className="p-1 rounded-lg hover:bg-lab-border text-lab-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {moreItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setShowMore(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    ${pathname === item.href
                      ? 'bg-lab-accent/10 text-lab-accent'
                      : 'text-lab-muted hover:bg-lab-border hover:text-lab-text'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-lab-card border-t border-lab-border safe-area-inset-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {mainNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[64px]
                  transition-colors
                  ${isActive
                    ? 'text-lab-accent'
                    : 'text-lab-muted hover:text-lab-text'
                  }
                `}
              >
                {item.icon}
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(true)}
            className={`
              flex flex-col items-center gap-1 px-3 py-2 rounded-lg min-w-[64px]
              transition-colors text-lab-muted hover:text-lab-text
            `}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
