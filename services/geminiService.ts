import { ProjectState, ResearchDocument } from "../types";

export const MISSING_API_KEY_ERROR = "MISSING_API_KEY";

// API route base URL - works both locally and on Vercel
const getApiUrl = () => {
  // In production, use relative URL (same domain)
  // In development, Vite dev server will proxy to Vercel dev
  return '/api/gemini';
};

// Test if an API key is valid by making a minimal request
export const testApiKey = async (apiKey: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(getApiUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'testKey',
        testApiKey: apiKey
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || 'Failed to test API key' };
    }

    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message || 'Network error' };
  }
};

// Helper to call the Gemini API proxy
const callGeminiApi = async (
  contents: any,
  config?: {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
  },
  model: string = 'gemini-3-flash-preview'
): Promise<string> => {
  const response = await fetch(getApiUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      contents,
      config
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate content');
  }

  const data = await response.json();
  return data.text || '';
};

const formatResearchContext = (docs: ResearchDocument[]): string => {
  if (docs.length === 0) return "No specific research documents provided.";
  return docs
    .filter(d => d.mimeType.startsWith('text'))
    .map(d => `--- SOURCE: ${d.name} ---\n${d.content}\n--- END SOURCE ---`)
    .join("\n\n");
};

export const refineIdea = async (rawInput: string): Promise<string> => {
  const prompt = `
    Analyze the following raw product idea and synthesize it into a clear, professional Product Vision Statement.

    RAW IDEA:
    ${rawInput}

    TASK:
    Create a structured Vision Statement including:
    1. Product Name Suggestion
    2. Core Value Proposition (The "Why")
    3. Target Users (The "Who")
    4. Key Differentiators (The "How")
    5. Elevator Pitch (One concise sentence)

    Output in Markdown. Keep it professional and inspiring.
  `;

  const text = await callGeminiApi(
    prompt,
    {
      systemInstruction: "You are a Chief Product Officer. Your goal is to clarify and elevate raw ideas into actionable product visions.",
      temperature: 0.7,
    }
  );

  return text || "Failed to refine idea.";
};

export const generateResearchPrompt = async (synthesizedIdea: string): Promise<{ mission: string, report: string }> => {
  // 1. Generate the "Deep Research Mission" (The instruction for the Agent)
  const missionPrompt = `
    Based on the following Product Vision, generate a specific, high-level "Deep Research Mission" prompt for an autonomous AI research agent (like Google NotebookLM Deep Research).

    The mission should instruct the agent to:
    1. Find direct and indirect competitors.
    2. Uncover recent trends in the specific market.
    3. Identify user demographics and pain points.
    4. Look for technical feasibility and similar existing implementations.

    Keep the mission prompt concise (under 3 sentences) but directive. Start with "Your mission is to..."
    refer explicitly to the product concept described below. Do NOT invent a fake company name (like "VentureSpark") unless the vision explicitly names one. Use "this product" or "the proposed solution" instead.

    Product Vision:
    ${synthesizedIdea}
  `;

  const mission = (await callGeminiApi(missionPrompt, { temperature: 0.7 })).trim();

  // 2. Construct the "Report Generation Prompt" (The template for the Chat)
  const report = `Please generate a detailed research report addressing the following sections:

**1. Competitor Analysis:**
Identify and analyze 3-5 direct and indirect competitors. For each competitor, describe their primary offerings, target audience, key strengths, and weaknesses. Specifically, evaluate how well they currently address (or fail to address) the needs that this product aims to solve.

**2. User Pain Point Deep Dive:**
Conduct a detailed deep dive into the specific, acute pain points experienced by the target users identified in the vision. What are their most significant frustrations? Elaborate on how existing solutions might fall short, creating a market opportunity.

**3. Technical Feasibility Check:**
Assess the technical feasibility of the product's "Key Differentiators." Discuss:
    *   **Current Technological Landscape:** Are the necessary technologies (AI models, APIs, data sources) readily available?
    *   **Potential Technical Challenges:** What are the significant hurdles (e.g., accuracy, privacy, latency)?
    *   **Existing Solutions:** Are there precedents that demonstrate feasibility?

**4. Strategic Opportunities & Market Gaps:**
Identify strategic opportunities or underserved gaps in the market that this product could uniquely leverage. Consider emerging trends, unmet needs, and potential for new business models.`;

  return { mission, report };
};

