'use client';

import React, { useState } from 'react';
import {
  Wrench,
  BookOpen,
  TrendingUp,
  FileText,
  Zap,
  Lightbulb,
  Code,
  Eye,
  Radio,
  Plus,
  X,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Button, Input, useToast, Badge } from '@/components';
import { useData } from '@/lib/useLocalStorage';
import type {
  Tool,
  ToolCategory,
  QuickCapture,
  LearningItem,
  ProjectIdea,
  CodeSnippet,
  TrendItem,
} from '@/lib/types';

const iconMap: Record<string, React.ReactNode> = {
  'book-open': <BookOpen className="w-5 h-5" />,
  'trending-up': <TrendingUp className="w-5 h-5" />,
  'file-text': <FileText className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  lightbulb: <Lightbulb className="w-5 h-5" />,
  code: <Code className="w-5 h-5" />,
  eye: <Eye className="w-5 h-5" />,
  radar: <Radio className="w-5 h-5" />,
  default: <Wrench className="w-5 h-5" />,
};

const categoryColors: Record<ToolCategory, string> = {
  Learning: 'text-purple-400 bg-purple-500/10',
  Productivity: 'text-blue-400 bg-blue-500/10',
  Business: 'text-green-400 bg-green-500/10',
  Development: 'text-amber-400 bg-amber-500/10',
  Research: 'text-teal-400 bg-teal-500/10',
};

