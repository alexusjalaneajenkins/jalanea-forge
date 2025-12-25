import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { ProjectState, ProjectStep, ResearchDocument, ProjectMetadata } from '../types';
import * as GeminiService from '../services/geminiService';
import { MISSING_API_KEY_ERROR } from '../services/geminiService';
import { saveProject, loadProject, createProject, getUserProjects, deleteProject } from '../services/firebase';
import { useAuth } from './AuthContext';
import { SettingsModal } from '../components/SettingsModal';
import { SupportModal } from '../components/SupportModal';
import { ProjectListDialog } from '../components/ProjectListDialog';

interface ProjectContextType {
    state: ProjectState;
    addResearch: (file: File) => Promise<void>;
    updateIdea: (idea: string) => void;
    updateTitle: (title: string) => void;
    generateArtifact: (step: ProjectStep) => Promise<void>;
    generateResearchPrompt: () => Promise<void>;
    resetProject: () => void;
    openProjectList: () => void;
    openSettings: () => void;
    openSupport: () => void;
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
    roadmapOutput: "",
    designSystemOutput: "",
    codePromptOutput: "",
    isGenerating: false
};

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<ProjectState>(initialState);
    const [projects, setProjects] = useState<ProjectMetadata[]>([]);
    const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
    const [showProjectDialog, setShowProjectDialog] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [isLoadingProjects, setIsLoadingProjects] = useState(false);

    const { user } = useAuth();

    // Load project list on login
    useEffect(() => {
        if (user) {
            setIsLoadingProjects(true);
            getUserProjects(user.uid).then(list => {
                setProjects(list);
                setIsLoadingProjects(false);

                if (list.length > 0) {
                    const mostRecent = list[0];
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
        const data = await loadProject(user.uid, projectId);
        if (data) {
            setState({ ...data, id: projectId });
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
            const newProject: ProjectState = { ...initialState, title: projectTitle };
            const newId = await createProject(user.uid, newProject);

            // Update list
            const list = await getUserProjects(user.uid);
            setProjects(list);

            // Set current
            setCurrentProjectId(newId);
            setState({ ...newProject, id: newId });
            setShowProjectDialog(false);
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to create project");
        } finally {
            setIsLoadingProjects(false);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!user) return;
        if (!confirm("Are you sure you want to delete this project?")) return;

        await deleteProject(user.uid, projectId);
        const list = await getUserProjects(user.uid);
        setProjects(list);

        if (currentProjectId === projectId) {
            if (list.length > 0) {
                loadProjectDetails(list[0].id);
            } else {
                createNewProject();
            }
        }
    };

    // Save project on state change (debounced manually via effect)
    useEffect(() => {
        if (user && currentProjectId) {
            const timeoutId = setTimeout(() => {
                saveProject(user.uid, currentProjectId, state);

                // Update the list metadata if title changed
                setProjects(prev => prev.map(p =>
                    p.id === currentProjectId ? { ...p, title: state.title, updatedAt: Date.now() } : p
                ));
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

    const updateTitle = (title: string) => {
        setState(prev => ({ ...prev, title }));
    };

    const generateArtifact = async (step: ProjectStep) => {
        setState(prev => ({ ...prev, isGenerating: true }));
        try {
            if (step === ProjectStep.IDEA) {
                // Synthesize Idea Step
                const result = await GeminiService.refineIdea(state.ideaInput);
                setState(prev => ({ ...prev, synthesizedIdea: result }));
            } else if (step === ProjectStep.PRD) {
                // Use synthesized idea if available, otherwise raw
                const inputIdea = state.synthesizedIdea || state.ideaInput;
                const result = await GeminiService.generatePRD(inputIdea, state.research);
                setState(prev => ({ ...prev, prdOutput: result }));
            } else if (step === ProjectStep.PLANNING) {
                const result = await GeminiService.generatePlan(state.prdOutput);
                setState(prev => ({ ...prev, roadmapOutput: result }));
            } else if (step === ProjectStep.DESIGN) {
                const result = await GeminiService.generateDesignPrompts(state.prdOutput, state.roadmapOutput);
                setState(prev => ({
                    ...prev,
                    stitchPrompt: result.stitch,
                    opalPrompt: result.opal,
                    // Deprecate legacy designSystemOutput or reuse it if needed, but for now we focus on the prompts
                    designSystemOutput: result.stitch + "\n\n" + result.opal
                }));
            } else if (step === ProjectStep.CODE) {
                const result = await GeminiService.generateCodePrompt(state);
                setState(prev => ({ ...prev, antigravityPrompt: result, codePromptOutput: result }));
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
        }
    };

    return (
        <ProjectContext.Provider value={{
            state,
            addResearch,
            updateIdea,
            updateTitle,
            generateArtifact,
            generateResearchPrompt,
            resetProject,
            openProjectList: () => setShowProjectDialog(true),
            openSettings: () => setShowSettings(true),
            openSupport: () => setShowSupportModal(true),
            currentProjectId
        }}>
            <SettingsModal
                isOpen={showSettings}
                onClose={() => setShowSettings(false)}
            />
            <SupportModal
                isOpen={showSupportModal}
                onClose={() => setShowSupportModal(false)}
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
