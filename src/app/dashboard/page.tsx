'use client';

import React from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  FlaskConical,
  Users,
  Wrench,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
  Rocket,
  Code,
  Lightbulb,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components';
import { useData } from '@/lib/useLocalStorage';

const iconMap: Record<string, React.ReactNode> = {
  experiment: <FlaskConical className="w-4 h-4 text-purple-400" />,
  client: <Users className="w-4 h-4 text-blue-400" />,
  deploy: <Rocket className="w-4 h-4 text-green-400" />,
  tool: <Wrench className="w-4 h-4 text-lab-accent" />,
  idea: <Lightbulb className="w-4 h-4 text-yellow-400" />,
};

export default function DashboardPage() {
  const { data, isLoading } = useData();

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lab-accent" />
      </div>
    );
  }

  // Calculate dynamic stats from actual data
  const totalProjects = data.lab.length;
  const activeExperiments = data.lab.filter(
    (p) => p.status === 'building' || p.status === 'testing'
  ).length;
  const liveProducts = data.lab.filter((p) => p.status === 'graduated').length;
  const ideasInQueue = data.lab.filter((p) => p.status === 'idea').length;
  const clientProjects = data.clients.length;
  const liveDeployments = data.dev.filter((d) => d.status === 'production').length;

  const statCards = [
    {
      label: 'Total Projects',
      value: totalProjects,
      icon: <FolderKanban className="w-5 h-5" />,
      color: 'text-lab-accent',
      bg: 'bg-lab-accent/10',
    },
    {
      label: 'Active Experiments',
      value: activeExperiments,
      icon: <FlaskConical className="w-5 h-5" />,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      label: 'Live Products',
      value: liveProducts,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Ideas in Queue',
      value: ideasInQueue,
      icon: <Lightbulb className="w-5 h-5" />,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
  ];

  const quickActions = [
    {
      label: 'New Project Idea',
      description: 'Capture a new product idea',
      href: '/dashboard/lab',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-purple-400',
    },
    {
      label: 'Client Preview',
      description: 'Create a client preview link',
      href: '/dashboard/clients',
      icon: <Users className="w-5 h-5" />,
      color: 'text-blue-400',
    },
    {
      label: 'Quick Capture',
      description: 'Jot down a quick note',
      href: '/dashboard/tools',
      icon: <Wrench className="w-5 h-5" />,
      color: 'text-lab-accent',
    },
  ];

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-lab-text">Welcome back</h1>
        <p className="text-sm text-lab-muted mt-1">
          {liveDeployments} live deployment{liveDeployments !== 1 ? 's' : ''} • {clientProjects} client preview{clientProjects !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-lab-card border border-lab-border rounded-xl p-4 hover:border-lab-accent/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-lab-text">{stat.value}</div>
            <div className="text-sm text-lab-muted">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-lab-card border border-lab-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-lab-text">Recent Activity</h2>
            <Clock className="w-4 h-4 text-lab-muted" />
          </div>

          <div className="space-y-3">
            {data.activity.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-lab-bg/50 hover:bg-lab-border/50 transition-colors"
              >
                <div className="p-2 rounded-lg bg-lab-card border border-lab-border">
                  {iconMap[item.type] || <Code className="w-4 h-4 text-lab-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-lab-text truncate">
                    <span className="text-lab-muted">{item.action}</span>{' '}
                    <span className="font-medium">{item.target}</span>
                  </p>
                </div>
                <span className="text-xs text-lab-muted-dark whitespace-nowrap">
                  {formatDate(item.timestamp)}
                </span>
              </div>
            ))}
          </div>

          {data.activity.length === 0 && (
            <p className="text-center text-lab-muted py-8">No recent activity</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-lab-card border border-lab-border rounded-xl p-5">
          <h2 className="text-lg font-semibold text-lab-text mb-4">Quick Actions</h2>

          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                href={action.href}
                className="flex items-center gap-3 p-3 rounded-lg bg-lab-bg/50 hover:bg-lab-border/50 transition-colors group"
              >
                <div className={`p-2 rounded-lg bg-lab-card border border-lab-border ${action.color}`}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-lab-text">{action.label}</p>
                  <p className="text-xs text-lab-muted truncate">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-lab-muted-dark group-hover:text-lab-accent group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-lab-border">
            <Link href="/dashboard/lab">
              <Button className="w-full" icon={<Plus className="w-4 h-4" />}>
                Add New Project
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/dashboard/lab"
          className="flex items-center gap-3 p-4 bg-lab-card border border-lab-border rounded-xl hover:border-lab-accent/30 transition-colors group"
        >
          <FlaskConical className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-lab-text">Lab</span>
          <ArrowRight className="w-4 h-4 text-lab-muted-dark ml-auto group-hover:text-lab-accent group-hover:translate-x-1 transition-all" />
        </Link>
        <Link
          href="/dashboard/tools"
          className="flex items-center gap-3 p-4 bg-lab-card border border-lab-border rounded-xl hover:border-lab-accent/30 transition-colors group"
        >
          <Wrench className="w-5 h-5 text-lab-accent" />
          <span className="font-medium text-lab-text">Tools</span>
          <ArrowRight className="w-4 h-4 text-lab-muted-dark ml-auto group-hover:text-lab-accent group-hover:translate-x-1 transition-all" />
        </Link>
        <Link
          href="/dashboard/clients"
          className="flex items-center gap-3 p-4 bg-lab-card border border-lab-border rounded-xl hover:border-lab-accent/30 transition-colors group"
        >
          <Users className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-lab-text">Clients</span>
          <ArrowRight className="w-4 h-4 text-lab-muted-dark ml-auto group-hover:text-lab-accent group-hover:translate-x-1 transition-all" />
        </Link>
        <Link
          href="/dashboard/dev"
          className="flex items-center gap-3 p-4 bg-lab-card border border-lab-border rounded-xl hover:border-lab-accent/30 transition-colors group"
        >
          <Code className="w-5 h-5 text-green-400" />
          <span className="font-medium text-lab-text">Dev</span>
          <ArrowRight className="w-4 h-4 text-lab-muted-dark ml-auto group-hover:text-lab-accent group-hover:translate-x-1 transition-all" />
        </Link>
      </div>
    </div>
  );
}
