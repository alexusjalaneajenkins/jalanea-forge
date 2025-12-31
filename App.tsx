import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  BookOpen,
  Lightbulb,
  Map,
  Palette,
  Code2,
  ChevronRight,
  Settings,
  Upload,
  Sparkles,
  Download,
  Copy,
  Terminal,
  Layout as LayoutIcon,
  Layers,
  FileText,
  Brain,
  RefreshCw,
  ExternalLink,
  Edit2,
  File as FileIcon,
  FolderOpen,
  AlertCircle,
  X,
  Moon,
  Sun,
  Check,
  Database,
  ArrowDownToLine,
  ArrowRight,
  Info,
  Volume2,
  Bug,
  Menu,
  History,
  RotateCcw,
  Shield,
  LogOut,
  CreditCard,
  ChevronDown
} from 'lucide-react';
import { ProjectState, ProjectStep, ResearchDocument, NavItem, ProjectMetadata, RoadmapPhase } from './types';
import * as GeminiService from './services/geminiService';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { getProject, createProject, getUserProjects, deleteProject } from './services/supabaseService';
import { ProjectListDialog } from './components/ProjectListDialog';
import { SettingsModal } from './components/SettingsModal';
import { SupportModal } from './components/SupportModal';
import { MISSING_API_KEY_ERROR } from './services/geminiService';
import { createPortalSession } from './services/stripeService';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import { PageBackground } from './components/PageBackground';
import { GlassCard } from './components/GlassCard';
import { LoadingState } from './components/LoadingState';
import { OnboardingTour } from './components/OnboardingTour';
import { Confetti, useConfetti } from './components/Confetti';
import { HelpTooltip } from './components/HelpTooltip';
import { AdminPanel } from './pages/AdminPanel';
import { LandingPage } from './pages/LandingPage';
import html2pdf from 'html2pdf.js';

// --- Utils ---

const exportToPDF = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return Promise.resolve();

  // @ts-ignore - Bypass type issues for build stability
  const html2pdfLib = html2pdf;

  const opt = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // @ts-ignore
  return html2pdfLib().set(opt).from(element).save();
};
// --- Initial State ---

const initialState: ProjectState = {
  title: "Untitled Project",
  currentStep: ProjectStep.IDEA,
  research: [],
  ideaInput: "",
  synthesizedIdea: "",
  prdOutput: "",
  roadmapOutput: "",
  designSystemOutput: "",
  codePromptOutput: "",
  researchMissionPrompt: "",
  reportGenerationPrompt: "",
  isGenerating: false,
  completedRoadmapSteps: [],
};

// --- Components ---

const SidebarLink = ({ item, isActive, isComplete }: { item: NavItem, isActive: boolean, isComplete?: boolean }) => {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border ${isActive
        ? 'bg-forge-800 border-forge-700 text-forge-accent shadow-sm'
        : 'border-transparent text-forge-muted hover:bg-forge-800 hover:text-forge-text'
        }`}
    >
      <item.icon className={`w-5 h-5 ${isActive ? 'text-forge-accent' : 'text-forge-600 group-hover:text-forge-text'}`} />
      <span className="font-medium text-sm">{item.label}</span>
      <div className="ml-auto flex items-center gap-2">
        {isComplete && <Check className="w-4 h-4 text-emerald-500" />}
        {isActive && <ChevronRight className="w-4 h-4 text-forge-400" />}
      </div>
    </div>
  );
};

const CopyButton = ({ text, className = "", title = "Copy to Clipboard", variant = "dark", label }: { text: string, className?: string, title?: string, variant?: "dark" | "light", label?: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const baseStyles = variant === "light"
    ? "bg-white/80 backdrop-blur-sm border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300 hover:bg-white"
    : "bg-forge-800 border-forge-700 text-forge-400 hover:text-forge-text hover:border-forge-500";

  const copiedStyles = "bg-emerald-500/10 border-emerald-500/30 text-emerald-600";

  return (
    <button
      onClick={handleCopy}
      className={`relative p-2 rounded-lg transition-all duration-200 shadow-sm border group ${copied ? copiedStyles : baseStyles} ${className}`}
      title={copied ? "Copied!" : title}
    >
      <div className={`flex items-center ${label ? 'gap-2' : ''}`}>
        <div className="relative w-4 h-4">
          <div className={`absolute inset-0 transition-all duration-300 ${copied ? 'scale-0 opacity-0 rotate-45' : 'scale-100 opacity-100 rotate-0'}`}>
            <Copy className="w-4 h-4" />
          </div>
          <div className={`absolute inset-0 transition-all duration-300 ${copied ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-45'}`}>
            <Check className="w-4 h-4" />
          </div>
        </div>
        {label && <span className="text-sm font-medium">{copied ? "Copied!" : label}</span>}
      </div>
    </button>
  );
};

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-lg bg-forge-800 border border-forge-700 text-forge-muted hover:text-forge-text hover:border-forge-600 transition-all shadow-sm no-print"
      title="Toggle Theme"
    >
      <div className="relative w-5 h-5">
        <Sun className={`w-5 h-5 absolute transition-all duration-300 ${theme === 'dark' ? 'scale-0 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`} />
        <Moon className={`w-5 h-5 absolute transition-all duration-300 ${theme === 'light' ? 'scale-0 -rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100'}`} />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

