'use client';

import React, { useState } from 'react';
import { Plus, Users, ExternalLink, Copy, Eye, EyeOff, Info, Mail, Clock } from 'lucide-react';
import { Button, Modal, Input, EmptyState, ConfirmModal, useToast } from '@/components';
import { useData } from '@/lib/useLocalStorage';
import type { ClientProject, ClientStatus } from '@/lib/types';

const statusOptions: ClientStatus[] = ['draft', 'sent', 'viewed', 'expired'];

export default function ClientsPage() {
  const { showToast } = useToast();
  const { data, updateSection, addActivity, isLoading } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientProject | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    projectName: '',
    projectDescription: '',
    subdomain: '',
    status: 'draft' as ClientStatus,
    password: '',
    expiresAt: '',
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lab-accent" />
      </div>
    );
  }

  const clients = data.clients;

  const handleAdd = () => {
    const newClient: ClientProject = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };
    updateSection('clients', (current) => [newClient, ...current]);
    addActivity('client', 'Created preview for', formData.clientName);
    setShowAddModal(false);
    resetForm();
    showToast('success', 'Client preview created!');
  };

  const handleEdit = () => {
    if (!selectedClient) return;
    updateSection('clients', (current) =>
      current.map((c) => (c.id === selectedClient.id ? { ...c, ...formData } : c))
    );
    setShowEditModal(false);
    setSelectedClient(null);
    resetForm();
    showToast('success', 'Client updated!');
  };

  const handleDelete = () => {
    if (!selectedClient) return;
    updateSection('clients', (current) => current.filter((c) => c.id !== selectedClient.id));
    setShowDeleteModal(false);
    setSelectedClient(null);
    showToast('success', 'Client removed!');
  };

  const handleSendEmail = (client: ClientProject) => {
    const previewUrl = `https://${client.subdomain}.jalnaea.dev`;
    const passwordLine = client.password ? `\nPassword: ${client.password}` : '';
    const expiryLine = client.expiresAt ? `\n\nThis preview will be available until ${formatDate(client.expiresAt)}.` : '';

    const subject = encodeURIComponent(`Your Project Preview is Ready - ${client.projectName}`);
    const body = encodeURIComponent(
      `Hi ${client.clientName},\n\nYour preview for ${client.projectName} is ready to view!\n\nPreview Link: ${previewUrl}${passwordLine}${expiryLine}\n\nLet me know if you have any questions!\n\nBest,\nJalanea`
    );

    window.open(`mailto:${client.clientEmail}?subject=${subject}&body=${body}`, '_blank');

    // Update status to sent
    updateSection('clients', (current) =>
      current.map((c) =>
        c.id === client.id ? { ...c, status: 'sent' as ClientStatus, lastSentAt: new Date().toISOString() } : c
      )
    );
    addActivity('client', 'Sent preview to', client.clientName);
    showToast('success', 'Email opened! Update status after sending.');
  };

  const copyPreviewLink = (subdomain: string) => {
    const link = `https://${subdomain}.jalnaea.dev`;
    navigator.clipboard.writeText(link);
    showToast('success', 'Preview link copied!');
  };

  const openEditModal = (client: ClientProject) => {
    setSelectedClient(client);
    setFormData({
      clientName: client.clientName,
      clientEmail: client.clientEmail,
      projectName: client.projectName,
      projectDescription: client.projectDescription,
      subdomain: client.subdomain,
      status: client.status,
      password: client.password,
      expiresAt: client.expiresAt,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (client: ClientProject) => {
    setSelectedClient(client);
    setShowDeleteModal(true);
  };

  const resetForm = () => {
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 30);
    setFormData({
      clientName: '',
      clientEmail: '',
      projectName: '',
      projectDescription: '',
      subdomain: '',
      status: 'draft',
      password: '',
      expiresAt: defaultExpiry.toISOString().split('T')[0],
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const isExpired = (date: string) => getDaysRemaining(date) < 0;

  const statusColors: Record<ClientStatus, string> = {
    draft: 'bg-gray-500/20 text-gray-400',
    sent: 'bg-blue-500/20 text-blue-400',
    viewed: 'bg-green-500/20 text-green-400',
    expired: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-lab-text">Client Previews</h1>
          <p className="text-sm text-lab-muted mt-1">
            {clients.length} preview{clients.length !== 1 ? 's' : ''} active
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowInfoModal(true)} icon={<Info className="w-4 h-4" />}>
            Setup Guide
          </Button>
          <Button onClick={() => { resetForm(); setShowAddModal(true); }} icon={<Plus className="w-4 h-4" />}>
            New Preview
          </Button>
        </div>
      </div>

      {/* Clients List */}
      {clients.length > 0 ? (
        <div className="space-y-4">
          {clients.map((client) => {
            const daysRemaining = getDaysRemaining(client.expiresAt);
            const expired = isExpired(client.expiresAt);

            return (
              <div
                key={client.id}
                className={`bg-lab-card border rounded-xl p-4 transition-colors ${
                  expired ? 'border-red-500/30' : 'border-lab-border hover:border-lab-accent/30'
                }`}
              >
                <div className="flex flex-col gap-4">
                  {/* Top Row */}
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Client Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-lab-text">{client.clientName}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${statusColors[expired ? 'expired' : client.status]}`}>
                          {expired ? 'Expired' : client.status}
                        </span>
                      </div>
                      <p className="text-sm text-lab-muted">{client.projectName}</p>
                      {client.projectDescription && (
                        <p className="text-xs text-lab-muted-dark mt-1 line-clamp-1">{client.projectDescription}</p>
                      )}
                    </div>

                    {/* Preview Link */}
                    <div className="flex items-center gap-2">
                      <code className="px-3 py-1.5 bg-lab-bg rounded-lg text-sm text-lab-accent font-mono">
                        {client.subdomain}.jalnaea.dev
                      </code>
                      <button
                        onClick={() => copyPreviewLink(client.subdomain)}
                        className="p-2 rounded-lg hover:bg-lab-border text-lab-muted hover:text-lab-text transition-colors"
                        title="Copy link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <a
                        href={`https://${client.subdomain}.jalnaea.dev`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-lab-border text-lab-muted hover:text-lab-text transition-colors"
                        title="Open preview"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>

                  {/* Bottom Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-3 border-t border-lab-border">
                    {/* Password */}
                    {client.password && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-lab-muted">Password:</span>
                        <code className="px-2 py-1 bg-lab-bg rounded text-sm font-mono text-lab-text">
                          {showPasswords[client.id] ? client.password : '••••••••'}
                        </code>
                        <button
                          onClick={() => setShowPasswords({ ...showPasswords, [client.id]: !showPasswords[client.id] })}
                          className="p-1 rounded hover:bg-lab-border text-lab-muted"
                        >
                          {showPasswords[client.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    )}

                    {/* Days Remaining */}
                    <div className={`flex items-center gap-1 text-xs ${expired ? 'text-red-400' : 'text-lab-muted-dark'}`}>
                      <Clock className="w-3 h-3" />
                      {expired ? (
                        <span>Expired {Math.abs(daysRemaining)} days ago</span>
                      ) : (
                        <span>{daysRemaining} days remaining</span>
                      )}
                    </div>

                    {/* Client Email */}
                    {client.clientEmail && (
                      <div className="flex items-center gap-1 text-xs text-lab-muted-dark">
                        <Mail className="w-3 h-3" />
                        <span>{client.clientEmail}</span>
                      </div>
                    )}

                    <div className="flex-1" />

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {client.clientEmail && !expired && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSendEmail(client)}
                          icon={<Mail className="w-4 h-4" />}
                        >
                          Send Link
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(client)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openDeleteModal(client)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Users className="w-8 h-8 text-lab-muted" />}
          title="No client previews"
          description="Create shareable preview links for your clients"
          action={{
            label: 'New Preview',
            onClick: () => { resetForm(); setShowAddModal(true); },
          }}
        />
      )}

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Create Client Preview"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowAddModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!formData.clientName || !formData.subdomain}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Client Name"
              placeholder="Acme Corp"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            />
            <Input
              label="Client Email"
              placeholder="client@example.com"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
            />
          </div>
          <Input
            label="Project Name"
            placeholder="Website Redesign"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1.5">Project Description</label>
            <textarea
              placeholder="Brief description of the project..."
              value={formData.projectDescription}
              onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
              className="w-full px-4 py-2.5 bg-lab-card border border-lab-border rounded-lg text-lab-text placeholder:text-lab-muted-dark focus:outline-none focus:ring-2 focus:ring-lab-accent resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1.5">Subdomain</label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="acme"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              />
              <span className="text-lab-muted whitespace-nowrap">.jalnaea.dev</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Password (optional)"
              placeholder="Leave empty for no password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Input
              label="Expires"
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedClient(null); resetForm(); }}
        title="Edit Client Preview"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowEditModal(false); setSelectedClient(null); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!formData.clientName || !formData.subdomain}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Client Name"
              placeholder="Acme Corp"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
            />
            <Input
              label="Client Email"
              placeholder="client@example.com"
              type="email"
              value={formData.clientEmail}
              onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
            />
          </div>
          <Input
            label="Project Name"
            placeholder="Website Redesign"
            value={formData.projectName}
            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1.5">Project Description</label>
            <textarea
              placeholder="Brief description of the project..."
              value={formData.projectDescription}
              onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
              className="w-full px-4 py-2.5 bg-lab-card border border-lab-border rounded-lg text-lab-text placeholder:text-lab-muted-dark focus:outline-none focus:ring-2 focus:ring-lab-accent resize-none"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1.5">Subdomain</label>
            <div className="flex items-center gap-2">
              <Input
                placeholder="acme"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              />
              <span className="text-lab-muted whitespace-nowrap">.jalnaea.dev</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-lab-muted mb-1.5">Status</label>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((status) => (
                <button
                  key={status}
                  onClick={() => setFormData({ ...formData, status })}
                  className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                    formData.status === status
                      ? statusColors[status] + ' ring-2 ring-lab-accent'
                      : 'bg-lab-bg text-lab-muted'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Password (optional)"
              placeholder="Leave empty for no password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Input
              label="Expires"
              type="date"
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => { setShowDeleteModal(false); setSelectedClient(null); }}
        onConfirm={handleDelete}
        title="Delete Client Preview"
        message={`Are you sure you want to delete the preview for "${selectedClient?.clientName}"?`}
        confirmText="Delete"
        danger
      />

      {/* Setup Guide Modal */}
      <Modal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title="Setting Up Client Subdomains"
        size="lg"
      >
        <div className="space-y-4 text-sm text-lab-muted">
          <p>To set up client subdomains on Vercel:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>Go to your Vercel project settings</li>
            <li>Navigate to <strong>Domains</strong></li>
            <li>Add a wildcard domain: <code className="px-2 py-0.5 bg-lab-bg rounded">*.jalnaea.dev</code></li>
            <li>Configure your DNS to point <code className="px-2 py-0.5 bg-lab-bg rounded">*.jalnaea.dev</code> to Vercel</li>
            <li>Each subdomain will automatically route to your preview deployment</li>
          </ol>
          <div className="p-3 bg-lab-accent/10 rounded-lg border border-lab-accent/20">
            <p className="text-lab-accent font-medium mb-1">Future: Resend API Integration</p>
            <p>Currently uses mailto: links. Will integrate with Resend API for direct email sending.</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
