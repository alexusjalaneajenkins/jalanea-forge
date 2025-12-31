import React from 'react';

export enum ProjectStep {
  IDEA = 'IDEA',
  RESEARCH = 'RESEARCH',
  PRD = 'PRD',
  CODE = 'CODE'
}

export interface ResearchDocument {
  id: string;
  name: string;
  content: string; // Text content or Base64 string for binaries
  mimeType: string; // e.g., 'text/plain', 'application/pdf'
  source: 'upload' | 'manual';
}

export interface PrdVersion {
  id: string;
  content: string;
  timestamp: number;
  label?: string; // Optional label like "AI Generated", "Manual Edit", "AI Refined"
}

export interface ProjectState {
  id?: string;
  updatedAt?: number;
  title: string;
  currentStep: ProjectStep;
  research: ResearchDocument[];
  ideaInput: string;
  synthesizedIdea: string;
  prdOutput: string;
  prdVersionHistory?: PrdVersion[]; // Version history for PRD
  roadmapOutput: string;
  designSystemOutput: string;
  codePromptOutput: string;
  researchMissionPrompt?: string; // For Deep Research Agent
  reportGenerationPrompt?: string; // For Standard Chat Analysis
  stitchPrompt?: string; // For Stitch (Frontend)
  opalPrompt?: string; // For Opal (Backend)
  antigravityPrompt?: string; // For Antigravity (Integration)
  bugReportPrompt?: string;
  isGenerating: boolean;
  completedRoadmapSteps: string[]; // Track completed step IDs (phase-step index)
}

export interface ProjectMetadata {
  id: string;
  title: string;
  updatedAt: number;
}

export interface RoadmapStep {
  stepName: string;
  description: string;
  technicalBrief: string;
  diyPrompt?: string; // This is the 'User Prompt'
  systemPrompt?: string; // This is the 'System Instructions' for AI Studio
  hirePitch?: string;
}

export interface RoadmapPhase {
  phaseName: string;
  description: string;
  steps: RoadmapStep[];
}

// Enhanced Realization Engine Types
export type TaskCategory = 'component' | 'page' | 'api' | 'service' | 'schema' | 'migration' | 'config' | 'deployment';
export type TaskComplexity = 1 | 2 | 3; // 1=easy, 2=medium, 3=hard
export type BuildPath = 'diy' | 'hire' | null;
export type RealizationPhaseName = 'Frontend' | 'Backend' | 'Database' | 'Integration';

export interface RealizationTask {
  taskId: string;
  taskName: string;
  category: TaskCategory;
  estimatedMinutes: number;
  complexity: TaskComplexity;
  description: string;
  systemInstruction: string;  // Goes in System Instructions panel
  userPrompt: string;         // Goes in the chat input
  hirePitch: string;          // Why this task benefits from expert help
  deliverables: string[];     // What they'd get if hiring
}

export interface RealizationPhase {
  phaseId: number;
  phaseName: RealizationPhaseName;
  phaseIcon: string; // emoji
  description: string;
  tasks: RealizationTask[];
}

export interface GenerationRequest {
  model: string;
  systemInstruction: string;
  prompt: string;
}

export interface NavItem {
  label: string;
  step: ProjectStep;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}