const Header = ({ onMenuToggle }: { onMenuToggle?: () => void }) => {
  const { user, profile, signInWithGoogle, logOut, loading } = useAuth();
  const { openProjectList, state, updateTitle, openSettings, openPricing } = useProject();
  const showUpgrade = profile && (profile.role === 'free' || !profile.role);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const handleManageBilling = async () => {
    if (!user) return;
    setBillingLoading(true);
    try {
      const baseUrl = window.location.href.split('#')[0];
      const result = await createPortalSession(user.id, baseUrl);
      if ('url' in result) {
        window.location.href = result.url;
      } else {
        console.error('Failed to open billing portal:', result.error);
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
    } finally {
      setBillingLoading(false);
      setShowProfileMenu(false);
    }
  };

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await logOut();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') setIsEditingTitle(false);
  };

  return (
    <header className="h-16 md:h-20 border-b border-forge-700 bg-forge-950/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
        {/* Mobile hamburger menu */}
        <button
          onClick={onMenuToggle}
          className="md:hidden p-2.5 rounded-lg bg-forge-800 border border-forge-700 text-forge-muted hover:text-forge-text hover:border-forge-600 transition-all shadow-sm flex-shrink-0"
          title="Menu"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg bg-forge-accent flex items-center justify-center shadow-lg shadow-orange-500/20 flex-shrink-0">
          <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div className="flex flex-col items-start min-w-0">
          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            <span className="font-bold text-base md:text-xl tracking-tight text-forge-text leading-tight hidden sm:inline">JALANEA FORGE</span>
            <span className="text-forge-700 hidden sm:inline">/</span>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={state.title}
                onChange={(e) => updateTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={handleKeyDown}
                className="bg-forge-900 text-forge-text font-medium text-sm px-2 py-0.5 rounded border border-forge-700 focus:outline-none focus:border-forge-accent min-w-[100px] md:min-w-[150px]"
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="font-medium text-forge-text hover:bg-forge-900 px-1 md:px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-1 md:gap-2 group truncate max-w-[120px] sm:max-w-[200px] md:max-w-none"
                title="Rename Project"
              >
                <span className="truncate">{state.title}</span>
                <Edit2 className="w-3 h-3 text-forge-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <p className="text-[10px] md:text-xs text-forge-500 font-medium mt-0.5 hidden sm:block">AI Product Designer</p>
            <span className="text-forge-700 text-xs mt-0.5 hidden sm:block">•</span>
            <p className="text-[10px] md:text-xs text-forge-accent font-semibold mt-0.5">
              Step {(Object.values(ProjectStep).indexOf(state.currentStep) + 1)}/4
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
        {showUpgrade && (
          <button
            onClick={openPricing}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white text-sm font-medium transition-all shadow-lg shadow-indigo-500/25"
            title="Upgrade Plan"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade</span>
          </button>
        )}
        <button
          onClick={openSettings}
          className="p-2.5 rounded-lg bg-forge-800 border border-forge-700 text-forge-muted hover:text-forge-text hover:border-forge-600 transition-all shadow-sm"
          title="AI Settings"
          aria-label="Open AI settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        <ThemeToggle />
        {loading ? (
          <div className="h-8 w-8 rounded-full bg-forge-800 animate-pulse"></div>
        ) : user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-forge-muted mr-2 hidden lg:inline">Welcome, {(profile?.display_name || user.user_metadata?.full_name || user.email)?.split(' ')[0]}</span>

            <button
              onClick={openProjectList}
              className="p-2.5 text-forge-muted hover:text-forge-text hover:bg-forge-800 rounded-lg transition-colors hidden md:flex"
              title="My Projects"
              aria-label="Open project list"
            >
              <FolderOpen className="w-5 h-5" />
            </button>

            {/* Profile Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1.5 rounded-full bg-forge-800 border border-forge-700 hover:border-forge-600 transition-all shadow-sm pl-1 pr-2 py-1"
                title="Account Menu"
                aria-label="Open account menu"
                aria-expanded={showProfileMenu}
              >
                <div className="h-7 w-7 rounded-full bg-forge-700 flex items-center justify-center text-xs font-bold text-forge-muted overflow-hidden">
                  {(profile?.avatar_url || user.user_metadata?.avatar_url) ? (
                    <img src={profile?.avatar_url || user.user_metadata?.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    (profile?.display_name || user.user_metadata?.full_name || user.email)?.charAt(0) || 'U'
                  )}
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-forge-muted transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-forge-900 border border-forge-700 rounded-xl shadow-xl shadow-black/20 py-2 z-50 animate-fade-in">
                  {/* User Info */}
                  <div className="px-4 py-2 border-b border-forge-700">
                    <p className="text-sm font-medium text-forge-text truncate">
                      {profile?.display_name || user.user_metadata?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-forge-muted truncate">{user.email}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={handleManageBilling}
                      disabled={billingLoading}
                      className="w-full px-4 py-2.5 text-left text-sm text-forge-text hover:bg-forge-800 transition-colors flex items-center gap-3 disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4 text-forge-muted" />
                      {billingLoading ? 'Loading...' : 'Manage Billing'}
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-forge-800 transition-colors flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={signInWithGoogle}
            className="text-xs md:text-sm font-semibold bg-forge-accent hover:bg-orange-600 text-white px-3 md:px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2"
          >
            <span className="hidden sm:inline">Sign in with Google</span>
            <span className="sm:hidden">Sign in</span>
          </button>
        )}
      </div>
    </header>
  );
};

// --- Pages ---

const IdeaPage = () => {
  const { state, updateIdea, generateArtifact } = useProject();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const { showConfetti, triggerConfetti, handleConfettiComplete } = useConfetti();

  const handleRefine = async () => {
    if (!state.ideaInput.trim()) return;
    await generateArtifact(ProjectStep.IDEA);
    setIsEditing(false);
  };

  const showInput = !state.synthesizedIdea || isEditing;

  const quickStarts = [
    "SaaS Dashboard for AI Analytics",
    "Portfolio for 3D Artist",
    "Fitness App for Seniors",
    "Marketplace for Vintage Clothes"
  ];

  return (
    <div className="relative h-full flex flex-col animate-fade-in overflow-hidden">

      {/* Ambient Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none mix-blend-screen"></div>

      {showInput ? (
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-8 max-w-4xl mx-auto w-full">

          <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center justify-center p-3 mb-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <Sparkles className="w-8 h-8 text-orange-400" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-forge-text bg-none dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:via-orange-100 dark:to-orange-200 tracking-tight leading-tight drop-shadow-sm">
              Vibe Design with <br />
              <span className="text-orange-400">Real Product Vision</span>
            </h1>
            <p className="text-lg text-forge-muted max-w-2xl mx-auto leading-relaxed">
              Transform your raw idea into a comprehensive product blueprint using our advanced agentic workflow.
            </p>
          </div>

          <div className="w-full max-w-2xl backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-2 shadow-2xl ring-1 ring-white/5 group focus-within:ring-orange-500/50 focus-within:bg-white/10 transition-all duration-300">
            <div className="relative">
              <textarea
                className="w-full bg-transparent p-6 text-xl text-forge-text resize-none focus:outline-none placeholder-forge-500 dark:placeholder-forge-500 light:placeholder-slate-400 leading-relaxed min-h-[120px] scrollbar-hide"
                placeholder="Describe your dream product..."
                value={state.ideaInput}
                onChange={(e) => updateIdea(e.target.value)}
                autoFocus={!state.synthesizedIdea}
              />

              <div className="flex items-center justify-between px-4 pb-2 pt-2 border-t border-white/5">
                <div className="flex items-center gap-2 text-xs text-forge-500 font-mono">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 text-forge-400">
                    <span className="text-[10px] border border-forge-600 px-1 rounded">PRO</span>
                    Gemini 2.0 Flash
                  </div>
                </div>
                <button
                  onClick={handleRefine}
                  disabled={!state.ideaInput.trim() || state.isGenerating}
                  className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-semibold px-6 py-2.5 rounded-full shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  {state.isGenerating ? (
                    <>Thinking...</>
                  ) : (
                    <>Start Building <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3 animate-fade-in-up delay-100">
            <span className="text-sm text-forge-muted mr-1 self-center">Try example:</span>
            {quickStarts.map((text, i) => (
              <button
                key={i}
                onClick={() => updateIdea(text)}
                className="px-4 py-1.5 text-xs font-medium text-forge-muted hover:text-forge-text dark:text-forge-300 dark:hover:text-white bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-full transition-all"
              >
                {text}
              </button>
            ))}
          </div>

        </div>
      ) : (
        /* Result View (Kept mostly same but cleaner container) */
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col p-4 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-forge-text mb-2 flex items-center gap-2">
                Product Vision
                <HelpTooltip
                  content="Your refined product idea, transformed by AI into a clear vision statement with target users, value proposition, and key differentiators."
                  title="Vision Statement"
                />
              </h2>
              <p className="text-forge-muted">Your crystallized idea.</p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-forge-300 bg-forge-800/50 hover:bg-forge-800 border border-forge-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit Input
            </button>
          </div>

          <div className="w-full flex-1 min-h-0 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col mb-8 transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-slate-50/80 dark:bg-slate-800/80 flex items-center justify-between backdrop-blur-sm transition-colors">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-semibold transition-colors">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Generated Vision Statement
              </div>
              <CopyButton text={state.synthesizedIdea || ""} />
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-slate-900 transition-colors">
              <MarkdownRenderer content={state.synthesizedIdea} variant="paper" />
            </div>
          </div>

          {/* NotebookLM Worflow Prompts */}
          {/* NotebookLM Worflow Prompts */}
          {state.researchMissionPrompt && (
            <div className="mt-10 animate-fade-in-up delay-100 p-1">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-gray-100 dark:bg-white/10 rounded-lg"><BookOpen className="w-5 h-5 text-orange-500 dark:text-orange-400" /></div>
                    NotebookLM Workflow
                    <HelpTooltip
                      content="Use Google NotebookLM to conduct deep research. Copy the Context Prompt as a source, then use the Report Prompt in the chat to generate a comprehensive research report."
                      title="Research Integration"
                    />
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-forge-muted max-w-lg leading-relaxed">
                    Use these specialized prompts to generate a comprehensive research report in Google NotebookLM.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <CopyButton
                    text={`=== STEP 1: CONTEXT PROMPT (Paste as Source) ===\n\n${state.researchMissionPrompt || ''}\n\n${'='.repeat(50)}\n\n=== STEP 2: REPORT PROMPT (Paste in Chat) ===\n\n${state.reportGenerationPrompt || ''}`}
                    className="px-4 py-2.5 bg-white dark:bg-forge-800 border border-gray-200 dark:border-forge-700 text-gray-700 dark:text-forge-300 hover:bg-gray-50 dark:hover:bg-forge-700 rounded-xl shadow-sm transition-all"
                    title="Copy All Prompts"
                    label="Copy All"
                  />
                  <a
                    href="https://notebooklm.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
                  >
                    Launch NotebookLM <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Step 1 */}
                {/* Step 1 */}
                <GlassCard className="flex flex-col relative overflow-hidden group border-gray-200 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"></div>
                  <div className="p-6 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className="inline-block text-[10px] font-extrabold tracking-widest text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-500/20 px-2 py-1 rounded mb-2">STEP 1: SOURCE</span>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Context Prompt</h4>
                      </div>
                      <CopyButton
                        text={state.researchMissionPrompt || ""}
                        className="text-slate-400 hover:text-white hover:bg-white/10 p-2"
                        title="Copy Source Text"
                      />
                    </div>
                    <p className="text-sm text-gray-700 dark:text-slate-300 mb-4 leading-relaxed">
                      Create a new Notebook. <br />
                      Click <span className="text-gray-900 dark:text-white font-semibold">Add Source &gt; Paste Text</span>.
                    </p>
                    <div className="flex-1 bg-gray-100 dark:bg-black/40 p-4 rounded-xl border border-gray-200 dark:border-white/5 font-mono text-xs text-gray-900 dark:text-slate-300 overflow-y-auto custom-scrollbar min-h-[140px] shadow-inner">
                      {state.researchMissionPrompt}
                    </div>
                  </div>
                </GlassCard>

                {/* Step 2 */}
                {state.reportGenerationPrompt && (
                  <GlassCard className="flex flex-col relative overflow-hidden group border-gray-200 dark:border-white/5 bg-white dark:bg-white/5 shadow-sm hover:shadow-md transition-all">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                    <div className="p-6 flex flex-col h-full">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <span className="inline-block text-[10px] font-extrabold tracking-widest text-blue-600 dark:text-blue-300 bg-blue-100 dark:bg-blue-500/20 px-2 py-1 rounded mb-2">STEP 2: CHAT</span>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white">Report Prompt</h4>
                        </div>
                        <CopyButton
                          text={state.reportGenerationPrompt || ""}
                          className="text-slate-400 hover:text-white hover:bg-white/10 p-2"
                          title="Copy Chat Prompt"
                        />
                      </div>
                      <p className="text-sm text-gray-700 dark:text-slate-300 mb-4 leading-relaxed">
                        Once sources are processed,<br />
                        paste this into the <span className="text-gray-900 dark:text-white font-semibold">Chat Box</span>.
                      </p>
                      <div className="flex-1 bg-gray-100 dark:bg-black/40 p-4 rounded-xl border border-gray-200 dark:border-white/5 font-mono text-xs text-gray-900 dark:text-slate-300 overflow-y-auto custom-scrollbar min-h-[140px] shadow-inner">
                        {state.reportGenerationPrompt}
                      </div>
                    </div>
                  </GlassCard>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => {
                triggerConfetti();
                setTimeout(() => navigate('/research'), 300);
              }}
              className="bg-forge-text text-forge-950 hover:bg-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 group"
            >
              Continue to Research
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}

      {/* Confetti celebration */}
      <Confetti active={showConfetti} onComplete={handleConfettiComplete} particleCount={60} />
    </div>
  );
};


const ResearchPage = () => {
  const { state, addResearch, generateResearchPrompt } = useProject();
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();
  const { showConfetti, triggerConfetti, handleConfettiComplete } = useConfetti();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await addResearch(e.target.files[0]);
    }
  };

  const formatFileSize = (bytes: number, isBase64: boolean) => {
    const realBytes = isBase64 ? bytes * 0.75 : bytes;
    return (realBytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <PageBackground glowColor="purple">
      <div className="max-w-5xl mx-auto min-h-full flex flex-col justify-center p-6 md:p-12 animate-fade-in relative z-10 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-3xl shadow-xl my-8">
        <div className="mb-10 text-center mt-auto md:mt-0">
          <h2 className="text-4xl font-bold text-forge-text mb-3 tracking-tight">Research & Context</h2>
          <p className="text-forge-muted text-lg max-w-2xl mx-auto">
            Ground the AI in your specific domain. Upload documents or review the automated research mission.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 flex-1 min-h-0">

          {/* Upload Area */}
          <GlassCard className="flex flex-col p-2 transition-colors" hoverEffect={true}>
            <div
              className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all duration-300
                 ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-slate-200 dark:border-white/10 hover:border-purple-500/50 hover:bg-slate-50 dark:hover:bg-white/5'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={async (e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files[0]) await addResearch(e.dataTransfer.files[0]);
              }}
            >
              <div className="w-20 h-20 rounded-full bg-purple-500/10 dark:bg-purple-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.15)] dark:shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                <Upload className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-medium text-forge-text mb-2">Upload Knowledge</h3>
              <p className="text-forge-muted text-sm text-center mb-8 max-w-xs leading-relaxed">
                Drag & drop PDFs, TXT, MD, JSON files here. <br /> Perfect for adding NotebookLM exports.
              </p>
              <label className="cursor-pointer group relative overflow-hidden rounded-xl bg-purple-600 px-8 py-3 transition-all hover:bg-purple-500 shadow-lg shadow-purple-500/25">
                <span className="relative font-semibold text-white">Browse Files</span>
                <input type="file" className="hidden" accept=".pdf,.txt,.md,.json" onChange={handleFileChange} />
              </label>
            </div>
          </GlassCard>

          {/* Active Sources Only - Prompts removed as per new flow */}
          <GlassCard className="flex-1 flex flex-col p-6 min-h-[300px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-forge-text flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                Active Sources
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-purple-400/80 bg-purple-400/10 px-2 py-1 rounded">
                  {state.research.length} FILES
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
              {state.research.length === 0 ? (
                <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-forge-muted text-sm border-2 border-dashed border-slate-200 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-white/5">
                  <div className="mb-2 p-2 rounded-full bg-slate-200 dark:bg-white/5">
                    <BookOpen className="w-4 h-4 text-forge-muted" />
                  </div>
                  <p className="font-medium text-forge-text">No sources yet</p>
                  <p className="text-xs text-forge-muted mt-0.5">Using base knowledge only</p>
                </div>
              ) : (
                state.research.map((doc) => (
                  <div key={doc.id} className="group flex items-center gap-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-forge-800 dark:bg-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-xs font-bold text-forge-muted">
                      {doc.mimeType === 'application/pdf' ? 'PDF' : 'TXT'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-forge-text truncate">{doc.name}</div>
                      <div className="text-xs text-forge-muted">{formatFileSize(doc.content.length, doc.mimeType === 'application/pdf')}</div>
                    </div>
                    <button
                      className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-400 transition-all"
                      title="Remove (Not implemented in demo)"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-400/50"></div>
                    </button>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

        </div>

        <div className="flex justify-end pt-6 border-t border-white/10">
          <button
            onClick={() => {
              triggerConfetti();
              setTimeout(() => navigate('/prd'), 300);
            }}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] hover:shadow-purple-500/40"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 origin-left" />
            <span className="relative flex items-center gap-2">
              Next: Generate PRD <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>

        {/* Confetti celebration */}
        <Confetti active={showConfetti} onComplete={handleConfettiComplete} particleCount={60} />
      </div>
    </PageBackground>
  );
};

const PrdPage = () => {
  const { state, generateArtifact, updatePrd, revertToPrdVersion } = useProject();
  const [isExporting, setIsExporting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showRefineModal, setShowRefineModal] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const versionHistoryRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { showConfetti, triggerConfetti, handleConfettiComplete } = useConfetti();

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (versionHistoryRef.current && !versionHistoryRef.current.contains(e.target as Node)) {
        setShowVersionHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format timestamp for display
  const formatVersionTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleRevertVersion = (versionId: string) => {
    if (confirm('This will restore this version as your current PRD. Your current PRD will be saved to history. Continue?')) {
      revertToPrdVersion(versionId);
      setShowVersionHistory(false);
    }
  };

  // Export functions
  const exportAsMarkdown = () => {
    const blob = new Blob([state.prdOutput], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.title.replace(/[^a-z0-9]/gi, '_')}_PRD.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportAsPlainText = () => {
    // Strip markdown formatting for plain text
    const plainText = state.prdOutput
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
      .replace(/\*([^*]+)\*/g, '$1') // Remove italic
      .replace(/`([^`]+)`/g, '$1') // Remove inline code
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links, keep text
      .replace(/^\s*[-*+]\s/gm, '• ') // Convert list markers to bullets
      .replace(/^\s*\d+\.\s/gm, '• '); // Convert numbered lists to bullets

    const blob = new Blob([plainText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.title.replace(/[^a-z0-9]/gi, '_')}_PRD.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  const exportAsPDF = () => {
    setIsExporting(true);
    setShowExportMenu(false);
    setTimeout(() => {
      exportToPDF('prd-pdf-export-overlay', 'Project_PRD.pdf')
        .catch(err => console.error(err))
        .finally(() => setIsExporting(false));
    }, 500);
  };

  // Sync state to local edit buffer when entering edit mode or when PRD changes
  useEffect(() => {
    if (state.prdOutput) {
      setEditContent(state.prdOutput);
    }
  }, [state.prdOutput]);

  const handleGenerate = async () => {
    if (state.prdOutput && !confirm("This will regenerate the PRD and overwrite your current version. Are you sure?")) {
      return;
    }
    await generateArtifact(ProjectStep.PRD);
  };

  const handleManualSave = () => {
    updatePrd(editContent);
    setIsEditing(false);
  };

  const handleAiRefine = async () => {
    if (!refineInstruction.trim()) return;
    setIsRefining(true);
    try {
      const refinedPrd = await GeminiService.refinePrd(state.prdOutput, refineInstruction);
      updatePrd(refinedPrd);
      setShowRefineModal(false);
      setRefineInstruction("");
    } catch (e) {
      alert("Failed to refine PRD. See console.");
      console.error(e);
    } finally {
      setIsRefining(false);
    }
  };

  return (
    <PageBackground glowColor="orange">
      <div className="max-w-5xl mx-auto min-h-full flex flex-col justify-center p-6 md:p-12 animate-fade-in relative z-10 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white rounded-3xl shadow-xl my-8">

        {/* Refine Modal */}
        {showRefineModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-forge-900 border border-forge-700 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-orange-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Refine with AI</h3>
                </div>
                <p className="text-forge-muted text-sm mb-4">
                  Tell the AI how to improve this document. BE SPECIFIC.
                  <br />
                  <span className="text-xs opacity-70">"Add a section for GDPR", "Make the tone more corporate", "Remove the gamification features"</span>
                </p>
                <textarea
                  value={refineInstruction}
                  onChange={(e) => setRefineInstruction(e.target.value)}
                  className="w-full h-32 bg-black/40 border border-forge-700 rounded-xl p-4 text-white placeholder-forge-600 focus:outline-none focus:border-orange-500/50 resize-none mb-6"
                  placeholder="e.g. Add a 'Security Requirements' section focused on OAuth2..."
                  autoFocus
                />
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowRefineModal(false)}
                    className="px-4 py-2 text-forge-muted hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAiRefine}
                    disabled={isRefining || !refineInstruction.trim()}
                    className="px-6 py-2 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-lg shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isRefining ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    {isRefining ? "Refining..." : "Refine PRD"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
          <div>
            <h2 className="text-4xl font-bold text-forge-text mb-2 tracking-tight flex items-center gap-3">
              Product Requirements
              <HelpTooltip
                content="A comprehensive document that defines your product's features, user personas, success metrics, and technical requirements. This is your blueprint for development."
                title="PRD Overview"
                size="md"
              />
            </h2>
            <p className="text-gray-600 dark:text-forge-muted text-lg">Synthesize your Idea and Research into a structured PRD.</p>
          </div>
          <div className="flex gap-3">
            {state.prdOutput && (
              <>
                <button
                  onClick={() => setShowRefineModal(true)}
                  className="bg-white hover:bg-orange-50 dark:bg-forge-800 dark:hover:bg-forge-700 text-orange-600 dark:text-orange-200 border-2 border-orange-200 dark:border-orange-500/20 px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-orange-500 dark:text-orange-400" /> Refine
                </button>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-3 rounded-xl font-bold transition-all flex items-center gap-2 border ${isEditing ? 'bg-orange-500 text-white border-orange-400' : 'bg-gray-100 hover:bg-gray-200 text-slate-700 border-gray-200 dark:bg-forge-800 dark:text-forge-muted dark:border-forge-700 dark:hover:text-white'}`}
                >
                  <Edit2 className="w-4 h-4" /> {isEditing ? 'Done Editing' : 'Edit Manually'}
                </button>
              </>
            )}
            <button
              onClick={handleGenerate}
              disabled={state.isGenerating}
              className="bg-orange-600 hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2"
            >
              {state.isGenerating ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : <RefreshCw className="w-5 h-5" />}
              {state.prdOutput ? 'Regenerate' : 'Generate'}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col relative print:h-auto print:overflow-visible">
          {state.isGenerating ? (
            <div className="flex-1 flex items-center justify-center">
              <LoadingState type="brain" message="Architecting Project" subMessage="Analyzing research, defining personas, and outlining core features..." />
            </div>
          ) : (
            <GlassCard className="flex-1 flex flex-col overflow-hidden print:border-0 print:bg-white print:text-black">
              {/* Toolbar */}
              <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between no-print">
                <span className="text-sm font-bold text-orange-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {isEditing ? "Editing PRD..." : "PRD Document"}
                </span>
                <div className="flex gap-2">
                  {isEditing ? (
                    <button
                      onClick={handleManualSave}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-white transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" /> Save Changes
                    </button>
                  ) : (
                    state.prdOutput && (
                      <>
                        {/* Export Dropdown */}
                        <div ref={exportMenuRef} className="relative">
                          <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-50 hover:text-gray-900 dark:hover:text-white dark:hover:border-orange-500/50 transition-colors disabled:opacity-50"
                            aria-label="Export options"
                            aria-expanded={showExportMenu}
                          >
                            {isExporting ? (
                              <div className="w-3.5 h-3.5 border-2 border-gray-400 dark:border-white/30 border-t-gray-700 dark:border-t-white rounded-full animate-spin" />
                            ) : (
                              <ArrowDownToLine className="w-3.5 h-3.5" />
                            )}
                            {isExporting ? 'Exporting...' : 'Export'}
                            <ChevronRight className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-90' : ''}`} />
                          </button>

                          {/* Export Menu Dropdown */}
                          {showExportMenu && (
                            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-forge-800 border border-gray-200 dark:border-forge-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                              <button
                                onClick={exportAsPDF}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-forge-text hover:bg-gray-50 dark:hover:bg-forge-700 transition-colors text-left"
                              >
                                <FileText className="w-4 h-4 text-red-500" />
                                <div>
                                  <div className="font-medium">PDF Document</div>
                                  <div className="text-xs text-gray-500 dark:text-forge-muted">Best for sharing</div>
                                </div>
                              </button>
                              <button
                                onClick={exportAsMarkdown}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-forge-text hover:bg-gray-50 dark:hover:bg-forge-700 transition-colors text-left border-t border-gray-100 dark:border-forge-700"
                              >
                                <Code2 className="w-4 h-4 text-blue-500" />
                                <div>
                                  <div className="font-medium">Markdown</div>
                                  <div className="text-xs text-gray-500 dark:text-forge-muted">For dev tools</div>
                                </div>
                              </button>
                              <button
                                onClick={exportAsPlainText}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-forge-text hover:bg-gray-50 dark:hover:bg-forge-700 transition-colors text-left border-t border-gray-100 dark:border-forge-700"
                              >
                                <FileIcon className="w-4 h-4 text-gray-500" />
                                <div>
                                  <div className="font-medium">Plain Text</div>
                                  <div className="text-xs text-gray-500 dark:text-forge-muted">Universal format</div>
                                </div>
                              </button>
                            </div>
                          )}
                        </div>
                        <CopyButton
                          text={state.prdOutput}
                          className="bg-white dark:bg-slate-900 border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-transparent"
                          title="Copy to Clipboard"
                        />

                        {/* Version History Button */}
                        <div ref={versionHistoryRef} className="relative">
                          <button
                            onClick={() => setShowVersionHistory(!showVersionHistory)}
                            disabled={!state.prdVersionHistory || state.prdVersionHistory.length === 0}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-white dark:bg-slate-900 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 hover:bg-gray-50 hover:text-gray-900 dark:hover:text-white dark:hover:border-orange-500/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Version History"
                            aria-label="View version history"
                          >
                            <History className="w-3.5 h-3.5" />
                            {state.prdVersionHistory && state.prdVersionHistory.length > 0 && (
                              <span className="bg-gray-200 dark:bg-forge-700 px-1.5 py-0.5 rounded text-[10px]">
                                {state.prdVersionHistory.length}
                              </span>
                            )}
                          </button>

                          {/* Version History Dropdown */}
                          {showVersionHistory && state.prdVersionHistory && state.prdVersionHistory.length > 0 && (
                            <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-forge-800 border border-gray-200 dark:border-forge-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                              <div className="p-3 border-b border-gray-100 dark:border-forge-700">
                                <h4 className="font-semibold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                  <History className="w-4 h-4 text-forge-accent" />
                                  Version History
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-forge-muted mt-1">
                                  Click to restore a previous version
                                </p>
                              </div>
                              <div className="max-h-64 overflow-y-auto">
                                {[...state.prdVersionHistory].reverse().map((version, index) => (
                                  <button
                                    key={version.id}
                                    onClick={() => handleRevertVersion(version.id)}
                                    className="w-full flex items-start gap-3 px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-forge-700 transition-colors border-t border-gray-100 dark:border-forge-700 first:border-t-0 group"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-forge-700 flex items-center justify-center flex-shrink-0 group-hover:bg-forge-accent/20">
                                      <RotateCcw className="w-3.5 h-3.5 text-gray-500 dark:text-forge-muted group-hover:text-forge-accent" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                          {version.label || 'Version'}
                                        </span>
                                        <span className="text-[10px] text-gray-400 dark:text-forge-muted">
                                          {formatVersionTime(version.timestamp)}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500 dark:text-forge-muted truncate mt-0.5">
                                        {version.content.substring(0, 60)}...
                                      </p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )
                  )}
                </div>
              </div>

              {/* Content / Editor */}
              <div className="flex-1 overflow-y-auto p-0 md:p-0 custom-scrollbar bg-slate-50 dark:bg-slate-950/20 print:p-0 print:bg-white print:overflow-visible relative">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full h-full bg-slate-950/50 text-slate-200 font-mono text-sm p-8 focus:outline-none resize-none"
                    spellCheck={false}
                  />
                ) : (
                  <div className="p-8 md:p-12">
                    <div id="prd-content-area" className="text-slate-200">
                      {state.prdOutput ? (
                        <>
                          <MarkdownRenderer content={state.prdOutput} />

                          {/* Export Overlay */}
                          {isExporting && (
                            <div className="fixed inset-0 z-[9999] bg-slate-950/95 flex flex-col items-center justify-center p-8 backdrop-blur-sm animate-in fade-in duration-200">
                              <div className="mb-6 p-4 rounded-full bg-orange-500/10 animate-bounce">
                                <Download className="w-8 h-8 text-orange-500" />
                              </div>
                              <h3 className="text-2xl font-bold text-white mb-2">Generating Professional PDF...</h3>
                              <p className="text-slate-400 mb-8">Please wait while we format your document.</p>

                              <div className="max-w-[800px] w-full max-h-[60vh] overflow-y-auto rounded-lg shadow-2xl custom-scrollbar">
                                <div id="prd-pdf-export-overlay" className="bg-white text-black p-12 w-full h-auto">
                                  <MarkdownRenderer content={state.prdOutput} variant="paper" />
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-forge-muted py-20">
                          <div className="relative mb-6">
                            <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                            <Brain className="relative z-10 w-20 h-20 text-orange-400" />
                          </div>
                          <h3 className="text-2xl font-bold text-forge-text mb-2">Ready to Architect</h3>
                          <p className="text-center max-w-md leading-relaxed">
                            Click Generate to transform your vision into a professional requirements document.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Nav */}
              {state.prdOutput && !isEditing && (
                <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end no-print">
                  <button
                    onClick={() => {
                      triggerConfetti();
                      setTimeout(() => navigate('/realization'), 300);
                    }}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Proceed to Realization <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </GlassCard>
          )}
        </div>

        {/* Confetti celebration */}
        <Confetti active={showConfetti} onComplete={handleConfettiComplete} particleCount={60} />
      </div>
    </PageBackground>
  );
};


const RealizationPage = () => {
  const { state, generateArtifact, toggleStepCompletion } = useProject();
  const [expandedPhase, setExpandedPhase] = useState<number | null>(0); // Default open first phase
  const [showHireModal, setShowHireModal] = useState(false);

  // Safe parsing
  let roadmapPhases: any[] = [];
  try {
    if (state.roadmapOutput) {
      const jsonStr = state.roadmapOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      roadmapPhases = Array.isArray(parsed) ? parsed : (parsed.phases || []);
    }
  } catch (e) {
    console.error("Failed to parse roadmap usage", e);
  }

  // Calculate Progress
  const allSteps = roadmapPhases.flatMap((p, pIdx) => p.steps?.map((s: any, sIdx: number) => ({ ...s, id: `${pIdx}-${sIdx}` })));
  const totalSteps = allSteps.length;
  const completedCount = (state.completedRoadmapSteps || []).length;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  // Helper for Badges
  const getBadge = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('setup') || n.includes('init') || n.includes('config')) return { label: 'Setup', color: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300' };
    if (n.includes('database') || n.includes('auth') || n.includes('backend') || n.includes('api')) return { label: 'Backend', color: 'bg-emerald-100 text-emerald-800 dark:bg-green-500/20 dark:text-green-300' };
    if (n.includes('ui') || n.includes('frontend') || n.includes('component') || n.includes('page')) return { label: 'Frontend', color: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' };
    return { label: 'Task', color: 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300' };
  };

  return (
    <PageBackground glowColor="blue">
      <div className="max-w-5xl mx-auto min-h-full flex flex-col p-6 md:p-12 animate-fade-in relative z-10 gap-8 pb-32 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-3xl shadow-xl my-8">

        {/* Header with Progress */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-4xl font-bold text-forge-text mb-2 tracking-tight flex items-center gap-3">
                Realization Engine
                <HelpTooltip
                  content="Your implementation roadmap broken into phases and tasks. Each task includes AI prompts you can copy directly into Google AI Studio or your preferred coding assistant."
                  title="Implementation Guide"
                  size="md"
                />
              </h2>
              <p className="text-forge-muted text-lg">Execute your plan: Task by task.</p>
            </div>

            {/* Actions: Generate or Regenerate */}
            <div className="flex items-center gap-3">
              {/* Show 'Regenerate' if output exists (Secondary action) */}
              {state.roadmapOutput && !state.isGenerating && (
                <button
                  onClick={() => {
                    if (window.confirm("Regenerating the roadmap will overwrite your current progress and tasks. Are you sure?")) {
                      generateArtifact(ProjectStep.CODE);
                    }
                  }}
                  className="text-slate-400 hover:text-white px-4 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Regenerate Plan
                </button>
              )}

              {/* Show Primary 'Generate' if no output (Header version) */}
              {!state.roadmapOutput && (
                <button
                  onClick={() => generateArtifact(ProjectStep.CODE)}
                  disabled={state.isGenerating || !state.prdOutput}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] flex items-center gap-2 group"
                >
                  {state.isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      Generate Roadmap
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Progress Bar (Gamification) */}
          {state.roadmapOutput && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between text-xs font-bold text-slate-900 dark:text-slate-400 mb-2 uppercase tracking-wide">
                  <span>Project Velocity</span>
                  <span className={progressPercent === 100 ? "text-green-400" : "text-blue-400"}>{progressPercent}% Complete</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 ease-out ${progressPercent === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
              {progressPercent === 100 && (
                <div className="p-2 bg-green-500/10 rounded-full animate-bounce">
                  <Check className="w-5 h-5 text-green-400" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        {state.isGenerating ? (
          <LoadingState type="code" message="Architecting Solution" subMessage="Breaking down the plan into DIY modules vs Expert tasks..." />
        ) : !state.roadmapOutput ? (
          <div className="flex-1 flex flex-col items-center justify-center text-forge-muted py-16 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-50 dark:bg-white/5 group hover:border-blue-500/20 transition-colors">
            <div className="p-6 bg-slate-900 rounded-full mb-6 group-hover:scale-110 transition-transform duration-500 ring-1 ring-white/10 shadow-2xl">
              <Map className="w-12 h-12 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-forge-text mb-2">Ready to Build?</h3>
            <p className="text-forge-muted max-w-md text-center mb-8">
              Transform your PRD into a step-by-step technical roadmap.
              The AI will break down every feature into copy-pasteable code tasks.
            </p>

            <button
              onClick={() => generateArtifact(ProjectStep.CODE)}
              disabled={!state.prdOutput}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:grayscale text-white font-bold px-10 py-4 rounded-xl shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-1 flex items-center gap-3"
            >
              <Sparkles className="w-5 h-5" /> Initialize Realization Engine
            </button>

            {!state.prdOutput && (
              <p className="mt-4 text-xs text-red-400 bg-red-900/20 px-3 py-1 rounded-full border border-red-500/20">
                ⚠️ Complete the PRD phase first
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {roadmapPhases.map((phase: any, i: number) => {
              const isOpen = expandedPhase === i;
              return (
                <div key={i} className={`rounded-xl border transition-all duration-300 overflow-hidden ${isOpen ? 'bg-white dark:bg-white/5 border-blue-500/30 ring-1 ring-blue-500/20' : 'bg-transparent border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}>

                  {/* Phase Header (Accordion Trigger) */}
                  <button
                    onClick={() => setExpandedPhase(isOpen ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-lg flex items-center justify-center font-bold text-lg w-12 h-12 transition-colors ${isOpen ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {i + 1}
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold transition-colors ${isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-300'}`}>{phase.phaseName || phase.title}</h3>
                        <p className="text-sm text-slate-500">{phase.description?.substring(0, 60)}...</p>
                      </div>
                    </div>
                    <div className={`p-2 rounded-full transition-transform duration-300 ${isOpen ? 'bg-white/10 rotate-180' : 'bg-transparent rotate-0'}`}>
                      <div className="custom-scrol"><ArrowDownToLine className="w-5 h-5 text-slate-400" /></div> {/* Reusing Icon as Chevron-ish */}
                    </div>
                  </button>

                  {/* Phase Body (Expanded) */}
                  {isOpen && (
                    <div className="px-6 pb-6 animate-in slide-in-from-top-4 duration-300">
                      {/* DIY Header */}
                      <div className="flex items-center justify-between mb-4 pt-4 border-t border-white/10">
                        <h4 className="text-sm font-bold text-gray-500 dark:text-blue-300 uppercase tracking-widest flex items-center gap-2">
                          <Code2 className="w-4 h-4" /> Phase Tasks
                        </h4>
                        <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-white flex items-center gap-1 border border-blue-500/20 px-3 py-1.5 rounded-full hover:bg-blue-500/20 transition-colors">
                          Open AI Studio <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* Task Grid */}
                      <div className="grid grid-cols-1 gap-4">
                        {phase.steps?.map((step: any, j: number) => {
                          const stepId = `${i}-${j}`;
                          const isComplete = (state.completedRoadmapSteps || []).includes(stepId);
                          const badge = getBadge(step.stepName);

                          return (
                            <div key={j} className={`group relative p-5 rounded-xl border transition-all duration-300 ${isComplete ? 'bg-green-50 dark:bg-green-900/10 border-green-500/30 opacity-75' : 'bg-white dark:bg-black/40 border-slate-200 dark:border-white/10 hover:border-blue-500/40'}`}>
                              <div className="flex items-start gap-4">
                                {/* Checkbox (Gamification) */}
                                <button
                                  onClick={() => toggleStepCompletion(stepId)}
                                  className={`mt-1 w-6 h-6 rounded-md border flex items-center justify-center transition-all ${isComplete ? 'bg-green-500 border-green-500 text-white' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 hover:border-blue-400 text-transparent'}`}
                                >
                                  <Check className="w-4 h-4" />
                                </button>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badge.color}`}>{badge.label}</span>
                                    <h5 className={`font-bold text-lg ${isComplete ? 'text-green-600 dark:text-green-200 line-through' : 'text-gray-900 dark:text-white'}`}>{step.stepName}</h5>
                                    {/* Outer Copy Button removed to encourage opening details for full context */}
                                  </div>

                                  {/* Collapsible Prompt (Progressive Disclosure) */}
                                  <details className="group/details">
                                    <summary className="cursor-pointer list-none text-xs font-mono text-slate-400 hover:text-blue-300 transition-colors flex items-center gap-2 mt-2">
                                      <Terminal className="w-3 h-3" /> View AI Studio Prompts
                                    </summary>
                                    <div className="mt-3 space-y-3 animate-in slide-in-from-top-2 duration-200">
                                      {/* System Instructions (AI Studio) */}
                                      {step.systemPrompt && (
                                        <div className="bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-indigo-500/30 overflow-hidden">
                                          <div className="bg-white dark:bg-indigo-500/10 px-3 py-1.5 flex justify-between items-center border-b border-gray-200 dark:border-indigo-500/10">
                                            <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-2">
                                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> System Instructions
                                            </span>
                                            <CopyButton text={step.systemPrompt} className="hover:text-indigo-300" />
                                          </div>
                                          <div className="p-3 overflow-x-auto">
                                            <pre className="text-xs font-mono text-gray-800 dark:text-indigo-200/80 whitespace-pre-wrap leading-relaxed">{step.systemPrompt}</pre>
                                          </div>
                                        </div>
                                      )}

                                      {/* User Prompt */}
                                      <div className="bg-gray-50 dark:bg-slate-950 rounded-lg border border-gray-200 dark:border-white/10 overflow-hidden">
                                        <div className="bg-white dark:bg-white/5 px-3 py-1.5 flex justify-between items-center border-b border-gray-200 dark:border-white/5">
                                          <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-slate-400 tracking-wider flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-slate-400"></span> User Prompt
                                          </span>
                                          <CopyButton text={step.diyPrompt || step.technicalBrief} className="text-gray-400 hover:text-gray-600 dark:hover:text-white" />
                                        </div>
                                        <div className="p-3 overflow-x-auto">
                                          <pre className="text-xs font-mono text-gray-800 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                            {step.diyPrompt || step.technicalBrief}
                                          </pre>
                                        </div>
                                      </div>
                                    </div>
                                  </details>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* GLOBAL HIRE CTA - Footer */}
            <div className="mt-12 pt-8 border-t border-white/10 pb-20">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-orange-400/50 bg-white dark:bg-slate-900 group transition-all duration-300 hover:border-orange-500/50 hover:shadow-2xl hover:shadow-orange-500/20">

                {/* Full Card Hover Glow (Active on Group Hover) */}
                <div className="absolute inset-0 bg-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-[2px]"></div>

                {/* Background Ambient Glows */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2 group-hover:bg-orange-500/30 transition-colors duration-500"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[80px] pointer-events-none translate-y-1/2 -translate-x-1/2 group-hover:bg-amber-500/20 transition-colors duration-500"></div>

                {/* Content Container (Padding applied here so bg covers full card) */}
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-orange-500 text-white uppercase tracking-widest shadow-lg shadow-orange-500/30 group-hover:shadow-orange-500/50 transition-shadow">Premium</span>
                      <span className="text-xs font-bold text-orange-300 uppercase tracking-widest group-hover:text-orange-200 transition-colors">Done For You</span>
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-3 group-hover:drop-shadow-[0_2px_10px_rgba(249,115,22,0.3)] transition-all">Fast Track Your Launch</h3>
                    <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-6 max-w-xl group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      Skip the DIY learning curve. Instead of building from scratch, let our expert team handle the technical heavy lifting so you can focus on scale.
                    </p>
                    <ul className="text-sm text-gray-600 dark:text-slate-400 space-y-2 mb-2 group-hover:text-gray-900 dark:group-hover:text-slate-200 transition-colors">
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 group-hover:text-orange-400" /> Professional Implementation</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 group-hover:text-orange-400" /> Scalable Architecture</li>
                      <li className="flex items-center gap-2"><Check className="w-4 h-4 text-orange-500 group-hover:text-orange-400" /> 14-Day Delivery Guarantee</li>
                    </ul>
                  </div>
                  <div>
                    <a
                      href="mailto:contact@jalanea.com?subject=Fast%20Track%20Build%20Quote&body=I%20am%20interested%20in%20fast-tracking%20my%20project."
                      className="group/btn relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-orange-600 font-lg rounded-2xl focus:outline-none hover:bg-orange-500 hover:scale-[1.03] hover:shadow-2xl hover:shadow-orange-500/40 border border-orange-400/20"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Get a Quote <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Fast Track Toggle (Sticky) - Hidden when scrolling near bottom? Simple logic: Always bottom right but with backdrop */}
        {!state.isGenerating && state.roadmapOutput && (
          <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4 fade-in duration-500 delay-1000">
            <a
              href="mailto:contact@jalanea.com"
              className="group relative flex items-center gap-3 bg-slate-900/80 backdrop-blur-md border border-orange-500/50 text-white pl-4 pr-2 py-2 rounded-full shadow-2xl hover:scale-105 transition-all hover:border-orange-400 hover:shadow-orange-500/20"
            >
              <span className="text-sm font-bold text-orange-400 group-hover:text-amber-300 transition-colors">Stuck?</span>
              <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold px-4 py-2 rounded-full shadow-lg">
                Fast Track ⚡️
              </span>
            </a>
          </div>
        )}
      </div>
    </PageBackground>
  );
};

// --- Layout ---

const Layout = () => {
  const location = useLocation();
  const { user, profile } = useAuth();
  const { state, openSupport, setCurrentStep, openProjectList } = useProject();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isOwner = profile?.role === 'owner';

  const navItems: NavItem[] = [
    { label: 'Idea', step: ProjectStep.IDEA, icon: Lightbulb, path: '/' },
    { label: 'Research', step: ProjectStep.RESEARCH, icon: BookOpen, path: '/research' },
    { label: 'PRD', step: ProjectStep.PRD, icon: FileText, path: '/prd' },
    { label: 'Realization', step: ProjectStep.CODE, icon: Code2, path: '/realization' },
  ];

  const { error, clearError } = useAuth();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(clearError, 6000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  // Sync current step with route
  useEffect(() => {
    const item = navItems.find(i => i.path === location.pathname);
    if (item && item.step !== state.currentStep) {
      setCurrentStep(item.step);
    }
  }, [location.pathname, state.currentStep, setCurrentStep]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close mobile menu on Escape
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        return;
      }

      // Navigation shortcuts: Cmd/Ctrl + 1-4
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const key = e.key;
        if (key >= '1' && key <= '4') {
          e.preventDefault();
          const index = parseInt(key) - 1;
          if (navItems[index]) {
            window.location.hash = navItems[index].path;
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const handleNavClick = (path: string) => {
    window.location.hash = path;
    setMobileMenuOpen(false);
  };

  // Show landing page for logged-out users at root
  if (!user && location.pathname === '/') {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-forge-900 text-forge-text selection:bg-orange-100 selection:text-orange-900">
      {/* Skip link for keyboard/screen reader users */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      {/* Onboarding Tour for first-time users */}
      <OnboardingTour />

      {/* Mobile Sidebar Overlay */}
      <div
        className={`mobile-menu-overlay ${mobileMenuOpen ? 'active' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`mobile-sidebar bg-forge-950 border-r border-forge-700 flex flex-col ${mobileMenuOpen ? 'active' : ''}`}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="p-4 border-b border-forge-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-forge-accent flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-forge-text">FORGE</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg text-forge-muted hover:text-forge-text hover:bg-forge-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="text-xs font-bold text-forge-500 uppercase tracking-widest mb-4">Workflow</div>
          <nav className="space-y-2">
            {navItems.map((item) => {
              let isComplete = false;
              if (item.step === ProjectStep.IDEA && state.synthesizedIdea) isComplete = true;
              if (item.step === ProjectStep.RESEARCH && state.research.length > 0) isComplete = true;
              if (item.step === ProjectStep.PRD && state.prdOutput) isComplete = true;
              if (item.step === ProjectStep.CODE && state.roadmapOutput) isComplete = true;

              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group border ${
                    location.pathname === item.path
                      ? 'bg-forge-800 border-forge-700 text-forge-accent shadow-sm'
                      : 'border-transparent text-forge-muted hover:bg-forge-800 hover:text-forge-text'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-forge-accent' : 'text-forge-600 group-hover:text-forge-text'}`} />
                  <span className="font-medium text-sm">{item.label}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {isComplete && <Check className="w-4 h-4 text-emerald-500" />}
                    {location.pathname === item.path && <ChevronRight className="w-4 h-4 text-forge-400" />}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-forge-700 space-y-3 safe-bottom">
          <button
            onClick={() => { openProjectList(); setMobileMenuOpen(false); }}
            className="w-full p-3 rounded-xl border border-forge-700 bg-forge-900/30 hover:bg-forge-800 transition-colors text-center"
          >
            <FolderOpen className="w-5 h-5 mx-auto mb-1 text-forge-muted" />
            <span className="text-sm font-medium text-forge-text">My Projects</span>
          </button>
          <button
            onClick={() => { openSupport(); setMobileMenuOpen(false); }}
            className="w-full p-3 rounded-xl border border-forge-700 bg-forge-900/30 hover:bg-forge-800 transition-colors text-center"
          >
            <Bug className="w-5 h-5 mx-auto mb-1 text-forge-muted" />
            <span className="text-sm font-medium text-forge-text">Get Support</span>
          </button>
        </div>
      </aside>

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-red-500/10 border border-red-500/50 backdrop-blur-md text-red-500 p-4 rounded-xl shadow-2xl flex items-start gap-3 animate-fade-in">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-sm font-medium">{error}</div>
          <button onClick={clearError} className="hover:bg-red-500/10 p-1 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-forge-700 bg-forge-950 p-6 flex flex-col gap-2 hidden md:flex overflow-y-auto custom-scrollbar">
          <div className="text-xs font-bold text-forge-500 uppercase tracking-widest mb-4 px-4 flex-shrink-0">Workflow</div>
          {navItems.map((item) => {
            // Determine completion status
            let isComplete = false;
            if (item.step === ProjectStep.IDEA && state.synthesizedIdea) isComplete = true;
            if (item.step === ProjectStep.RESEARCH && state.research.length > 0) isComplete = true;
            if (item.step === ProjectStep.PRD && state.prdOutput) isComplete = true;
            // Realization/Code marks complete if Master Prompt is generated
            if (item.step === ProjectStep.CODE && state.antigravityPrompt) isComplete = true;

            return (
              <div key={item.path} onClick={() => window.location.hash = item.path} className="cursor-pointer group relative">
                <SidebarLink
                  item={item}
                  isActive={location.pathname === item.path}
                  isComplete={isComplete}
                />
              </div>
            );
          })}

          <div className="mt-auto pt-6 border-t border-forge-700">
            <div className="bg-forge-800/50 p-4 rounded-xl border border-forge-700 mb-3">
              <h4 className="font-medium text-forge-text text-sm mb-2">Pro Tip</h4>
              <p className="text-xs text-forge-muted leading-relaxed">
                Add NotebookLM exports in the Research tab to ground the model.
              </p>
            </div>
            <div className="bg-forge-800/30 p-3 rounded-lg border border-forge-700/50">
              <p className="text-[10px] text-forge-500 uppercase tracking-wider mb-2 font-semibold">Keyboard Shortcuts</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-forge-muted">
                <span className="font-mono bg-forge-800 px-1.5 py-0.5 rounded">⌘1</span><span>Idea</span>
                <span className="font-mono bg-forge-800 px-1.5 py-0.5 rounded">⌘2</span><span>Research</span>
                <span className="font-mono bg-forge-800 px-1.5 py-0.5 rounded">⌘3</span><span>PRD</span>
                <span className="font-mono bg-forge-800 px-1.5 py-0.5 rounded">⌘4</span><span>Realization</span>
              </div>
            </div>
            <a
              href="https://jalanea.com"
              target="_blank"
              rel="noreferrer"
              className="mt-4 block p-3 rounded-xl border border-forge-700 bg-forge-900/30 hover:bg-forge-800 transition-colors text-center group"
            >
              <span className="text-xs text-forge-500 uppercase tracking-widest group-hover:text-forge-accent transition-colors">Made by</span>
              <div className="font-bold text-forge-text mt-1 group-hover:text-white">Meet Jalanea ↗</div>
            </a>
            <button
              onClick={() => openSupport()}
              className="mt-4 block w-full p-3 rounded-xl border border-forge-700 bg-forge-900/30 hover:bg-forge-800 transition-colors text-center group"
            >
              <span className="text-xs text-forge-500 uppercase tracking-widest group-hover:text-forge-accent transition-colors">Need Help?</span>
              <div className="font-bold text-forge-text mt-1 group-hover:text-white">Get Support</div>
            </button>
            {isOwner && (
              <button
                onClick={() => window.location.hash = '/admin'}
                className="mt-4 block w-full p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 transition-colors text-center group"
              >
                <div className="flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span className="font-bold text-purple-300 group-hover:text-purple-200">Admin Panel</span>
                </div>
              </button>
            )}
          </div>
        </aside>

        <main id="main-content" className="flex-1 overflow-auto bg-forge-900 relative" role="main" aria-label="Main content">
          <div className="h-full">
            <Routes>
              <Route path="/" element={<IdeaPage />} />
              <Route path="/app" element={<IdeaPage />} />
              <Route path="/research" element={<ResearchPage />} />
              <Route path="/prd" element={<PrdPage />} />
              <Route path="/realization" element={<RealizationPage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- App Root & Provider ---


const App = () => {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <ProjectProvider>
          <HashRouter>
            <Layout />
          </HashRouter>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;