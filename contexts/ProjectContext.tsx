import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ProjectState, ProjectStep, ResearchDocument, ProjectMetadata, PrdVersion } from '../types';
import * as GeminiService from '../services/geminiService';
import { MISSING_API_KEY_ERROR } from '../services/geminiService';
import { getProject, createProject, getUserProjects, deleteProject, updateProject, logUsage, incrementAiGenerations } from '../services/supabaseService';
import { useAuth } from './AuthContext';
import { SettingsModal } from '../components/SettingsModal';
import { SupportModal } from '../components/SupportModal';
import { ProjectListDialog } from '../components/ProjectListDialog';
import PricingModal from '../components/PricingModal';

interface ProjectContextType {
    state: ProjectState;
    addResearch: (file: File) => Promise<void>;
    updateIdea: (idea: string) => void;
    updatePrd: (prd: string, label?: string) => void;
    updateTitle: (title: string) => void;
    generateArtifact: (step: ProjectStep) => Promise<void>;
    generateResearchPrompt: () => Promise<void>;
    resetProject: () => void;
    openProjectList: () => void;
    openSettings: () => void;
    openSupport: () => void;
    openPricing: () => void;
    setCurrentStep: (step: ProjectStep) => void;
    revertToPrdVersion: (versionId: string) => void;
    currentProjectId?: string;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};

const initialState: ProjectState = {
    title: "Untitled Project",
    currentStep: ProjectStep.IDEA,
    research: [],
    ideaInput: "",
    synthesizedIdea: "",
    prdOutput: "",
    prdVersionHistory: [],
    roadmapOutput: "",
    designSystemOutput: "",
    codePromptOutput: "",
    isGenerating: false,
    completedRoadmapSteps: []
};

// Helper to create a new PRD version
const createPrdVersion = (content: string, label?: string): PrdVersion => ({
    id: Math.random().toString(36).substr(2, 9),
    content,
    timestamp: Date.now(),
    label
});

// Max versions to keep (to avoid storage bloat)
const MAX_PRD_VERSIONS = 10;

// LocalStorage key for extra project data not in DB
const getLocalStorageKey = (projectId: string) => `forge_project_extra_${projectId}`;

// Save extra project data to localStorage (fields not in DB)
const saveExtraData = (projectId: string, data: {
    prdVersionHistory?: PrdVersion[];
    researchMissionPrompt?: string;
    reportGenerationPrompt?: string;
    completedRoadmapSteps?: string[];
}) => {
    try {
        localStorage.setItem(getLocalStorageKey(projectId), JSON.stringify(data));
    } catch (e) {
        console.error('Failed to save extra project data:', e);
    }
};

