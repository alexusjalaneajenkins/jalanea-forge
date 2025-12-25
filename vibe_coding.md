# YC Vibe Coding Instructions

Use this instruction file to guide your AI Coding Assistant (Cursor, Windsurf, or similar) to ensure a frictionless, high-velocity "Vibe Coding" experience.

## Core Philosophy
1.  **Plan First, Code Second**: Never start coding without a detailed implementation plan in markdown.
2.  **Iterate in Chunks**: Build feature-by-feature. Do not attempt to boil the ocean.
3.  **Test-Driven Confidence**: Write high-level tests early to use as "guardrails" against regressions.
4.  **Reset When Stuck**: If the AI goes down a rabbit hole, `git reset --hard` and try again with a cleaner prompt.

## Planning Process
*   **Create a Comprehensive Plan**: Before writing code, ask the AI to generate a detailed `implementation_plan.md`.
*   **Review & Refine**: Manually review the plan. Mark items as "Won't Do" if they are out of scope.
*   **Track Progress**: Use a checklist (e.g., in `task.md`) and have the AI mark sections as completed.
*   **Commit Regularly**: Commit *every single working state*. `git commit` is your save point.

## Version Control Rules
*   **Git is Religion**: Do not rely on "Undo". Rely on Git.
*   **Clean Slates**: Start every new feature from a clean, working commit.
*   **Avoid Cumulative Errors**: If an implementation fails 2-3 times, do not keep patching it. Revert to the last working commit and re-approach the problem.

## Testing Framework
*   **Integration over Unit**: Prioritize end-to-end integration tests that simulate user behavior.
*   **Test Before Proceeding**: Ensure the current feature passes all verifications before moving to the next.
*   **Catch Regressions**: Run the full test suite (or automated checks) frequently to catch unrelated breaks.

## Effective Bug Fixing
*   **Paste Errors Raw**: Simply copy-paste the full error stack trace. Do not summarize it.
*   **Analyze First**: Ask the AI: "Analyze the root cause of this error before writing a fix."
*   **Switch Models**: If one model (e.g., Claude 3.5 Sonnet) is stuck, try another (e.g., Gemini 3 Flash).

## Tech Stack & Optimization
*   **Stick to Established Frameworks**: Use tools with 20+ years of training data (e.g., Rails, React, Python) when possible.
*   **Modular Architecture**: Keep files small and focused.
*   **Docs API**: Download documentation (e.g., `.md` files) into a `docs/` folder for the AI to reference.

## "Vibe" Directives for AI
*   "Act as a Senior Engineer / Co-Founder."
*   "Be proactive: If you see a better way to structure this, propose it during the planning phase."
*   "Do not lecture. Just write the code."
*   "When updating files, show the full file content if it's small, or use precise diffs if it's large."
