import { buildUserPrompt, SYSTEM_PROMPT } from "../lib/prompt";
import type { Source } from "../lib/types";
import { streamAnswer } from "../queries/gemini.query";

/**
 * Build the grounded prompt and stream an answer from the LLM.
 * Yields raw text deltas; the route handler is responsible for transport
 * framing (plain text, SSE, etc.).
 */
export async function* streamGroundedAnswer(
  query: string,
  sources: Source[],
): AsyncGenerator<string, void, void> {
  if (sources.length === 0) {
    yield "I couldn't find any web results for that query, so I can't give you a sourced answer.";
    return;
  }

  const userPrompt = buildUserPrompt(query, sources);
  yield* streamAnswer(SYSTEM_PROMPT, userPrompt);
}