// Load extra project data from localStorage
const loadExtraData = (projectId: string): {
    prdVersionHistory?: PrdVersion[];
    researchMissionPrompt?: string;
    reportGenerationPrompt?: string;
    completedRoadmapSteps?: string[];
} => {
    try {
        const data = localStorage.getItem(getLocalStorageKey(projectId));
        return data ? JSON.parse(data) : {};
    } catch (e) {
        return {};
    }
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ProjectState>(initialState);
    const [projects, setProjects] = useState<ProjectMetadata[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
    const [showProjectDialog, setShowProjectDialog] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showPricingModal, setShowPricingModal] = useState(false);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    const { user } = useAuth();

    // Helper to save current project state to Supabase
    const saveCurrentProject = (projectState: ProjectState) => {
        if (user && currentProjectId) {
            // Save to Supabase (only fields that exist in DB)
            updateProject(currentProjectId, {
                name: projectState.title,
                current_step: Object.values(ProjectStep).indexOf(projectState.currentStep) + 1,
                idea_input: projectState.ideaInput,
                vision_statement: projectState.synthesizedIdea,
                research_data: projectState.research,
                prd_content: projectState.prdOutput,
                realization_tasks: projectState.roadmapOutput,
            });

            // Save extra data to localStorage
            saveExtraData(currentProjectId, {
                prdVersionHistory: projectState.prdVersionHistory,
                researchMissionPrompt: projectState.researchMissionPrompt,
                reportGenerationPrompt: projectState.reportGenerationPrompt,
                completedRoadmapSteps: projectState.completedRoadmapSteps,
            });

            // Update the list metadata immediately for title changes
            setProjects(prev => prev.map(p =>
                p.id === currentProjectId ? { ...p, title: projectState.title, updatedAt: Date.now() } : p
            ));
        }
    };

    // Load project list on login
    useEffect(() => {
        if (user) {
            setIsLoadingProjects(true);
            getUserProjects(user.id).then(list => {
                // Transform Supabase projects to ProjectMetadata format
                const projectList: ProjectMetadata[] = list.map(p => ({
                    id: p.id,
                    title: p.name, // Database uses 'name' field
                    updatedAt: new Date(p.updated_at).getTime()
                }));
                setProjects(projectList);
                setIsLoadingProjects(false);

                if (projectList.length > 0) {
                    const mostRecent = projectList[0];
                    loadProjectDetails(mostRecent.id);
                } else {
                    createNewProject();
                }
            });
        } else {
            setState(initialState);
            setProjects([]);
            setCurrentProjectId(undefined);
        }
    }, [user]);

    const loadProjectDetails = async (projectId: string) => {
        if (!user) return;
        setIsLoadingProjects(true);
        const project = await getProject(projectId);
        if (project) {
            // Load extra data from localStorage
            const extraData = loadExtraData(projectId);

            // Transform Supabase project to ProjectState format
            const steps = Object.values(ProjectStep);
            const stepIndex = Math.max(0, Math.min((project.current_step || 1) - 1, steps.length - 1));
            const projectState: ProjectState = {
                title: project.name, // Database uses 'name' field
                currentStep: steps[stepIndex],
                research: project.research_data || [],
                ideaInput: project.idea_input || '',
                synthesizedIdea: project.vision_statement || '', // Database uses 'vision_statement'
                prdOutput: project.prd_content || '',
                prdVersionHistory: extraData.prdVersionHistory || [],
                roadmapOutput: project.realization_tasks || '', // Database uses 'realization_tasks'
                designSystemOutput: '',
                codePromptOutput: '',
                researchMissionPrompt: extraData.researchMissionPrompt || '',
                reportGenerationPrompt: extraData.reportGenerationPrompt || '',
                isGenerating: false,
                completedRoadmapSteps: extraData.completedRoadmapSteps || []
            };
            setState(projectState);
            setCurrentProjectId(projectId);
            setShowProjectDialog(false);
        }
        setIsLoadingProjects(false);
    };

    const createNewProject = async (title?: string) => {
        if (!user) return;
        try {
            setIsLoadingProjects(true);
            const projectTitle = title || "New Project " + (projects.length + 1);
            const newProject = await createProject(user.id, projectTitle);

            if (newProject) {
                // Update list
                const list = await getUserProjects(user.id);
                const projectList: ProjectMetadata[] = list.map(p => ({
                    id: p.id,
                    title: p.name, // Database uses 'name' field
                    updatedAt: new Date(p.updated_at).getTime()
                }));
                setProjects(projectList);

                // Set current
                setCurrentProjectId(newProject.id);
                setState({ ...initialState, title: projectTitle });
                setShowProjectDialog(false);
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to create project");
        } finally {
            setIsLoadingProjects(false);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!user) return;
        if (!confirm("Are you sure you want to delete this project?")) return;

        await deleteProject(projectId);

        // Clean up localStorage
        localStorage.removeItem(getLocalStorageKey(projectId));

        const list = await getUserProjects(user.id);
        const projectList: ProjectMetadata[] = list.map(p => ({
            id: p.id,
            title: p.name, // Database uses 'name' field
            updatedAt: new Date(p.updated_at).getTime()
        }));
        setProjects(projectList);

        if (currentProjectId === projectId) {
            if (projectList.length > 0) {
                loadProjectDetails(projectList[0].id);
            } else {
                createNewProject();
            }
        }
    };

    // Save project on state change (debounced manually via effect)
    useEffect(() => {
        if (user && currentProjectId) {
            const timeoutId = setTimeout(() => {
                saveCurrentProject(state);
            }, 2000); // Auto-save every 2s of inactivity
            return () => clearTimeout(timeoutId);
        }
    }, [state, user, currentProjectId]);

    const addResearch = async (file: File) => {
        let content = "";
        let mimeType = file.type;

        if (file.type === 'application/pdf') {
            // Read as Base64 for PDF
            content = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result) {
                        const result = e.target.result as string;
                        // Remove "data:application/pdf;base64," prefix
                        resolve(result.split(',')[1]);
                    } else {
                        console.error("Failed to read file", e);
                        reject(new Error("Failed to read file"));
                    }
                };
                reader.readAsDataURL(file);
            });
        } else {
            // Default to text for everything else (txt, md, json)
            content = await file.text();
            if (!mimeType) mimeType = 'text/plain';
        }

        const newDoc: ResearchDocument = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            content: content,
            mimeType: mimeType,
            source: 'upload'
        };
        setState(prev => ({ ...prev, research: [...prev.research, newDoc] }));
    };

    const updateIdea = (idea: string) => {
        setState(prev => ({ ...prev, ideaInput: idea }));
    };

    const updatePrd = (prd: string, label?: string) => {
        setState(prev => {
            // Only save version if content actually changed
            if (prd === prev.prdOutput) {
                return prev;
            }

            // Save current PRD to history before updating (if it exists)
            let newHistory = prev.prdVersionHistory || [];
            if (prev.prdOutput && prev.prdOutput.trim()) {
                // Don't duplicate if last version has same content
                const lastVersion = newHistory[newHistory.length - 1];
                if (!lastVersion || lastVersion.content !== prev.prdOutput) {
                    const versionLabel = label || 'Manual Edit';
                    newHistory = [...newHistory, createPrdVersion(prev.prdOutput, versionLabel)];
                    // Keep only last MAX_PRD_VERSIONS
                    if (newHistory.length > MAX_PRD_VERSIONS) {
                        newHistory = newHistory.slice(-MAX_PRD_VERSIONS);
                    }
                }
            }

            const newState = {
                ...prev,
                prdOutput: prd,
                prdVersionHistory: newHistory
            };
            saveCurrentProject(newState);
            return newState;
        });
    };

    const revertToPrdVersion = (versionId: string) => {
        setState(prev => {
            const version = prev.prdVersionHistory?.find(v => v.id === versionId);
            if (!version) return prev;

            // Save current PRD to history before reverting
            let newHistory = prev.prdVersionHistory || [];
            if (prev.prdOutput && prev.prdOutput.trim()) {
                newHistory = [...newHistory, createPrdVersion(prev.prdOutput, 'Before Revert')];
                if (newHistory.length > MAX_PRD_VERSIONS) {
                    newHistory = newHistory.slice(-MAX_PRD_VERSIONS);
                }
            }

            const newState = {
                ...prev,
                prdOutput: version.content,
                prdVersionHistory: newHistory
            };
            saveCurrentProject(newState);
            return newState;
        });
    };

    const updateTitle = (title: string) => {
        setState(prev => ({ ...prev, title }));
    };

    const setCurrentStep = (step: ProjectStep) => {
        setState(prev => {
            const newState = { ...prev, currentStep: step };
            saveCurrentProject(newState);
            return newState;
        });
    };

    const generateArtifact = async (step: ProjectStep) => {
        setState(prev => ({ ...prev, isGenerating: true }));
        try {
            if (step === ProjectStep.IDEA) {
                // Synthesize Idea Step
                const result = await GeminiService.refineIdea(state.ideaInput);
                setState(prev => ({ ...prev, synthesizedIdea: result }));

                // Log usage
                if (user) {
                    logUsage(user.id, 'vision_generation');
                    incrementAiGenerations(user.id);
                }

                // Auto-generate Research Prompts for NotebookLM immediately
                const { mission, report } = await GeminiService.generateResearchPrompt(result);
                setState(prev => ({
                    ...prev,
                    researchMissionPrompt: mission,
                    reportGenerationPrompt: report
                }));

                // Log usage for research prompt
                if (user) {
                    logUsage(user.id, 'research_prompt_generation');
                    incrementAiGenerations(user.id);
                }
            } else if (step === ProjectStep.PRD) {
                // Use synthesized idea if available, otherwise raw
                const inputIdea = state.synthesizedIdea || state.ideaInput;
                const result = await GeminiService.generatePRD(inputIdea, state.research);

                // Log usage
                if (user) {
                    logUsage(user.id, 'prd_generation');
                    incrementAiGenerations(user.id);
                }

                // Save current PRD to version history before updating
                setState(prev => {
                    let newHistory = prev.prdVersionHistory || [];
                    if (prev.prdOutput && prev.prdOutput.trim()) {
                        newHistory = [...newHistory, createPrdVersion(prev.prdOutput, 'Before AI Generation')];
                        if (newHistory.length > MAX_PRD_VERSIONS) {
                            newHistory = newHistory.slice(-MAX_PRD_VERSIONS);
                        }
                    }
                    return { ...prev, prdOutput: result, prdVersionHistory: newHistory };
                });
            } else if (step === ProjectStep.CODE) {
                // Realization Flow: Generate Roadmap (Plan) which includes DIY Prompts
                // Use synthesized idea if available, otherwise raw
                const inputIdea = state.synthesizedIdea || state.ideaInput;

                // Ensure PRD exists
                if (!state.prdOutput) {
                    const prdResult = await GeminiService.generatePRD(inputIdea, state.research);
                    setState(prev => ({ ...prev, prdOutput: prdResult }));

                    // Log usage
                    if (user) {
                        logUsage(user.id, 'prd_generation');
                        incrementAiGenerations(user.id);
                    }
                }

                // Generate Roadmap (which returns JSON with DIY prompts)
                const result = await GeminiService.generatePlan(state.prdOutput || "");
                setState(prev => ({ ...prev, roadmapOutput: result }));

                // Log usage
                if (user) {
                    logUsage(user.id, 'task_generation');
                    incrementAiGenerations(user.id);
                }
            }
        } catch (error: any) {
            console.error("Generation failed:", error);
            if (error.message === MISSING_API_KEY_ERROR) {
                setShowSettings(true);
            } else {
                const errorMessage = error.message || "Unknown error";
                alert(`Failed to generate content: ${errorMessage}\n\nPlease check the console for more details.`);
            }
        } finally {
            setState(prev => ({ ...prev, isGenerating: false }));
        }
    };

    const generateResearchPrompt = async () => {
        setState(prev => ({ ...prev, isGenerating: true }));
        try {
            const { mission, report } = await GeminiService.generateResearchPrompt(state.synthesizedIdea);
            setState(prev => ({
                ...prev,
                researchMissionPrompt: mission,
                reportGenerationPrompt: report
            }));

            // Log usage
            if (user) {
                logUsage(user.id, 'research_prompt_generation');
                incrementAiGenerations(user.id);
            }
        } catch (error: any) {
            console.error("Research prompt generation failed:", error);
            if (error.message === MISSING_API_KEY_ERROR) {
                setShowSettings(true);
            } else {
                const errorMessage = error.message || "Unknown error";
                alert(`Failed to generate research prompt: ${errorMessage}`);
            }
        } finally {
            setState(prev => ({ ...prev, isGenerating: false }));
        }
    };

    const resetProject = () => {
        if (confirm("Resetting this project will clear all data. This cannot be undone.")) {
            // Just reset state content, but keep ID
            const resetState = { ...initialState, title: state.title };
            setState(resetState);
            saveCurrentProject(resetState); // Save the reset state
        }
    };

    const toggleStepCompletion = (stepId: string) => {
        setState(prev => {
            const current = prev.completedRoadmapSteps || [];
            const updated = current.includes(stepId)
                ? current.filter(id => id !== stepId)
                : [...current, stepId];

            const newState = { ...prev, completedRoadmapSteps: updated };
            saveCurrentProject(newState);
            return newState;
        });
    };

    return (
        <ProjectContext.Provider value={{
            state,
            addResearch,
            updateIdea,
            updatePrd,
            updateTitle,
            generateArtifact,
            generateResearchPrompt,
            resetProject,
            openProjectList: () => setShowProjectDialog(true),
            openSettings: () => setShowSettings(true),
            openSupport: () => setShowSupportModal(true),
            openPricing: () => setShowPricingModal(true),
            setCurrentStep,
            revertToPrdVersion,
            currentProjectId,
            toggleStepCompletion
        }}>
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
            <SupportModal
                isOpen={showSupportModal}
                onClose={() => setShowSupportModal(false)}
            />
            <PricingModal
                isOpen={showPricingModal}
                onClose={() => setShowPricingModal(false)}
            />
            <ProjectListDialog
                isOpen={showProjectDialog}
                onClose={() => setShowProjectDialog(false)}
                projects={projects}
                onSelect={loadProjectDetails}
                onCreate={createNewProject}
                onDelete={handleDeleteProject}
                isLoading={isLoadingProjects}
                currentProjectId={currentProjectId}
            />
            {children}
        </ProjectContext.Provider>
    );
};
