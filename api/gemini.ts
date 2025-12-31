import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';

// Types for request body
interface GeminiRequestBody {
  model?: string;
  contents: any; // Can be string, object with parts, etc.
  config?: {
    systemInstruction?: string;
    temperature?: number;
    maxOutputTokens?: number;
  };
  action?: 'generate' | 'testKey';
  testApiKey?: string; // For testing user-provided API keys
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generateWithRetry(
  ai: GoogleGenAI,
  modelName: string,
  contents: any,
  config?: any,
  maxRetries = 3
): Promise<string> {
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: config
      });
      return response.text || '';
    } catch (error: any) {
      const isRateLimit = error.message?.includes('429') || error.status === 429;

      if (isRateLimit && attempt < maxRetries - 1) {
        let waitTime = Math.pow(2, attempt) * 1000;

        const match = error.message?.match(/Please retry in ([0-9.]+)s/);
        if (match && match[1]) {
          waitTime = Math.ceil(parseFloat(match[1]) * 1000) + 1000;
        }

        await delay(waitTime);
        attempt++;
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Max retries exceeded for model ${modelName}`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body: GeminiRequestBody = req.body;

    // Handle API key testing (uses user-provided key)
    if (body.action === 'testKey' && body.testApiKey) {
      try {
        const testAi = new GoogleGenAI({ apiKey: body.testApiKey });
        const response = await testAi.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: 'Say "OK" in one word.',
          config: {
            maxOutputTokens: 5,
            temperature: 0,
          }
        });

        if (response.text) {
          return res.status(200).json({ success: true });
        }
        return res.status(200).json({ success: false, error: 'No response received' });
      } catch (error: any) {
        const message = error.message || 'Unknown error';
        if (message.includes('API_KEY_INVALID') || message.includes('API key not valid')) {
          return res.status(200).json({ success: false, error: 'Invalid API key. Please check and try again.' });
        }
        if (message.includes('PERMISSION_DENIED')) {
          return res.status(200).json({ success: false, error: 'Permission denied. The API key may not have access to Gemini.' });
        }
        if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) {
          return res.status(200).json({ success: true }); // Rate limit means key is valid
        }
        return res.status(200).json({ success: false, error: message });
      }
    }

    // For regular generation, use server-side API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'Server configuration error: GEMINI_API_KEY not set'
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = body.model || 'gemini-3-flash-preview';

    const text = await generateWithRetry(
      ai,
      model,
      body.contents,
      body.config
    );

    return res.status(200).json({ text });
  } catch (error: any) {
    console.error('Gemini API Error:', error);

    // Return user-friendly error messages
    if (error.message?.includes('API_KEY_INVALID')) {
      return res.status(401).json({ error: 'Invalid API key configuration' });
    }
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    return res.status(500).json({
      error: error.message || 'Failed to generate content'
    });
  }
}