// Quick Capture Component
function QuickCapturePanel() {
  const { data, updateSection, addActivity } = useData();
  const { showToast } = useToast();
  const [input, setInput] = useState('');

  if (!data) return null;

  const captures = data.internalTools?.quickCaptures || [];

  const handleAdd = () => {
    if (!input.trim()) return;
    const newCapture: QuickCapture = {
      id: Date.now().toString(),
      content: input.trim(),
      createdAt: new Date().toISOString(),
    };
    updateSection('internalTools', (current) => ({
      ...current,
      quickCaptures: [newCapture, ...(current.quickCaptures || [])],
    }));
    addActivity('note', 'Quick capture', input.trim().slice(0, 30) + '...');
    setInput('');
    showToast('success', 'Idea captured!');
  };

  const handleDelete = (id: string) => {
    updateSection('internalTools', (current) => ({
      ...current,
      quickCaptures: (current.quickCaptures || []).filter((c) => c.id !== id),
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Quick thought or idea..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          className="flex-1 px-4 py-2.5 bg-lab-card border border-lab-border rounded-lg text-lab-text placeholder:text-lab-muted-dark focus:outline-none focus:ring-2 focus:ring-lab-accent"
        />
        <Button onClick={handleAdd} disabled={!input.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {captures.length === 0 ? (
          <p className="text-center text-lab-muted py-4">No captures yet. Jot down your ideas!</p>
        ) : (
          captures.map((capture) => (
            <div
              key={capture.id}
              className="flex items-start gap-3 p-3 bg-lab-bg rounded-lg group"
            >
              <Zap className="w-4 h-4 text-lab-accent mt-0.5 flex-shrink-0" />
              <p className="flex-1 text-sm text-lab-text">{capture.content}</p>
              <button
                onClick={() => handleDelete(capture.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-lab-muted hover:text-red-400 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Learning Queue Component
function LearningQueuePanel() {
  const { data, updateSection } = useData();
  const { showToast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    type: 'article' as LearningItem['type'],
  });

  if (!data) return null;

  const items = data.internalTools?.learningQueue || [];

  const handleAdd = () => {
    if (!formData.title) return;
    const newItem: LearningItem = {
      id: Date.now().toString(),
      title: formData.title,
      url: formData.url || undefined,
      type: formData.type,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    updateSection('internalTools', (current) => ({
      ...current,
      learningQueue: [newItem, ...(current.learningQueue || [])],
    }));
    setFormData({ title: '', url: '', type: 'article' });
    setShowAdd(false);
    showToast('success', 'Added to learning queue!');
  };

  const updateStatus = (id: string, status: LearningItem['status']) => {
    updateSection('internalTools', (current) => ({
      ...current,
      learningQueue: (current.learningQueue || []).map((item) =>
        item.id === id
          ? { ...item, status, completedAt: status === 'completed' ? new Date().toISOString() : undefined }
          : item
      ),
    }));
  };

  const handleDelete = (id: string) => {
    updateSection('internalTools', (current) => ({
      ...current,
      learningQueue: (current.learningQueue || []).filter((item) => item.id !== id),
    }));
  };

  const statusColors = {
    queued: 'bg-gray-500/20 text-gray-400',
    'in-progress': 'bg-blue-500/20 text-blue-400',
    completed: 'bg-green-500/20 text-green-400',
  };

  return (
    <div className="space-y-4">
      {!showAdd ? (
        <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)} icon={<Plus className="w-4 h-4" />}>
          Add to Queue
        </Button>
      ) : (
        <div className="p-4 bg-lab-bg rounded-lg space-y-3">
          <Input
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <Input
            placeholder="URL (optional)"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
          <select
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as LearningItem['type'] })}
            className="w-full px-4 py-2 bg-lab-card border border-lab-border rounded-lg text-lab-text"
          >
            <option value="article">Article</option>
            <option value="video">Video</option>
            <option value="course">Course</option>
            <option value="podcast">Podcast</option>
          </select>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-center text-lab-muted py-4">Your learning queue is empty</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 bg-lab-bg rounded-lg group">
              <BookOpen className="w-4 h-4 text-purple-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-lab-text truncate">{item.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-lab-muted capitalize">{item.type}</span>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-lab-accent">
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
              <select
                value={item.status}
                onChange={(e) => updateStatus(item.id, e.target.value as LearningItem['status'])}
                className={`text-xs px-2 py-1 rounded ${statusColors[item.status]} border-0 cursor-pointer`}
              >
                <option value="queued">Queued</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={() => handleDelete(item.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-lab-muted hover:text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Project Ideas Backlog Component
function ProjectIdeasPanel() {
  const { data, updateSection } = useData();
  const { showToast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    excitement: 3 as 1 | 2 | 3 | 4 | 5,
    feasibility: 3 as 1 | 2 | 3 | 4 | 5,
  });

  if (!data) return null;

  const ideas = data.internalTools?.projectIdeas || [];
  const sortedIdeas = [...ideas].sort((a, b) => (b.excitement + b.feasibility) - (a.excitement + a.feasibility));

  const handleAdd = () => {
    if (!formData.title) return;
    const newIdea: ProjectIdea = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };
    updateSection('internalTools', (current) => ({
      ...current,
      projectIdeas: [newIdea, ...(current.projectIdeas || [])],
    }));
    setFormData({ title: '', description: '', excitement: 3, feasibility: 3 });
    setShowAdd(false);
    showToast('success', 'Idea added to backlog!');
  };

  const handleDelete = (id: string) => {
    updateSection('internalTools', (current) => ({
      ...current,
      projectIdeas: (current.projectIdeas || []).filter((i) => i.id !== id),
    }));
  };

  return (
    <div className="space-y-4">
      {!showAdd ? (
        <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)} icon={<Plus className="w-4 h-4" />}>
          Add Idea
        </Button>
      ) : (
        <div className="p-4 bg-lab-bg rounded-lg space-y-3">
          <Input
            placeholder="Idea title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <textarea
            placeholder="Brief description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 bg-lab-card border border-lab-border rounded-lg text-lab-text placeholder:text-lab-muted-dark resize-none"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-lab-muted mb-1 block">Excitement (1-5)</label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.excitement}
                onChange={(e) => setFormData({ ...formData, excitement: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                className="w-full"
              />
              <span className="text-xs text-lab-accent">{formData.excitement}/5</span>
            </div>
            <div>
              <label className="text-xs text-lab-muted mb-1 block">Feasibility (1-5)</label>
              <input
                type="range"
                min="1"
                max="5"
                value={formData.feasibility}
                onChange={(e) => setFormData({ ...formData, feasibility: parseInt(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                className="w-full"
              />
              <span className="text-xs text-lab-accent">{formData.feasibility}/5</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {sortedIdeas.length === 0 ? (
          <p className="text-center text-lab-muted py-4">No ideas yet. Start brainstorming!</p>
        ) : (
          sortedIdeas.map((idea) => (
            <div key={idea.id} className="p-3 bg-lab-bg rounded-lg group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-lab-text">{idea.title}</p>
                  {idea.description && (
                    <p className="text-xs text-lab-muted mt-1">{idea.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(idea.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-lab-muted hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-purple-400">Excitement: {idea.excitement}/5</span>
                <span className="text-xs text-green-400">Feasibility: {idea.feasibility}/5</span>
                <span className="text-xs text-lab-accent font-medium">
                  Score: {idea.excitement + idea.feasibility}/10
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Code Snippets Component
function CodeSnippetsPanel() {
  const { data, updateSection } = useData();
  const { showToast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    language: 'javascript',
    code: '',
    tags: '',
  });

  if (!data) return null;

  const snippets = data.internalTools?.codeSnippets || [];

  const handleAdd = () => {
    if (!formData.title || !formData.code) return;
    const newSnippet: CodeSnippet = {
      id: Date.now().toString(),
      title: formData.title,
      language: formData.language,
      code: formData.code,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    updateSection('internalTools', (current) => ({
      ...current,
      codeSnippets: [newSnippet, ...(current.codeSnippets || [])],
    }));
    setFormData({ title: '', language: 'javascript', code: '', tags: '' });
    setShowAdd(false);
    showToast('success', 'Snippet saved!');
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('success', 'Copied to clipboard!');
  };

  const handleDelete = (id: string) => {
    updateSection('internalTools', (current) => ({
      ...current,
      codeSnippets: (current.codeSnippets || []).filter((s) => s.id !== id),
    }));
  };

  return (
    <div className="space-y-4">
      {!showAdd ? (
        <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)} icon={<Plus className="w-4 h-4" />}>
          Add Snippet
        </Button>
      ) : (
        <div className="p-4 bg-lab-bg rounded-lg space-y-3">
          <Input
            placeholder="Snippet title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <select
            value={formData.language}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
            className="w-full px-4 py-2 bg-lab-card border border-lab-border rounded-lg text-lab-text"
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="css">CSS</option>
            <option value="html">HTML</option>
            <option value="bash">Bash</option>
            <option value="sql">SQL</option>
          </select>
          <textarea
            placeholder="Paste your code here..."
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            className="w-full px-4 py-2 bg-lab-card border border-lab-border rounded-lg text-lab-text font-mono text-sm resize-none"
            rows={5}
          />
          <Input
            placeholder="Tags (comma separated)"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Save</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {snippets.length === 0 ? (
          <p className="text-center text-lab-muted py-4">No snippets saved yet</p>
        ) : (
          snippets.map((snippet) => (
            <div key={snippet.id} className="p-3 bg-lab-bg rounded-lg group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-lab-text">{snippet.title}</p>
                  <span className="text-xs text-lab-accent">{snippet.language}</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => copyToClipboard(snippet.code)}
                    className="px-2 py-1 text-xs bg-lab-card rounded text-lab-muted hover:text-lab-text"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => handleDelete(snippet.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-lab-muted hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <pre className="text-xs bg-lab-card p-2 rounded overflow-x-auto">
                <code className="text-lab-muted">{snippet.code.slice(0, 100)}{snippet.code.length > 100 ? '...' : ''}</code>
              </pre>
              {snippet.tags.length > 0 && (
                <div className="flex gap-1 mt-2 flex-wrap">
                  {snippet.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-lab-card rounded text-lab-muted">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Trend Radar Component
function TrendRadarPanel() {
  const { data, updateSection } = useData();
  const { showToast } = useToast();
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'tech' as TrendItem['category'],
    notes: '',
  });

  if (!data) return null;

  const trends = data.internalTools?.trends || [];

  const handleAdd = () => {
    if (!formData.title) return;
    const newTrend: TrendItem = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString(),
    };
    updateSection('internalTools', (current) => ({
      ...current,
      trends: [newTrend, ...(current.trends || [])],
    }));
    setFormData({ title: '', category: 'tech', notes: '' });
    setShowAdd(false);
    showToast('success', 'Trend added!');
  };

  const handleDelete = (id: string) => {
    updateSection('internalTools', (current) => ({
      ...current,
      trends: (current.trends || []).filter((t) => t.id !== id),
    }));
  };

  const categoryLabels = {
    tech: 'Tech',
    design: 'Design',
    ai: 'AI',
    business: 'Business',
  };

  return (
    <div className="space-y-4">
      {!showAdd ? (
        <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)} icon={<Plus className="w-4 h-4" />}>
          Add Trend
        </Button>
      ) : (
        <div className="p-4 bg-lab-bg rounded-lg space-y-3">
          <Input
            placeholder="Trend title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value as TrendItem['category'] })}
            className="w-full px-4 py-2 bg-lab-card border border-lab-border rounded-lg text-lab-text"
          >
            <option value="tech">Tech</option>
            <option value="design">Design</option>
            <option value="ai">AI</option>
            <option value="business">Business</option>
          </select>
          <textarea
            placeholder="Your thoughts on this trend..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-4 py-2 bg-lab-card border border-lab-border rounded-lg text-lab-text resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd}>Add</Button>
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </div>
      )}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {trends.length === 0 ? (
          <p className="text-center text-lab-muted py-4">No trends being watched</p>
        ) : (
          trends.map((trend) => (
            <div key={trend.id} className="p-3 bg-lab-bg rounded-lg group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-lab-text">{trend.title}</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-lab-card text-lab-muted">
                      {categoryLabels[trend.category]}
                    </span>
                  </div>
                  {trend.notes && (
                    <p className="text-xs text-lab-muted mt-1">{trend.notes}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(trend.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-lab-muted hover:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Coming Soon Placeholder
function ComingSoonPanel({ tool }: { tool: Tool }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="p-4 bg-lab-bg rounded-xl mb-4">
        {iconMap[tool.icon] || iconMap.default}
      </div>
      <h3 className="text-lg font-medium text-lab-text mb-2">{tool.name}</h3>
      <p className="text-sm text-lab-muted mb-4">{tool.description}</p>
      <Badge variant="building">Coming Soon</Badge>
    </div>
  );
}

export default function ToolsPage() {
  const { data, isLoading } = useData();
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lab-accent" />
      </div>
    );
  }

  const tools = data.tools;
  const categories: ToolCategory[] = ['Learning', 'Productivity', 'Business', 'Development', 'Research'];

  const filteredTools = activeCategory === 'all'
    ? tools
    : tools.filter((t) => t.category === activeCategory);

  const activeTool = tools.find((t) => t.id === activeToolId);

  const renderToolPanel = (tool: Tool) => {
    if (tool.isComingSoon) {
      return <ComingSoonPanel tool={tool} />;
    }

    switch (tool.name) {
      case 'Quick Capture':
        return <QuickCapturePanel />;
      case 'Daily Learning Queue':
        return <LearningQueuePanel />;
      case 'Project Ideas Backlog':
        return <ProjectIdeasPanel />;
      case 'Code Snippets Library':
        return <CodeSnippetsPanel />;
      case 'Trend Radar':
        return <TrendRadarPanel />;
      default:
        return <ComingSoonPanel tool={tool} />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-lab-text">Internal Tools</h1>
          <p className="text-sm text-lab-muted mt-1">Your productivity and learning hub</p>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
            activeCategory === 'all'
              ? 'bg-lab-accent text-lab-bg'
              : 'bg-lab-card text-lab-muted hover:text-lab-text'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              activeCategory === cat
                ? categoryColors[cat]
                : 'bg-lab-card text-lab-muted hover:text-lab-text'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Tools List */}
        <div className="lg:col-span-1 space-y-2">
          {filteredTools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setActiveToolId(tool.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl text-left transition-colors ${
                activeToolId === tool.id
                  ? 'bg-lab-accent/10 border border-lab-accent/30'
                  : 'bg-lab-card border border-lab-border hover:border-lab-accent/30'
              }`}
            >
              <div className={`p-2 rounded-lg ${categoryColors[tool.category]}`}>
                {iconMap[tool.icon] || iconMap.default}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-lab-text truncate">{tool.name}</p>
                  {tool.isComingSoon && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-lab-border text-lab-muted">Soon</span>
                  )}
                </div>
                <p className="text-xs text-lab-muted truncate">{tool.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Tool Panel */}
        <div className="lg:col-span-2">
          <div className="bg-lab-card border border-lab-border rounded-xl p-6 min-h-[400px]">
            {activeTool ? (
              <>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-lab-border">
                  <div className={`p-2 rounded-lg ${categoryColors[activeTool.category]}`}>
                    {iconMap[activeTool.icon] || iconMap.default}
                  </div>
                  <div>
                    <h2 className="font-semibold text-lab-text">{activeTool.name}</h2>
                    <p className="text-sm text-lab-muted">{activeTool.description}</p>
                  </div>
                </div>
                {renderToolPanel(activeTool)}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Wrench className="w-12 h-12 text-lab-muted mb-4" />
                <h3 className="text-lg font-medium text-lab-text mb-2">Select a Tool</h3>
                <p className="text-sm text-lab-muted">Choose a tool from the list to get started</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
