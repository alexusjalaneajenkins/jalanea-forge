
import { GoogleGenAI } from "@google/genai";

// Use the key provided by the user
const apiKey = "AIzaSyCZEVdjaW25SlaGPoqwCG9Jg-YOUlZSIeQ";
const ai = new GoogleGenAI({ apiKey });

async function listModels() {
    try {
        console.log("Fetching available models...");
        // @ts-ignore
        const response = await ai.models.list();
        // The SDK interface might vary, so let's log everything
        console.log("Models Response:", JSON.stringify(response, null, 2));


        // Also try a test generation with a few likely candidates
        const candidates = ['gemini-1.5-flash', 'gemini-1.5-flash-001', 'gemini-2.0-flash-exp', 'gemini-pro'];

        for (const model of candidates) {
            console.log(`\nTesting generation with: ${model}`);
            try {
                const res = await ai.models.generateContent({
                    model: model,
                    contents: "Hello, world!"
                });
                console.log(`SUCCESS: ${model} works!`);
            } catch (e: any) {
                console.log(`FAILED: ${model} - ${e.message}`);
            }
        }

    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
