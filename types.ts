import React from 'react';

  IDEA = 'IDEA',
  RESEARCH = 'RESEARCH',
  PRD = 'PRD',
  CODE = 'CODE' // Renaming 'PLANNING' to 'CODE' or just keeping 'PLANNING' as the final step. The user wants 'Realization' to be the final step. In App.tsx layout, 'Realization' maps to ProjectStep.CODE. Let's map 'Realization' to 'PLANNING' conceptually or just keep 'CODE' as the enum value for step 4.
}

export interface ResearchDocument {
  id: string;
  name: string;
  content: string; // Text content or Base64 string for binaries
  mimeType: string; // e.g., 'text/plain', 'application/pdf'
  source: 'upload' | 'manual';
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
  diyPrompt?: string;
  hirePitch?: string;
}

export interface RoadmapPhase {
  phaseName: string;
  description: string;
  steps: RoadmapStep[];
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