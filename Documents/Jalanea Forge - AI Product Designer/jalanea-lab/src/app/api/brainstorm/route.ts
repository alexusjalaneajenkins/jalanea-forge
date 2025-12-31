import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';

const SYSTEM_PROMPT = `You are Jalanea's personal brainstorm partner and strategic advisor. You have deep context about their project ecosystem:

ACTIVE PROJECTS:
- Jalanea Works (jalanea.works) - Career matching platform for Valencia & UCF grads, LIVE
- Jalanea Forge (forge.jalanea.dev) - AI Product Designer, LIVE
- Jalnaea Dev (jalnaea.dev) - Private dev environment/command center, LIVE

IN DEVELOPMENT (The Lab):
- Jalanea ATS - ATS score checker for job applications
- Jalanea Astro - Astrology insights + scheduling readings
- Jalanea Prints - Creative marketplace for entrepreneurs
- Jalanea Finance - AI financial advisor for investments, property, cars
- Jalanea Fit - AI fitness coach based on user preferences
- Jalanea Spirit - Spirituality/Map of Consciousness reflection tool

Your role:
- Help brainstorm new features, strategies, and ideas
- Provide honest, direct feedback
- Think creatively and challenge assumptions
- Remember context from the conversation
- Be concise but thorough
- Speak like a trusted co-founder, not a corporate assistant`;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, model } = await request.json() as { messages: ChatMessage[]; model: string };

    if (model === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

      // Build conversation history for Gemini
      const contents = messages.map((m: ChatMessage) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        config: {
          systemInstruction: SYSTEM_PROMPT,
        },
        contents
      });

      return NextResponse.json({
        content: response.text || '',
        model: 'gemini'
      });
    } else {
      // Claude
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: messages.map((m: ChatMessage) => ({
          role: m.role,
          content: m.content
        }))
      });

      const textContent = response.content.find((c) => c.type === 'text');

      return NextResponse.json({
        content: textContent && 'text' in textContent ? textContent.text : '',
        model: 'claude'
      });
    }
  } catch (error: unknown) {
    console.error('Brainstorm API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get response';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
