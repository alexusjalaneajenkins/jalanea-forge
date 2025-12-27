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
  Bug
} from 'lucide-react';
import { ProjectState, ProjectStep, ResearchDocument, NavItem, ProjectMetadata, RoadmapPhase } from './types';
import * as GeminiService from './services/geminiService';
import { MarkdownRenderer } from './components/MarkdownRenderer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { saveProject, loadProject, createProject, getUserProjects, deleteProject } from './services/firebase';
import { ProjectListDialog } from './components/ProjectListDialog';
import { SettingsModal } from './components/SettingsModal';
import { SupportModal } from './components/SupportModal';
import { MISSING_API_KEY_ERROR } from './services/geminiService';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import { PageBackground } from './components/PageBackground';
import { GlassCard } from './components/GlassCard';
import { LoadingState } from './components/LoadingState';
import html2pdf from 'html2pdf.js';

// --- Utils ---

const exportToPDF = (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;
  const opt = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, logging: false },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
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

const CopyButton = ({ text, className = "", title = "Copy to Clipboard", variant = "dark" }: { text: string, className?: string, title?: string, variant?: "dark" | "light" }) => {
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
      <div className="relative w-4 h-4">
        <div className={`absolute inset-0 transition-all duration-300 ${copied ? 'scale-0 opacity-0 rotate-45' : 'scale-100 opacity-100 rotate-0'}`}>
          <Copy className="w-4 h-4" />
        </div>
        <div className={`absolute inset-0 transition-all duration-300 ${copied ? 'scale-100 opacity-100 rotate-0' : 'scale-0 opacity-0 -rotate-45'}`}>
          <Check className="w-4 h-4" />
        </div>
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

const Header = () => {
  const { user, signIn, logOut, loading } = useAuth();
  const { openProjectList, state, updateTitle, openSettings } = useProject();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') setIsEditingTitle(false);
  };

  return (
    <header className="h-20 border-b border-forge-700 bg-forge-950 flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-forge-accent flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xl tracking-tight text-forge-text leading-tight">JALANEA FORGE</span>
            <span className="text-forge-700">/</span>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={state.title}
                onChange={(e) => updateTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={handleKeyDown}
                className="bg-forge-900 text-forge-text font-medium text-sm px-2 py-0.5 rounded border border-forge-700 focus:outline-none focus:border-forge-accent min-w-[150px]"
              />
            ) : (
              <div
                onClick={() => setIsEditingTitle(true)}
                className="font-medium text-forge-text hover:bg-forge-900 px-2 py-0.5 rounded cursor-pointer transition-colors flex items-center gap-2 group"
                title="Rename Project"
              >
                {state.title}
                <Edit2 className="w-3 h-3 text-forge-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-forge-500 font-medium mt-0.5">AI Product Designer</p>
            <span className="text-forge-700 text-xs mt-0.5">•</span>
            <p className="text-xs text-forge-accent font-semibold mt-0.5">
              Step {(Object.values(ProjectStep).indexOf(state.currentStep) + 1)} of 6
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={openProjectList}
          className="p-2 rounded-lg bg-forge-800 border border-forge-700 text-forge-muted hover:text-forge-text hover:border-forge-600 transition-all shadow-sm md:hidden"
          title="My Projects"
        >
          <FolderOpen className="w-5 h-5" />
        </button>
        <button
          onClick={openSettings}
          className="p-2 rounded-lg bg-forge-800 border border-forge-700 text-forge-muted hover:text-forge-text hover:border-forge-600 transition-all shadow-sm"
          title="AI Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
        <ThemeToggle />
        {loading ? (
          <div className="h-8 w-8 rounded-full bg-forge-800 animate-pulse"></div>
        ) : user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-forge-muted mr-2 hidden md:inline">Welcome, {user.displayName?.split(' ')[0]}</span>

            <button
              onClick={openProjectList}
              className="p-2 text-forge-muted hover:text-forge-text hover:bg-forge-800 rounded-lg transition-colors mr-2"
              title="My Projects"
            >
              <FolderOpen className="w-5 h-5" />
            </button>

            <div
              onClick={logOut}
              className="h-9 w-9 rounded-full bg-forge-800 flex items-center justify-center text-xs font-bold border border-forge-700 text-forge-muted overflow-hidden cursor-pointer hover:border-red-500 hover:text-red-500 transition-all shadow-sm"
              title="Sign Out"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                user.displayName?.charAt(0) || 'U'
              )}
            </div>
          </div>
        ) : (
          <button
            onClick={signIn}
            className="text-sm font-semibold bg-forge-accent hover:bg-orange-600 text-white px-5 py-2.5 rounded-lg transition-colors shadow-lg shadow-orange-500/20 flex items-center gap-2"
          >
            <span>Sign in with Google</span>
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
            <h1 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white via-orange-100 to-orange-200 tracking-tight leading-tight drop-shadow-sm">
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
                className="w-full bg-transparent p-6 text-xl text-white resize-none focus:outline-none placeholder-forge-500 leading-relaxed min-h-[120px] scrollbar-hide"
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
                className="px-4 py-1.5 text-xs font-medium text-forge-300 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-full transition-all hover:text-white"
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
              <h2 className="text-3xl font-bold text-forge-text mb-2">Product Vision</h2>
              <p className="text-forge-muted">Your crystallized idea.</p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-medium text-forge-300 bg-forge-800/50 hover:bg-forge-800 border border-forge-700 rounded-lg transition-colors flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" /> Edit Input
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
            <div className="p-4 border-b border-gray-100 bg-slate-50/80 flex items-center justify-between backdrop-blur-sm">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Sparkles className="w-4 h-4 text-orange-500" />
                Generated Vision Statement
              </div>
              <CopyButton text={state.synthesizedIdea || ""} />
            </div>
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
              <MarkdownRenderer content={state.synthesizedIdea} variant="paper" />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => navigate('/research')}
              className="bg-forge-text text-forge-950 hover:bg-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 group"
            >
              Continue to Research
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};