export const generatePRD = async (idea: string, research: ResearchDocument[]): Promise<string> => {
  // Construct the Parts array for Multimodal Input
  const parts: any[] = [];

  // 1. Instructions & Idea
  parts.push({
    text: `
    Analyze the following product vision and the provided research documents (if any).

    PRODUCT VISION:
    ${idea}

    TASK:
    Create a comprehensive Product Requirements Document (PRD).
    The Output must be formatted in Markdown.
    Include:
    1. Executive Summary
    2. Problem Statement
    3. Target Audience (User Personas)
    4. Key Features (Functional Requirements)
    5. Success Metrics (KPIs)
    6. Risks & Mitigation
    `
  });

  // 2. Add Research Documents
  research.forEach(doc => {
    if (doc.mimeType === 'application/pdf') {
      // PDF handling: Send as inlineData
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: doc.content // Base64 string
        }
      });
    } else {
      // Text handling: Send as text part
      parts.push({
        text: `--- RESEARCH DOCUMENT: ${doc.name} ---\n${doc.content}\n--- END DOCUMENT ---`
      });
    }
  });

  const text = await callGeminiApi(
    { parts },
    {
      systemInstruction: `You are a world-class Product Manager. You are strict, detailed, and focus on viability and user value. Current Date: ${new Date().toLocaleDateString()}`,
      temperature: 0.7,
    }
  );

  return text || "Failed to generate PRD.";
};

