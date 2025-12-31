'use client';

import React, { useState } from 'react';
import { Settings, Key, Download, Upload, Trash2, LogOut } from 'lucide-react';
import { Button, Input, ConfirmModal, useToast } from '@/components';
import { logout, verifyPassword } from '@/lib/auth';
import projectData from '@/data/projects.json';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showClearModal, setShowClearModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleChangePassword = () => {
    if (!verifyPassword(currentPassword)) {
      showToast('error', 'Current password is incorrect');
      return;
    }
    if (newPassword.length < 8) {
      showToast('error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Passwords do not match');
      return;
    }
    // In a real app, this would update the password
    showToast('info', 'Password change would be saved here (demo mode)');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(projectData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jalanea-lab-data.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Data exported successfully!');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        console.log('Imported data:', data);
        showToast('success', 'Data imported! (Would be saved in real app)');
      } catch {
        showToast('error', 'Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    // In a real app, this would clear all data
    showToast('info', 'All data would be cleared here (demo mode)');
    setShowClearModal(false);
  };

  const handleLogoutEverywhere = () => {
    logout();
    setShowLogoutModal(false);
    window.location.href = '/';
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-lab-text">Settings</h1>
        <p className="text-sm text-lab-muted mt-1">Manage your Jalanea Lab preferences</p>
      </div>

      {/* Change Password */}
      <div className="bg-lab-card border border-lab-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-lab-bg rounded-lg">
            <Key className="w-5 h-5 text-lab-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-lab-text">Change Password</h2>
            <p className="text-xs text-lab-muted">Update your master password</p>
          </div>
        </div>

        <div className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            showPasswordToggle
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            showPasswordToggle
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            showPasswordToggle
          />
          <Button
            onClick={handleChangePassword}
            disabled={!currentPassword || !newPassword || !confirmPassword}
          >
            Update Password
          </Button>
        </div>
      </div>

      {/* Export/Import Data */}
      <div className="bg-lab-card border border-lab-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-lab-bg rounded-lg">
            <Settings className="w-5 h-5 text-lab-accent" />
          </div>
          <div>
            <h2 className="font-semibold text-lab-text">Data Management</h2>
            <p className="text-xs text-lab-muted">Export or import your project data</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={handleExportData}
            icon={<Download className="w-4 h-4" />}
          >
            Export Data
          </Button>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".json"
              onChange={handleImportData}
              className="hidden"
            />
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lab-border text-lab-text hover:bg-lab-border/80 transition-colors text-sm font-medium">
              <Upload className="w-4 h-4" />
              Import Data
            </span>
          </label>
        </div>

        <p className="text-xs text-lab-muted-dark mt-3">
          Export creates a JSON backup of all your projects, tools, clients, and deployments.
        </p>
      </div>

      {/* Danger Zone */}
      <div className="bg-lab-card border border-red-500/30 rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-red-500/10 rounded-lg">
            <Trash2 className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold text-red-400">Danger Zone</h2>
            <p className="text-xs text-lab-muted">Irreversible actions</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            variant="danger"
            onClick={() => setShowClearModal(true)}
            icon={<Trash2 className="w-4 h-4" />}
          >
            Clear All Data
          </Button>

          <Button
            variant="danger"
            onClick={() => setShowLogoutModal(true)}
            icon={<LogOut className="w-4 h-4" />}
          >
            Logout Everywhere
          </Button>
        </div>
      </div>

      {/* About */}
      <div className="bg-lab-card border border-lab-border rounded-xl p-5">
        <h2 className="font-semibold text-lab-text mb-2">About Jalanea Lab</h2>
        <p className="text-sm text-lab-muted mb-4">
          Your private command center for managing projects, experiments, and tools.
        </p>
        <div className="text-xs text-lab-muted-dark space-y-1">
          <p>Version: 1.0.0</p>
          <p>Built with Next.js 14, Tailwind CSS, and ❤️</p>
          <p className="text-lab-accent">jalnaea.dev</p>
        </div>
      </div>

      {/* Clear Data Modal */}
      <ConfirmModal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearData}
        title="Clear All Data"
        message="Are you sure you want to clear all data? This will remove all projects, tools, clients, and deployments. This action cannot be undone."
        confirmText="Clear Everything"
        danger
      />

      {/* Logout Everywhere Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogoutEverywhere}
        title="Logout Everywhere"
        message="This will clear your authentication cookie and redirect you to the login page."
        confirmText="Logout"
        danger
      />
    </div>
  );
}