const ResearchPage = () => {
  const { state, addResearch } = useProject();
  const [isDragging, setIsDragging] = useState(false);
  const navigate = useNavigate();

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
      <div className="max-w-5xl mx-auto min-h-full flex flex-col justify-center p-6 md:p-12 animate-fade-in relative z-10">
        <div className="mb-10 text-center mt-auto md:mt-0">
          <h2 className="text-4xl font-bold text-white mb-3 tracking-tight">Research & Context</h2>
          <p className="text-forge-muted text-lg max-w-2xl mx-auto">
            Ground the AI in your specific domain. Upload documents or review the automated research mission.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 flex-1 min-h-0">
          
          {/* Upload Area */}
          <GlassCard className="flex flex-col p-8 transition-colors" hoverEffect={true}>
             <div 
               className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-8 transition-all duration-300
                 ${isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-purple-500/50 hover:bg-white/5'}`}
               onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
               onDragLeave={() => setIsDragging(false)}
               onDrop={async (e) => {
                 e.preventDefault();
                 setIsDragging(false);
                 if (e.dataTransfer.files[0]) await addResearch(e.dataTransfer.files[0]);
               }}
             >
               <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                 <Upload className="w-8 h-8 text-purple-400" />
               </div>
               <h3 className="text-xl font-medium text-white mb-2">Upload Knowledge</h3>
               <p className="text-slate-400 text-sm text-center mb-8 max-w-xs leading-relaxed">
                 Drag & drop PDFs, TXT, MD, JSON files here. <br/> Perfect for adding NotebookLM exports.
               </p>
               <label className="cursor-pointer group relative overflow-hidden rounded-xl bg-purple-600 px-8 py-3 transition-all hover:bg-purple-500 shadow-lg shadow-purple-500/25">
                 <span className="relative font-semibold text-white">Browse Files</span>
                 <input type="file" className="hidden" accept=".pdf,.txt,.md,.json" onChange={handleFileChange} />
               </label>
             </div>
          </GlassCard>

          {/* Active Sources & Mission */}
          <div className="flex flex-col gap-6">
            <GlassCard className="flex-1 flex flex-col p-6 min-h-[300px]">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-semibold text-white flex items-center gap-2">
                   <BookOpen className="w-5 h-5 text-purple-400" />
                   Active Sources
                 </h3>
                 <span className="text-xs font-mono text-purple-400/80 bg-purple-400/10 px-2 py-1 rounded">
                   {state.research.length} FILES
                 </span>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {state.research.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 italic text-sm border-2 border-dashed border-white/5 rounded-xl">
                    <p>No sources yet.</p>
                    <p className="text-xs opacity-60 mt-1">Using base knowledge only.</p>
                  </div>
                ) : (
                  state.research.map((doc) => (
                    <div key={doc.id} className="group flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all">
                      <div className="w-10 h-10 rounded-lg bg-slate-900 border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400">
                        {doc.mimeType === 'application/pdf' ? 'PDF' : 'TXT'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">{doc.name}</div>
                        <div className="text-xs text-slate-500">{formatFileSize(doc.content.length, doc.mimeType === 'application/pdf')}</div>
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

            {state.researchMissionPrompt ? (
               <GlassCard className="p-6">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-widest">Research Mission</h3>
                   <button 
                     onClick={() => exportToPDF('research-mission-content', 'Research_Mission.pdf')}
                     className="text-xs text-purple-400 hover:text-white flex items-center gap-1 transition-colors"
                   >
                     <ArrowDownToLine className="w-3 h-3" /> Save PDF
                   </button>
                 </div>
                 <div id="research-mission-content" className="text-sm text-slate-300 leading-relaxed max-h-40 overflow-y-auto custom-scrollbar bg-slate-950/30 p-4 rounded-lg border border-white/5">
                    {state.researchMissionPrompt}
                 </div>
               </GlassCard>
            ) : null}
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-white/10">
          <button
            onClick={() => navigate('/prd')}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-4 font-bold text-white shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] hover:shadow-purple-500/40"
          >
            <div className="absolute inset-0 bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-out -skew-x-12 origin-left" />
            <span className="relative flex items-center gap-2">
              Next: Generate PRD <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </PageBackground>
  );
};

const PrdPage = () => {
  const { state, generateArtifact } = useProject();
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (state.prdOutput && !confirm("This will regenerate the PRD and overwrite your current version. Are you sure?")) {
      return;
    }
    await generateArtifact(ProjectStep.PRD);
  };

  return (
    <PageBackground glowColor="orange">
      <div className="max-w-5xl mx-auto min-h-full flex flex-col justify-center p-6 md:p-12 animate-fade-in relative z-10">
        
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 no-print">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Product Requirements</h2>
            <p className="text-forge-muted text-lg">Synthesize your Idea and Research into a structured PRD.</p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={state.isGenerating}
            className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-orange-500/30 transition-all hover:scale-[1.02] flex items-center gap-2"
          >
            {state.isGenerating ? (
               // Simple spinner for button, main loading state is below
               <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> 
            ) : <Sparkles className="w-5 h-5" />}
            {state.prdOutput ? 'Regenerate PRD' : 'Generate PRD'}
          </button>
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
                  PRD Document
                </span>
                <div className="flex gap-2">
                  {state.prdOutput && (
                    <>
                      <button
                        onClick={() => exportToPDF('prd-content-area', 'Project_PRD.pdf')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 border border-white/10 text-slate-300 hover:text-white hover:border-orange-500/50 transition-colors"
                        title="Save as PDF"
                      >
                        <ArrowDownToLine className="w-3.5 h-3.5" />
                        Export PDF
                      </button>
                      <CopyButton
                        text={state.prdOutput}
                        className="bg-slate-900 border-white/10"
                        title="Copy to Clipboard"
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Markdown Content */}
              <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar bg-slate-950/20 print:p-0 print:bg-white print:overflow-visible">
                 <div id="prd-content-area" className="text-slate-200">
                    {state.prdOutput ? (
                      <MarkdownRenderer content={state.prdOutput} />
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                        <div className="relative mb-6">
                           <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full"></div>
                           <Brain className="relative z-10 w-20 h-20 text-orange-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Ready to Architect</h3>
                        <p className="text-center max-w-md leading-relaxed">
                          Click Generate to transform your vision into a professional requirements document.
                        </p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Bottom Nav */}
              {state.prdOutput && (
                <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end no-print">
                  <button
                    onClick={() => navigate('/realization')}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-white text-slate-900 font-bold hover:bg-slate-200 transition-colors"
                  >
                    Proceed to Realization <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </PageBackground>
  );
};


const RealizationPage = () => {
  const { state, generateArtifact } = useProject();
  const [activeTab, setActiveTab] = useState<'master' | 'stitch' | 'opal'>('master');
  
  const getParsedRoadmap = () => {
    if (!state.roadmapOutput) return null;
    try {
      const jsonStr = state.roadmapOutput.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse roadmap JSON", e);
      return null;
    }
  };

  const roadmapPhases = getParsedRoadmap();

  const getPromptContent = () => {
    if (!state.codePrompts) return "Generate the roadmap to unlock execution prompts.";
    if (activeTab === 'master') return state.codePrompts.antigravity;
    if (activeTab === 'stitch') return state.codePrompts.stitch;
    if (activeTab === 'opal') return state.codePrompts.opal;
    return "";
  };

  return (
    <PageBackground glowColor="blue">
      <div className="max-w-5xl mx-auto min-h-full flex flex-col justify-center p-6 md:p-12 animate-fade-in relative z-10 gap-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Realization & Roadmap</h2>
            <p className="text-forge-muted text-lg">Your step-by-step plan to build this vision.</p>
          </div>
          {!state.roadmapOutput && (
            <button
              onClick={() => generateArtifact(ProjectStep.PLANNING)}
              disabled={state.isGenerating || !state.prdOutput}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] flex items-center gap-2 group"
            >
              {state.isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Generating...
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

        {/* Content Area */}
        {state.isGenerating ? (
          <LoadingState type="code" message="Architecting Solution" subMessage="Generating implementation prompts and roadmap..." />
        ) : !state.roadmapOutput ? (
          /* Empty State / Promo */
          <GlassCard className="flex-1 flex flex-col justify-center items-center p-12 text-center border-dashed border-2 border-white/10 bg-white/5">
             <div className="max-w-md w-full text-left space-y-8">
                <div>
                   <h3 className="text-2xl font-bold text-white mb-4">Ready to Build?</h3>
                   <ul className="space-y-4">
                     {[
                       "Save 20+ hours of dev time",
                       "Focus on Marketing & Launch",
                       "Professional Grade Code",
                       "Guaranteed Deployment",
                     ].map((item, i) => (
                       <li key={i} className="flex items-start gap-3">
                         <div className="mt-1"><Sparkles className="w-4 h-4 text-blue-400" /></div>
                         <span className="text-slate-200">{item}</span>
                       </li>
                     ))}
                   </ul>
                </div>
                
                <div className="pt-4 border-t border-white/10">
                   <a
                     href="mailto:contact@jalanea.com?subject=Hire Vibe Code"
                     className="block w-full text-center bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.05]"
                   >
                     Hire Vibe Code →
                   </a>
                   <p className="text-center text-xs text-slate-500 mt-2">Professional AI-Native Development Agency</p>
                </div>
             </div>
          </GlassCard>
        ) : (
          /* Roadmap & Prompts Display */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Prompts */}
            <div className="lg:col-span-1 space-y-6">
              <GlassCard className="h-[600px] flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-blue-400" /> Execution Prompts
                  </h3>
                  <div className="flex bg-black/40 rounded-lg p-1">
                    {['master', 'stitch', 'opal'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 bg-black/50 rounded-lg p-4 font-mono text-xs text-slate-300 overflow-y-auto whitespace-pre-wrap border border-white/5">
                  {getPromptContent()}
                </div>
                <button
                  onClick={() => navigator.clipboard.writeText(getPromptContent())}
                  className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Copy Prompt
                </button>
              </GlassCard>
            </div>

            {/* Right: Roadmap */}
            <div className="lg:col-span-2 space-y-6">
               {roadmapPhases && roadmapPhases.phases ? (
                 <div className="space-y-6">
                   {roadmapPhases.phases.map((phase: any, i: number) => (
                     <GlassCard key={i} className="relative overflow-hidden group">
                       <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-400"></div>
                       <div className="ml-4">
                         <div className="flex items-center justify-between mb-4">
                           <h3 className="text-xl font-bold text-white">{phase.title}</h3>
                           <span className="text-blue-400 text-sm font-mono px-2 py-1 bg-blue-500/10 rounded border border-blue-500/20">{phase.duration}</span>
                         </div>
                         <ul className="space-y-2 mb-4">
                           {phase.tasks.map((task: string, j: number) => (
                             <li key={j} className="flex items-start gap-2 text-slate-300 text-sm">
                               <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-slate-500 group-hover:bg-blue-400 transition-colors"></div>
                               {task}
                             </li>
                           ))}
                         </ul>
                         <div className="flex flex-wrap gap-2">
                           {phase.deliverables && phase.deliverables.map((del: string, k: number) => (
                             <span key={k} className="text-xs text-slate-400 px-2 py-1 bg-white/5 rounded-full border border-white/5">{del}</span>
                           ))}
                         </div>
                       </div>
                     </GlassCard>
                   ))}
                 </div>
               ) : (
                 <GlassCard className="p-8 text-center text-slate-400">
                   Parsing Roadmap JSON...
                 </GlassCard>
               )}
            </div>
          </div>
        )}
      </div>
    </PageBackground>
  );
};

// --- Layout ---

const Layout = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { state, openSupport, setCurrentStep } = useProject();

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

  return (
    <div className="min-h-screen flex flex-col bg-forge-900 text-forge-text selection:bg-orange-100 selection:text-orange-900">
      <Header />

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
            <div className="bg-forge-800/50 p-4 rounded-xl border border-forge-700">
              <h4 className="font-medium text-forge-text text-sm mb-2">Pro Tip</h4>
              <p className="text-xs text-forge-muted leading-relaxed">
                Add NotebookLM exports in the Research tab to ground the model.
              </p>
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
          </div>
        </aside>

        <main className="flex-1 overflow-auto bg-forge-900 relative">
          {/* Mobile Nav Placeholder - hidden on md+ */}
          <div className="md:hidden mb-6 flex overflow-x-auto gap-2 pb-2 no-print">
            {navItems.map((item) => (
              <div key={item.path} onClick={() => window.location.hash = item.path} className={`
                   flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2
                   ${location.pathname === item.path ? 'bg-forge-accent text-white' : 'bg-white border border-forge-700 text-forge-muted'}
                `}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </div>
            ))}
          </div>

          <div className="h-full">
            <Routes>
              <Route path="/" element={<IdeaPage />} />
              <Route path="/research" element={<ResearchPage />} />
              <Route path="/prd" element={<PrdPage />} />
              <Route path="/realization" element={<RealizationPage />} />
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