export const generatePlan = async (prd: string): Promise<string> => {
  const prompt = `
    Based on the following PRD, create a developer-focused Implementation Roadmap.

    PRD CONTENT:
    ${prd}

    TASK:
    Create a 4-phase development roadmap:
    - Phase 1: Frontend (UI components, pages, styling, responsive design)
    - Phase 2: Backend (API routes, authentication, business logic, services)
    - Phase 3: Database (Schema design, migrations, models, relationships)
    - Phase 4: Integration (Connecting layers, deployment config, environment setup)

    CRITICAL OUTPUT FORMAT:
    Output a strictly valid JSON array. No markdown code blocks.

    Each phase object must have:
    - "phaseId": number (1-4)
    - "phaseName": "Frontend" | "Backend" | "Database" | "Integration"
    - "phaseIcon": string (emoji: "🎨" for Frontend, "⚙️" for Backend, "🗄️" for Database, "🔗" for Integration)
    - "description": string (Summary of this phase's goals)
    - "tasks": array of task objects

    Each task object must have:
    - "taskId": string (unique, e.g., "fe-1", "be-2", "db-3", "int-4")
    - "taskName": string (e.g., "Create Navigation Component")
    - "category": "component" | "page" | "api" | "service" | "schema" | "migration" | "config" | "deployment"
    - "estimatedMinutes": number (realistic estimate: 15, 30, 45, 60, 90, 120, etc.)
    - "complexity": 1 | 2 | 3 (1=easy, 2=medium, 3=hard)
    - "description": string (What this task accomplishes)
    - "systemInstruction": string (Google AI Studio System Instructions - see format below)
    - "userPrompt": string (Google AI Studio User Prompt - see format below)
    - "hirePitch": string (Why hiring an expert helps for this task)
    - "deliverables": array of strings (What they'd get if hiring, e.g., ["Production-ready component", "Unit tests", "Storybook docs"])

    SYSTEM INSTRUCTION FORMAT (for systemInstruction field):
    "<role>
You are an expert [Frontend/Backend/Database] developer specializing in [tech from PRD].
You write clean, production-ready code following modern best practices.
</role>

<project_context>
Project: [Project Name from PRD]
Tech Stack: [Extract tech stack from PRD]
</project_context>

<constraints>
- Use TypeScript with strict mode
- Follow framework conventions
- Include error handling and loading states
- Write accessible HTML (ARIA labels, semantic elements)
- Mobile-first responsive design
</constraints>

<output_format>
1. **File Path**: Where this code should be saved
2. **Code**: Complete, runnable code block
3. **Dependencies**: Any packages to install
4. **Usage**: How to use/import this
</output_format>"

    USER PROMPT FORMAT (for userPrompt field):
    "<task>
[Specific task description]
</task>

<requirements>
[List of requirements from PRD for this specific component/feature]
</requirements>

<specifications>
[Technical specs like props, inputs, API shape, schema fields]
</specifications>"

    EXAMPLE OUTPUT:
    [
      {
        "phaseId": 1,
        "phaseName": "Frontend",
        "phaseIcon": "🎨",
        "description": "Build the user interface components and pages",
        "tasks": [
          {
            "taskId": "fe-1",
            "taskName": "Create Navigation Component",
            "category": "component",
            "estimatedMinutes": 45,
            "complexity": 1,
            "description": "Build a responsive navigation bar with logo, links, and mobile menu",
            "systemInstruction": "<role>\\nYou are an expert Frontend developer specializing in React and Tailwind CSS.\\n</role>\\n\\n<project_context>\\nProject: TaskFlow\\nTech Stack: React, TypeScript, Tailwind CSS\\n</project_context>\\n\\n<constraints>\\n- Use TypeScript with strict mode\\n- Mobile-first responsive design\\n</constraints>\\n\\n<output_format>\\n1. **File Path**: src/components/Navigation.tsx\\n2. **Code**: Complete component\\n3. **Dependencies**: None additional\\n4. **Usage**: Import in layout\\n</output_format>",
            "userPrompt": "<task>\\nCreate a responsive navigation component\\n</task>\\n\\n<requirements>\\n- Logo on left\\n- Navigation links: Home, Features, Pricing\\n- Mobile hamburger menu\\n</requirements>\\n\\n<specifications>\\n- Props: none (uses router for active state)\\n- Breakpoint: md (768px) for mobile/desktop\\n</specifications>",
            "hirePitch": "A polished navigation sets the tone for your entire app. An expert ensures pixel-perfect responsive behavior.",
            "deliverables": ["Responsive Nav component", "Mobile drawer menu", "Active link styling"]
          }
        ]
      }
    ]

    Generate 3-6 tasks per phase based on the PRD complexity. Be specific to the actual project requirements.
  `;

  const text = await callGeminiApi(
    prompt,
    {
      systemInstruction: "You are a Senior Technical Architect. You create detailed, actionable development roadmaps that help developers build products efficiently. You advocate for the 'Hybrid' approach: DIY for learning, hire experts for high-risk areas. Return raw JSON only.",
    }
  );

  // Clean markdown if present
  return (text || "[]").replace(/```json/g, '').replace(/```/g, '').trim();
};

export const refineBugReport = async (error: string, context: string): Promise<{ subject: string, body: string }> => {
  const prompt = `
    Analyze the following error report from a user building an AI app.

    PROJECT CONTEXT:
    ${context}

    USER ERROR LOG / FEEDBACK:
    ${error}

    TASK:
    Create a professional email bug report that the user can send to the developer (Me).
    1. "subject": A concise subject line (e.g., "Bug Report: Firebase Config Error").
    2. "body": A clear email body explaining the issue, potential causes, and suggested solutions based on the error.

    OUTPUT FORMAT:
    Strict valid JSON: { "subject": "...", "body": "..." }
  `;

  const text = await callGeminiApi(
    prompt,
    {
      systemInstruction: "You are a Senior Support Engineer. Translate user errors into actionable technical bug reports. Return raw JSON."
    }
  );

  const cleaned = (text || "{}").replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return { subject: "Error Report", body: error };
  }
};

