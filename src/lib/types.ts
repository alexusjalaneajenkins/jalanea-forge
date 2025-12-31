export type LabStatus = 'idea' | 'building' | 'testing' | 'graduated';
export type ClientStatus = 'draft' | 'sent' | 'viewed' | 'expired';
export type DevStatus = 'development' | 'staging' | 'production';
export type ToolCategory = 'Learning' | 'Productivity' | 'Business' | 'Development' | 'Research';

// Project Categories with colors
export type ProjectCategory =
  | 'Career/Job'
  | 'Spirituality'
  | 'Finance'
  | 'Health'
  | 'Design/AI'
  | 'Marketplace';

export const categoryColors: Record<ProjectCategory, string> = {
  'Career/Job': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Spirituality': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'Finance': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Health': 'bg-red-500/20 text-red-400 border-red-500/30',
  'Design/AI': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  'Marketplace': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
};

export interface LaunchChecklist {
  ideaDocumented: boolean;
  mvpDefined: boolean;
  domainSecured: boolean;
  uiDesigned: boolean;
  coreBuilt: boolean;
  deployedStaging: boolean;
  testedMobile: boolean;
  launchedProduction: boolean;
}

export const defaultChecklist: LaunchChecklist = {
  ideaDocumented: false,
  mvpDefined: false,
  domainSecured: false,
  uiDesigned: false,
  coreBuilt: false,
  deployedStaging: false,
  testedMobile: false,
  launchedProduction: false,
};

export interface LabProject {
  id: string;
  name: string;
  description: string;
  status: LabStatus;
  category: ProjectCategory;
  url: string;
  checklist: LaunchChecklist;
  createdAt: string;
  updatedAt: string;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: ToolCategory;
  isComingSoon: boolean;
}

export interface ClientProject {
  id: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  projectDescription: string;
  subdomain: string;
  status: ClientStatus;
  password: string;
  expiresAt: string;
  createdAt: string;
  lastSentAt?: string;
}

export interface DevProject {
  id: string;
  projectName: string;
  description: string;
  branch: string;
  previewUrl: string;
  status: DevStatus;
  repoUrl: string;
  lastDeployedAt: string;
  updatedAt: string;
}

export interface Stats {
  totalProjects: number;
  activeExperiments: number;
  liveProducts: number;
  ideasInQueue: number;
}

export interface Activity {
  id: string;
  type: 'experiment' | 'client' | 'deploy' | 'tool' | 'note';
  action: string;
  target: string;
  timestamp: string;
}

// Internal Tools Data Types
export interface QuickCapture {
  id: string;
  content: string;
  createdAt: string;
}

export interface LearningItem {
  id: string;
  title: string;
  url?: string;
  type: 'article' | 'video' | 'course' | 'podcast';
  status: 'queued' | 'in-progress' | 'completed';
  notes?: string;
  createdAt: string;
  completedAt?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  proficiency: 1 | 2 | 3 | 4 | 5;
  goal?: string;
  category: string;
  updatedAt: string;
}

export interface ContentNote {
  id: string;
  title: string;
  source: string;
  sourceType: 'book' | 'podcast' | 'video' | 'article';
  notes: string;
  createdAt: string;
}

export interface ProjectIdea {
  id: string;
  title: string;
  description: string;
  excitement: 1 | 2 | 3 | 4 | 5;
  feasibility: 1 | 2 | 3 | 4 | 5;
  createdAt: string;
}

export interface CodeSnippet {
  id: string;
  title: string;
  language: string;
  code: string;
  tags: string[];
  createdAt: string;
}

export interface CompetitorEntry {
  id: string;
  projectId: string;
  name: string;
  url: string;
  notes: string;
  createdAt: string;
}

export interface TrendItem {
  id: string;
  title: string;
  category: 'tech' | 'design' | 'ai' | 'business';
  notes: string;
  createdAt: string;
}

export interface InternalToolsData {
  quickCaptures: QuickCapture[];
  learningQueue: LearningItem[];
  skills: SkillItem[];
  contentNotes: ContentNote[];
  projectIdeas: ProjectIdea[];
  codeSnippets: CodeSnippet[];
  competitors: CompetitorEntry[];
  trends: TrendItem[];
}

export interface ProjectData {
  lab: LabProject[];
  tools: Tool[];
  clients: ClientProject[];
  dev: DevProject[];
  stats: Stats;
  activity: Activity[];
  internalTools: InternalToolsData;
}
