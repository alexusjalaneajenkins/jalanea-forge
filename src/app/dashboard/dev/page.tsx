'use client';

import React, { useState } from 'react';
import { Plus, Code, ExternalLink, GitBranch, Github, Filter, Clock } from 'lucide-react';
import { Button, Modal, Input, EmptyState, ConfirmModal, useToast } from '@/components';
import { useData } from '@/lib/useLocalStorage';
import type { DevProject, DevStatus } from '@/lib/types';

const statusOptions: DevStatus[] = ['development', 'staging', 'production'];

const statusColors: Record<DevStatus, { dot: string; bg: string }> = {
  development: { dot: 'bg-blue-400', bg: 'bg-blue-500/10 text-blue-400' },
  staging: { dot: 'bg-yellow-400', bg: 'bg-yellow-500/10 text-yellow-400' },
  production: { dot: 'bg-green-400', bg: 'bg-green-500/10 text-green-400' },
};

export default function DevPage() {
  const { showToast } = useToast();
  const { data, updateSection, addActivity, isLoading } = useData();
  const [filterStatus, setFilterStatus] = useState<DevStatus | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<DevProject | null>(null);
  const [formData, setFormData] = useState({
    projectName: '',
    description: '',
    branch: 'main',
    previewUrl: '',
    status: 'development' as DevStatus,
    repoUrl: '',
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lab-accent" />
      </div>
    );
  }

  const projects = data.dev;

  const filteredProjects = filterStatus === 'all'
    ? projects
    : projects.filter((p) => p.status === filterStatus);

  const handleAdd = () => {
    const newProject: DevProject = {
      id: Date.now().toString(),
      ...formData,
      lastDeployedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString().split('T')[0],
    };
    updateSection('dev', (current) => [newProject, ...current]);
    addActivity('deploy', 'Added deployment', formData.projectName);
    setShowAddModal(false);
    resetForm();
    showToast('success', 'Deployment added!');
  };

  const handleEdit = () => {
    if (!selectedProject) return;
    updateSection('dev', (current) =>
      current.map((p) =>
        p.id === selectedProject.id
          ? { ...p, ...formData, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    setShowEditModal(false);
    setSelectedProject(null);
    resetForm();
    showToast('success', 'Deployment updated!');
  };

  const handleDelete = () => {
    if (!selectedProject) return;
    updateSection('dev', (current) => current.filter((p) => p.id !== selectedProject.id));
    setShowDeleteModal(false);
    setSelectedProject(null);
    showToast('success', 'Deployment removed!');
  };

  const openEditModal = (project: DevProject) => {
    setSelectedProject(project);
    setFormData({
      projectName: project.projectName,
      description: project.description,
      branch: project.branch,
      previewUrl: project.previewUrl,
      status: project.status,
      repoUrl: project.repoUrl,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (project: DevProject) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      projectName: '',
      description: '',
      branch: 'main',
      previewUrl: '',
      status: 'development',
      repoUrl: '',
    });
  };

  const formatDeployTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-lab-text">Dev Environment</h1>
          <p className="text-sm text-lab-muted mt-1">
            {projects.filter(p => p.status === 'production').length} live, {projects.filter(p => p.status !== 'production').length} in development
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={<Plus className="w-4 h-4" />}>
          Add Deployment
        </Button>
      </div>

      {/* Environment Switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-lab-muted" />
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            filterStatus === 'all'
              ? 'bg-lab-accent text-lab-bg'
              : 'bg-lab-card text-lab-muted hover:text-lab-text'
          }`}
        >
          All
        </button>
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1.5 ${
              filterStatus === status
                ? statusColors[status].bg
                : 'bg-lab-card text-lab-muted hover:text-lab-text'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${statusColors[status].dot}`} />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Deployments List */}
      {filteredProjects.length > 0 ? (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-lab-card border border-lab-border rounded-xl p-4 hover:border-lab-accent/30 transition-colors"
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Status Indicator */}
                <div className={`w-3 h-3 rounded-full ${statusColors[project.status].dot} flex-shrink-0 hidden lg:block`} />

                {/* Project Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-lab-text">{project.projectName}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColors[project.status].bg}`}>
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-lab-muted mb-2">{project.description}</p>
                  <div className="flex items-center gap-4 text-sm text-lab-muted-dark flex-wrap">
                    <span className="flex items-center gap-1">
                      <GitBranch className="w-3 h-3" />
                      {project.branch}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Deployed {formatDeployTime(project.lastDeployedAt)}
                    </span>
                  </div>
                </div>

                {/* Links */}
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={project.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-lab-accent/10 hover:bg-lab-accent/20 text-sm text-lab-accent transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Site
                  </a>
                  {project.repoUrl && (
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-lab-bg hover:bg-lab-border text-sm text-lab-text transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      Repo
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditModal(project)}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openDeleteModal(project)}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Code className="w-8 h-8 text-lab-muted" />}
          title="No deployments found"
          description={filterStatus === 'all' ? "Track your development deployments" : `No ${filterStatus} deployments.`}
          action={{
            label: 'Add Deployment',
            onClick: () => setShowAddModal(true),
          }}
        />
      )}

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Add Deployment"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!formData.projectName || !formData.previewUrl}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="My Awesome Project"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1.5">Description</label>
            <textarea
              placeholder="Brief description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-lab-card border border-lab-border rounded-lg text-lab-text placeholder:text-lab-muted-dark focus:outline-none focus:ring-2 focus:ring-lab-accent resize-none"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Branch"
              placeholder="main"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              icon={<GitBranch className="w-4 h-4" />}
            />
            <div>
              <label className="block text-sm font-medium text-lab-muted mb-1.5">Status</label>
              <div className="flex gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 ${
                      formData.status === status
                        ? 'ring-2 ring-lab-accent ' + statusColors[status].bg
                        : 'bg-lab-bg hover:bg-lab-border'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusColors[status].dot}`} />
                    {status.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Input
            label="Preview URL"
            placeholder="https://my-project.vercel.app"
            value={formData.previewUrl}
            onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
          />
          <Input
            label="Repository URL (optional)"
            placeholder="https://github.com/user/repo"
            value={formData.repoUrl}
            onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
            icon={<Github className="w-4 h-4" />}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedProject(null); resetForm(); }}
        title="Edit Deployment"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowEditModal(false); setSelectedProject(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.projectName || !formData.previewUrl}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Project Name"
            placeholder="My Awesome Project"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1.5">Description</label>
            <textarea
              placeholder="Brief description..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-lab-card border border-lab-border rounded-lg text-lab-text placeholder:text-lab-muted-dark focus:outline-none focus:ring-2 focus:ring-lab-accent resize-none"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Branch"
              placeholder="main"
              value={formData.branch}
              onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
              icon={<GitBranch className="w-4 h-4" />}
            />
            <div>
              <label className="block text-sm font-medium text-lab-muted mb-1.5">Status</label>
              <div className="flex gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status })}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-1.5 ${
                      formData.status === status
                        ? 'ring-2 ring-lab-accent ' + statusColors[status].bg
                        : 'bg-lab-bg hover:bg-lab-border'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${statusColors[status].dot}`} />
                    {status.slice(0, 4)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Input
            label="Preview URL"
            placeholder="https://my-project.vercel.app"
            value={formData.previewUrl}
            onChange={(e) => setFormData({ ...formData, previewUrl: e.target.value })}
          />
          <Input
            label="Repository URL (optional)"
            placeholder="https://github.com/user/repo"
            value={formData.repoUrl}
            onChange={(e) => setFormData({ ...formData, repoUrl: e.target.value })}
            icon={<Github className="w-4 h-4" />}
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedProject(null); }}
        onConfirm={handleDelete}
        title="Remove Deployment"
        message={`Are you sure you want to remove "${selectedProject?.projectName}"?`}
        confirmText="Remove"
        danger
      />
    </div>
  );
}
