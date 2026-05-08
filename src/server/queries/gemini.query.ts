import "server-only";
import { GoogleGenAI } from "@google/genai";
import { env } from "~/env.js";

const MODEL = "gemini-2.0-flash";
const TEMPERATURE = 0.2;

const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

/**
 * Stream an answer from Gemini, yielding text deltas as they arrive.
 * Caller is responsible for assembling them.
 */
export async function* streamAnswer(
  systemPrompt: string,
  userPrompt: string,
): AsyncGenerator<string, void, void> {
  const stream = await client.models.generateContentStream({
    model: MODEL,
    contents: userPrompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: TEMPERATURE,
    },
  });

  for await (const chunk of stream) {
    const text = chunk.text;
    if (text) yield text;
  }
}
