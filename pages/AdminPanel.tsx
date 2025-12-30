import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  BarChart3,
  Shield,
  ArrowLeft,
  Search,
  ChevronDown,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions, getTierDisplayName, getTierBadgeClass } from '../hooks/usePermissions';
import {
  getAllUsers,
  updateUserRole,
  getAllUsageLogs,
  getUsageStatsByUser
} from '../services/supabaseService';
import type { Profile, UsageLog, UserRole } from '../lib/database.types';

const ROLES: UserRole[] = ['owner', 'beta_tester', 'pro', 'starter', 'free'];

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { canPerformAction } = usePermissions();

  const [users, setUsers] = useState<Profile[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'usage'>('users');
  const [error, setError] = useState<string | null>(null);

  // Check admin access
  const accessCheck = canPerformAction('access_admin');

  useEffect(() => {
    if (!accessCheck.allowed) {
      navigate('/');
      return;
    }
    loadData();
  }, [accessCheck.allowed, navigate]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersData, logsData] = await Promise.all([
        getAllUsers(),
        getAllUsageLogs(100)
      ]);
      setUsers(usersData);
      setUsageLogs(logsData);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === user?.id && newRole !== 'owner') {
      if (!confirm('Are you sure you want to remove owner access from yourself?')) {
        return;
      }
    }

    const success = await updateUserRole(userId, newRole);
    if (success) {
      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } else {
      alert('Failed to update user role');
    }
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalUsers: users.length,
    freeUsers: users.filter(u => u.role === 'free').length,
    paidUsers: users.filter(u => u.role === 'starter' || u.role === 'pro').length,
    betaTesters: users.filter(u => u.role === 'beta_tester').length,
    totalGenerations: users.reduce((sum, u) => sum + u.ai_generations_used, 0)
  };

  if (!accessCheck.allowed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-forge-950 text-forge-text">
      {/* Header */}
      <header className="h-16 border-b border-forge-700 bg-forge-950/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-forge-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-forge-accent" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-forge-800 hover:bg-forge-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-forge-900 border border-forge-700 rounded-xl p-4">
            <p className="text-sm text-forge-muted mb-1">Total Users</p>
            <p className="text-2xl font-bold">{stats.totalUsers}</p>
          </div>
          <div className="bg-forge-900 border border-forge-700 rounded-xl p-4">
            <p className="text-sm text-forge-muted mb-1">Free Users</p>
            <p className="text-2xl font-bold">{stats.freeUsers}</p>
          </div>
          <div className="bg-forge-900 border border-forge-700 rounded-xl p-4">
            <p className="text-sm text-forge-muted mb-1">Paid Users</p>
            <p className="text-2xl font-bold text-emerald-500">{stats.paidUsers}</p>
          </div>
          <div className="bg-forge-900 border border-forge-700 rounded-xl p-4">
            <p className="text-sm text-forge-muted mb-1">Beta Testers</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.betaTesters}</p>
          </div>
          <div className="bg-forge-900 border border-forge-700 rounded-xl p-4">
            <p className="text-sm text-forge-muted mb-1">Total AI Gens</p>
            <p className="text-2xl font-bold text-forge-accent">{stats.totalGenerations}</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'users'
                ? 'bg-forge-accent text-white'
                : 'bg-forge-800 hover:bg-forge-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'usage'
                ? 'bg-forge-accent text-white'
                : 'bg-forge-800 hover:bg-forge-700'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Usage Logs
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="bg-forge-900 border border-forge-700 rounded-xl overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-forge-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forge-muted" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-forge-800 border border-forge-700 rounded-lg focus:outline-none focus:border-forge-accent"
                />
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-forge-800">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-forge-muted">User</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-forge-muted">Role</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-forge-muted">Generations</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-forge-muted">Joined</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-forge-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-forge-muted">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-forge-muted">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="border-t border-forge-800 hover:bg-forge-800/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-forge-700 flex items-center justify-center text-sm font-medium">
                                {u.display_name?.charAt(0) || u.email?.charAt(0) || '?'}
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{u.display_name || 'Unknown'}</p>
                              <p className="text-sm text-forge-muted">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierBadgeClass(u.role)}`}>
                            {getTierDisplayName(u.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-forge-muted">
                            {u.ai_generations_used} / {u.role === 'owner' || u.role === 'beta_tester' ? '∞' : u.ai_generations_limit}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-forge-muted">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="relative inline-block">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                              className="appearance-none bg-forge-800 border border-forge-700 rounded-lg px-3 py-1.5 pr-8 text-sm focus:outline-none focus:border-forge-accent cursor-pointer"
                            >
                              {ROLES.map(role => (
                                <option key={role} value={role}>
                                  {getTierDisplayName(role)}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-forge-muted" />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="bg-forge-900 border border-forge-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-forge-700">
              <h3 className="font-medium">Recent Usage Logs</h3>
              <p className="text-sm text-forge-muted">Last 100 AI generation events</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-forge-800">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-forge-muted">Action</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-forge-muted">User ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-forge-muted">Tokens</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-forge-muted">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-forge-muted">
                        Loading logs...
                      </td>
                    </tr>
                  ) : usageLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-forge-muted">
                        No usage logs found
                      </td>
                    </tr>
                  ) : (
                    usageLogs.map((log) => (
                      <tr key={log.id} className="border-t border-forge-800 hover:bg-forge-800/50">
                        <td className="px-4 py-3">
                          <span className="capitalize">{log.action_type.replace(/_/g, ' ')}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-forge-muted">
                          {log.user_id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-forge-muted">
                          {log.tokens_used || '-'}
                        </td>
                        <td className="px-4 py-3 text-forge-muted">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;