export const refinePrd = async (currentPrd: string, instructions: string): Promise<string> => {
  const prompt = `
      You are an expert Product Manager.

      CURRENT PRD:
      ${currentPrd}

      USER REFINEMENT INSTRUCTIONS:
      ${instructions}

      TASK:
      Rewrite the PRD to incorporate the user's instructions.
      Maintain the original structure/markdown format unless asked to change it.
      Ensure the tone remains professional and the requirements are clear.
      Return the FULL updated PRD.
    `;

  const text = await callGeminiApi(
    prompt,
    {
      systemInstruction: "You are an AI Product Editor. Your goal is to refine the PRD exactly as requested while maintaining structural integrity.",
      temperature: 0.7
    }
  );

  return text || currentPrd;
};

export const generateDesignPrompts = async (prd: string, plan: string): Promise<{ stitch: string, opal: string }> => {
  // 1. Generate Stitch (Frontend/Visual) Prompt
  const stitchPrompt = `
    Based on the following PRD and Roadmap, create a detailed prompt for "Stitch", a frontend generation tool.

    PRD CONTEXT: ${prd.substring(0, 1500)}...

    TASK:
    Write a prompt that instructs Stitch to:
    1. Define the Visual Identity (Color Palette, Typography, Vibe).
    2. Create the Component Library (Buttons, Cards, Inputs).
    3. Generate the Page Layouts (Home, Dashboard, Settings).
    4. Focus on modern, premium aesthetics (Glassmorphism/Neo-brutalism/Clean).

    Output ONLY the raw prompt text for Stitch.
  `;

  // 2. Generate Opal (Backend/Logic) Prompt
  const opalPrompt = `
    Based on the following PRD and Roadmap, create a detailed prompt for "Opal", a backend logic generation tool.

    PRD CONTEXT: ${prd.substring(0, 1500)}...

    TASK:
    Write a prompt that instructs Opal to:
    1. Define the Data Schema (Users, Projects, Items).
    2. Outline the API Endpoints (REST/GraphQL).
    3. Describe the Business Logic flows (Authentication, Data Processing).
    4. Ensure security and scalability.

    Output ONLY the raw prompt text for Opal.
  `;

  const [stitchRes, opalRes] = await Promise.all([
    callGeminiApi(stitchPrompt, { temperature: 0.7 }),
    callGeminiApi(opalPrompt, { temperature: 0.7 })
  ]);

  return {
    stitch: stitchRes || "Failed to generate Stitch prompt.",
    opal: opalRes || "Failed to generate Opal prompt."
  };
};

export const generateCodePrompt = async (projectState: ProjectState): Promise<string> => {
  const prompt = `
    ACT AS: Lead Software Engineer & Integrator.

    CONTEXT:
    We are building a web application using the Stitch (Frontend) and Opal (Backend) workflow.

    PROJECT IDEA:
    ${projectState.synthesizedIdea || projectState.ideaInput}

    FRONTEND (Stitch) DIRECTION:
    ${projectState.stitchPrompt}

    BACKEND (Opal) DIRECTION:
    ${projectState.opalPrompt}

    ROADMAP (JSON):
    ${projectState.roadmapOutput}

    TASK:
    Write a master "Integration Prompt" that the user can copy and paste into Google Gemini (or their IDE) to start building the application.
    This prompt must:
    1. Instruct how to scaffold the project (Vite + React + TS + Tailwind).
    2. Explain how to implement the Stitch components (give structure).
    3. Explain how to wire up the Opal logic/APIs.
    4. Define the folder structure.

    CRITICAL: Return ONLY the raw prompt text suitable for copy-pasting.
  `;

  const text = await callGeminiApi(
    prompt,
    {
      systemInstruction: "You are a Lead Software Engineer. You write precise, technical specifications for other developers.",
    }
  );

  return text || "Failed to generate Integration Prompt.";
};
