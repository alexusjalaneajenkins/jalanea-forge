import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ProjectState, ResearchDocument } from "../types";

export const MISSING_API_KEY_ERROR = "MISSING_API_KEY";

const getClient = () => {
  const storedKey = localStorage.getItem('jalanea_gemini_key');
  if (storedKey) {
    return new GoogleGenAI({ apiKey: storedKey });
  }

  const apiKey = (import.meta as any).env.VITE_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error(MISSING_API_KEY_ERROR);
  }
  return new GoogleGenAI({ apiKey });
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateContentWithRetry = async (
  ai: GoogleGenAI,
  modelName: string,
  contents: any,
  config?: any,
  maxRetries = 3
): Promise<GenerateContentResponse> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      // Use ai.models.generateContent which is the correct API for @google/genai SDK
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config
      });
      return response;
    } catch (error: any) {
      // Check for 429 (Resource Exhausted) or 503 (Service Unavailable)
      const isRateLimit = error.message?.includes('429') || error.status === 429 || error.code === 429;

      console.error(`Gemini API Error (Attempt ${attempt + 1}/${maxRetries}):`, error.message || error);

      if (isRateLimit && attempt < maxRetries - 1) {
        let waitTime = Math.pow(2, attempt) * 1000; // Default: 1s, 2s, 4s...

        // Try to parse the specific retry time from the error message
        // Example: "Please retry in 53.024661139s."
        const match = error.message?.match(/Please retry in ([0-9.]+)s/);
        if (match && match[1]) {
          waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 1000; // Add 1s buffer
        }

        console.warn(`Gemini API 429 hit. Retrying in ${waitTime}ms... (Attempt ${attempt + 1}/${maxRetries})`);
        await delay(waitTime);
        attempt++;
      } else {
        console.error(`Gemini API Error (Model: ${modelName}):`, error);
        throw error;
      }
    }
  }
  throw new Error(`Max retries exceeded for model ${modelName}`);
};

const formatResearchContext = (docs: ResearchDocument[]): string => {
  if (docs.length === 0) return "No specific research documents provided.";
  return docs
    .filter(d => d.mimeType.startsWith('text')) // Only format text docs here if used
    .map(d => `--- SOURCE: ${d.name} ---\n${d.content}\n--- END SOURCE ---`)
    .join("\n\n");
};

export const refineIdea = async (rawInput: string): Promise<string> => {
  const ai = getClient();
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

  const response = await generateContentWithRetry(
    ai,
    'gemini-3-flash-preview',
    prompt, // Pass string directly
    {
      systemInstruction: "You are a Chief Product Officer. Your goal is to clarify and elevate raw ideas into actionable product visions.",
      temperature: 0.7,
    }
  );

  return response.text || "Failed to refine idea.";
};

export const generateResearchPrompt = async (synthesizedIdea: string): Promise<{ mission: string, report: string }> => {
  const ai = getClient();

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

  const missionResponse = await generateContentWithRetry(
    ai,
    'gemini-3-flash-preview',
    missionPrompt,
    {
      temperature: 0.7,
    }
  );

  const mission = (missionResponse.text || "").trim();

  // 2. Construct the "Report Generation Prompt" (The template for the Chat)
  // This uses the user's specific template, injecting the vision at the top.
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
  const ai = getClient();

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

  const response = await generateContentWithRetry(
    ai,
    'gemini-3-flash-preview',
    { parts }, // Pass object with parts
    {
      systemInstruction: `You are a world-class Product Manager. You are strict, detailed, and focus on viability and user value. Current Date: ${new Date().toLocaleDateString()}`,
      temperature: 0.7,
    }
  );

  return response.text || "Failed to generate PRD.";
};

