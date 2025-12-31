'use client';

import React, { useState } from 'react';
import { Plus, Filter, FlaskConical, ExternalLink, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Button, Modal, Input, EmptyState, Badge, ConfirmModal, useToast } from '@/components';
import { useData } from '@/lib/useLocalStorage';
import type { LabProject, LabStatus, ProjectCategory, LaunchChecklist } from '@/lib/types';
import { categoryColors, defaultChecklist } from '@/lib/types';

const statusOptions: LabStatus[] = ['idea', 'building', 'testing', 'graduated'];
const categoryOptions: ProjectCategory[] = ['Career/Job', 'Spirituality', 'Finance', 'Health', 'Design/AI', 'Marketplace'];

const checklistLabels: Record<keyof LaunchChecklist, string> = {
  ideaDocumented: 'Idea documented',
  mvpDefined: 'MVP features defined',
  domainSecured: 'Domain secured',
  uiDesigned: 'Basic UI designed',
  coreBuilt: 'Core functionality built',
  deployedStaging: 'Deployed to staging',
  testedMobile: 'Tested on mobile',
  launchedProduction: 'Launched to production',
};

function LaunchChecklistComponent({
  checklist,
  onChange,
  readOnly = false,
}: {
  checklist: LaunchChecklist;
  onChange?: (key: keyof LaunchChecklist) => void;
  readOnly?: boolean;
}) {
  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const progress = (completedCount / totalCount) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-lab-muted">Launch Progress</span>
        <span className="text-lab-text font-medium">{completedCount}/{totalCount}</span>
      </div>
      <div className="h-2 bg-lab-border rounded-full overflow-hidden">
        <div
          className="h-full bg-lab-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {(Object.keys(checklistLabels) as (keyof LaunchChecklist)[]).map((key) => (
          <button
            key={key}
            onClick={() => !readOnly && onChange?.(key)}
            disabled={readOnly}
            className={`flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${
              readOnly ? 'cursor-default' : 'hover:bg-lab-border/50 cursor-pointer'
            }`}
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                checklist[key]
                  ? 'bg-lab-accent border-lab-accent'
                  : 'border-lab-border'
              }`}
            >
              {checklist[key] && <Check className="w-3 h-3 text-lab-bg" />}
            </div>
            <span className={checklist[key] ? 'text-lab-text' : 'text-lab-muted'}>
              {checklistLabels[key]}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
  onToggleChecklist,
}: {
  project: LabProject;
  onEdit: () => void;
  onDelete: () => void;
  onToggleChecklist: (key: keyof LaunchChecklist) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-lab-card border border-lab-border rounded-xl overflow-hidden hover:border-lab-accent/30 transition-colors">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-lab-text truncate">{project.name}</h3>
              <Badge variant={project.status}>{project.status}</Badge>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs border ${categoryColors[project.category]}`}>
              {project.category}
            </span>
          </div>
          <FlaskConical className="w-5 h-5 text-lab-accent flex-shrink-0" />
        </div>

        {/* Description */}
        <p className="text-sm text-lab-muted mb-3 line-clamp-2">{project.description}</p>

        {/* URL if available */}
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-lab-accent hover:underline mb-3"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {project.url.replace(/^https?:\/\//, '')}
          </a>
        )}

        {/* Quick progress bar */}
        <div className="mb-3">
          <div className="h-1.5 bg-lab-border rounded-full overflow-hidden">
            <div
              className="h-full bg-lab-accent transition-all duration-300"
              style={{
                width: `${(Object.values(project.checklist).filter(Boolean).length / 8) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-lab-muted hover:text-lab-text transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? 'Hide checklist' : 'Show checklist'}
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded checklist */}
      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-lab-border">
          <LaunchChecklistComponent
            checklist={project.checklist}
            onChange={onToggleChecklist}
          />
        </div>
      )}
    </div>
  );
}

export default function LabPage() {
  const { showToast } = useToast();
  const { data, updateSection, addActivity, recalculateStats, isLoading } = useData();
  const [filterStatus, setFilterStatus] = useState<LabStatus | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<ProjectCategory | 'all'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<LabProject | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'idea' as LabStatus,
    category: 'Design/AI' as ProjectCategory,
    url: '',
    checklist: { ...defaultChecklist },
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lab-accent" />
      </div>
    );
  }

  const projects = data.lab;

  const filteredProjects = projects.filter((p) => {
    const statusMatch = filterStatus === 'all' || p.status === filterStatus;
    const categoryMatch = filterCategory === 'all' || p.category === filterCategory;
    return statusMatch && categoryMatch;
  });

  const handleAdd = () => {
    const newProject: LabProject = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      status: formData.status,
      category: formData.category,
      url: formData.url,
      checklist: formData.checklist,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    updateSection('lab', (current) => [newProject, ...current]);
    addActivity('experiment', 'Added idea', formData.name);
    recalculateStats();
    setShowAddModal(false);
    resetForm();
    showToast('success', 'Project added to lab!');
  };

  const handleEdit = () => {
    if (!selectedProject) return;
    updateSection('lab', (current) =>
      current.map((p) =>
        p.id === selectedProject.id
          ? { ...p, ...formData, updatedAt: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    addActivity('experiment', 'Updated', formData.name);
    recalculateStats();
    setShowEditModal(false);
    setSelectedProject(null);
    resetForm();
    showToast('success', 'Project updated!');
  };

  const handleDelete = () => {
    if (!selectedProject) return;
    updateSection('lab', (current) => current.filter((p) => p.id !== selectedProject.id));
    addActivity('experiment', 'Deleted', selectedProject.name);
    recalculateStats();
    setShowDeleteModal(false);
    setSelectedProject(null);
    showToast('success', 'Project deleted!');
  };

  const handleToggleChecklist = (projectId: string, key: keyof LaunchChecklist) => {
    updateSection('lab', (current) =>
      current.map((p) =>
        p.id === projectId
          ? {
              ...p,
              checklist: { ...p.checklist, [key]: !p.checklist[key] },
              updatedAt: new Date().toISOString().split('T')[0],
            }
          : p
      )
    );
  };

  const openEditModal = (project: LabProject) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      category: project.category,
      url: project.url,
      checklist: { ...project.checklist },
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (project: LabProject) => {
    setSelectedProject(project);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'idea',
      category: 'Design/AI',
      url: '',
      checklist: { ...defaultChecklist },
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-lab-text">Lab / Sandbox</h1>
          <p className="text-sm text-lab-muted mt-1">
            {projects.length} projects ({data.stats.ideasInQueue} ideas, {data.stats.liveProducts} live)
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} icon={<Plus className="w-4 h-4" />}>
          New Project
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-lab-muted" />
          <span className="text-sm text-lab-muted mr-1">Status:</span>
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
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterStatus === status
                  ? 'bg-lab-accent text-lab-bg'
                  : 'bg-lab-card text-lab-muted hover:text-lab-text'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-4" />
          <span className="text-sm text-lab-muted mr-1">Category:</span>
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              filterCategory === 'all'
                ? 'bg-lab-accent text-lab-bg'
                : 'bg-lab-card text-lab-muted hover:text-lab-text'
            }`}
          >
            All
          </button>
          {categoryOptions.map((category) => (
            <button
              key={category}
              onClick={() => setFilterCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                filterCategory === category
                  ? categoryColors[category]
                  : 'bg-lab-card text-lab-muted hover:text-lab-text border-transparent'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => openEditModal(project)}
              onDelete={() => openDeleteModal(project)}
              onToggleChecklist={(key) => handleToggleChecklist(project.id, key)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<FlaskConical className="w-8 h-8 text-lab-muted" />}
          title="No projects found"
          description={
            filterStatus === 'all' && filterCategory === 'all'
              ? 'Start your first project!'
              : 'No projects match your filters.'
          }
          action={{
            label: 'New Project',
            onClick: () => setShowAddModal(true),
          }}
        />
      )}

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="New Project"
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!formData.name}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Jalanea Something"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1.5">Description</label>
            <textarea
              placeholder="What problem does this solve?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-lab-card border border-lab-border rounded-lg text-lab-text placeholder:text-lab-muted-dark focus:outline-none focus:ring-2 focus:ring-lab-accent resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-lab-muted mb-1.5">Status</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status })}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      formData.status === status ? 'ring-2 ring-lab-accent' : ''
                    }`}
                  >
                    <Badge variant={status}>{status}</Badge>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-lab-muted mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProjectCategory })}
                className="w-full px-4 py-2.5 bg-lab-card border border-lab-border rounded-lg text-lab-text focus:outline-none focus:ring-2 focus:ring-lab-accent"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="URL (optional)"
            placeholder="https://..."
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProject(null);
          resetForm();
        }}
        title="Edit Project"
        size="lg"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setShowEditModal(false);
                setSelectedProject(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.name}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="Jalanea Something"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1.5">Description</label>
            <textarea
              placeholder="What problem does this solve?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2.5 bg-lab-card border border-lab-border rounded-lg text-lab-text placeholder:text-lab-muted-dark focus:outline-none focus:ring-2 focus:ring-lab-accent resize-none"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-lab-muted mb-1.5">Status</label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({ ...formData, status })}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      formData.status === status ? 'ring-2 ring-lab-accent' : ''
                    }`}
                  >
                    <Badge variant={status}>{status}</Badge>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-lab-muted mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as ProjectCategory })}
                className="w-full px-4 py-2.5 bg-lab-card border border-lab-border rounded-lg text-lab-text focus:outline-none focus:ring-2 focus:ring-lab-accent"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Input
            label="URL (optional)"
            placeholder="https://..."
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
          <div className="pt-2 border-t border-lab-border">
            <LaunchChecklistComponent
              checklist={formData.checklist}
              onChange={(key) =>
                setFormData({
                  ...formData,
                  checklist: { ...formData.checklist, [key]: !formData.checklist[key] },
                })
              }
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProject(null);
        }}
        onConfirm={handleDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${selectedProject?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        danger
      />
    </div>
  );
}