export const generatePlan = async (prd: string): Promise<string> => {
  const ai = getClient();
  const prompt = `
    Based on the following PRD, create a step-by-step Implementation Plan (Roadmap).

    PRD CONTENT:
    ${prd}

    TASK:
    Create a phased roadmap (Phase 1: MVP, Phase 2: Polish, Phase 3: Scale).
    
    CRITICAL OUTPUT FORMAT:
    You must output a strictly valid JSON array of objects. Do not wrap in markdown or code blocks.
    Each object must have:
    - "phaseName": string (e.g., "Phase 1: MVP")
    - "description": string (Summary of goals)
    - "steps": array of objects, where each object has:
        - "stepName": string (e.g., "Setup Authentication")
        - "description": string (User-facing summary)
    - "technicalBrief": string (Explanation of complexity)
        - "systemPrompt": string (Google AI Studio SYSTEM INSTRUCTION. Must define the Persona, Tech Stack, and Coding Standards. e.g. "You are a Senior React Engineer. Stack: Next.js 14, Tailwind. Rules: Use TypeScript, functional components...")
        - "diyPrompt": string (Google AI Studio USER PROMPT. The specific task instruction. e.g. "Create a responsive Navbar component with the following links...")
        - "hirePitch": string (A concise reason to hire an expert, e.g., "Authentication security errors can cost $10k+ to fix.")

    Example Output Structure:
    [
      { 
        "phaseName": "Phase 1: Foundation", 
        "description": "...", 
        "steps": [
           { 
             "stepName": "Setup Next.js", 
             "description": "Initialize the app repo.", 
             "technicalBrief": "...", 
             "systemPrompt": "Act as a Senior React Engineer. You are building 'DogWalkerAI'.\nStack: Next.js 14, Supabase, Tailwind, Framer Motion.\nCoding Standards: Functional components, TypeScript, strict types.",
             "diyPrompt": "Initialize a new Next.js 14 project using the App Router. Remove the default boilerplate css. Setup the folder structure for 'components', 'lib', and 'hooks'.", 
             "hirePitch": "..." 
           }
        ]
      }
    ]
  `;

  const response = await generateContentWithRetry(
    ai,
    'gemini-3-flash-preview',
    prompt,
    {
      systemInstruction: "You are a Technical Project Manager. You advocate for the 'Hybrid' approach: letting users build simple things (DIY) but identifying high-risk areas where hiring an expert is smarter. Return raw JSON.",
    }
  );

  let text = response.text || "[]";
  // Clean markdown if present
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  return text;
};

export const refineBugReport = async (error: string, context: string): Promise<{ subject: string, body: string }> => {
  const ai = getClient();
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

  const response = await generateContentWithRetry(
    ai,
    'gemini-3-flash-preview',
    prompt,
    {
      systemInstruction: "You are a Senior Support Engineer. Translate user errors into actionable technical bug reports. Return raw JSON."
    }
  );

  let text = response.text || "{}";
  text = text.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(text);
  } catch (e) {
    return { subject: "Error Report", body: error };
  }
};

export const refinePrd = async (currentPrd: string, instructions: string): Promise<string> => {
  const ai = getClient();
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

  const response = await generateContentWithRetry(
    ai,
    'gemini-3-flash-preview',
    prompt,
    {
      systemInstruction: "You are an AI Product Editor. Your goal is to refine the PRD exactly as requested while maintaining structural integrity.",
      temperature: 0.7
    }
  );

  return response.text || currentPrd;
};

export const generateDesignPrompts = async (prd: string, plan: string): Promise<{ stitch: string, opal: string }> => {
  const ai = getClient();

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
    generateContentWithRetry(ai, 'gemini-3-flash-preview', stitchPrompt, { temperature: 0.7 }),
    generateContentWithRetry(ai, 'gemini-3-flash-preview', opalPrompt, { temperature: 0.7 })
  ]);

  return {
    stitch: stitchRes.text || "Failed to generate Stitch prompt.",
    opal: opalRes.text || "Failed to generate Opal prompt."
  };
};

export const generateCodePrompt = async (projectState: ProjectState): Promise<string> => {
  const ai = getClient();

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

  const response = await generateContentWithRetry(
    ai,
    'gemini-3-flash-preview',
    prompt,
    {
      systemInstruction: "You are a Lead Software Engineer. You write precise, technical specifications for other developers.",
    }
  );

  return response.text || "Failed to generate Integration Prompt.";
};