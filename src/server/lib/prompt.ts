import type { Source } from "./types"

export const SYSTEM_PROMPT = `You are a research assistant that answers questions using the provided web search results.

Rules:
- Answer ONLY using information from the supplied sources. If the sources do not cover the question, say so plainly.
- Cite every factual claim inline using bracketed numerals matching the source order, e.g. [1], [2]. Multiple citations look like [1][3].
- Be concise: 2–4 short paragraphs. Lead with the direct answer.
- Do not invent URLs or fabricate quotes. Do not list the sources at the end — citations alone are enough.`;

export function buildUserPrompt(query: string, sources: Source[]): string {
  const sourcesBlock = sources
    .map(
      (s, i) =>
        `[${i + 1}] ${s.title} — ${s.domain}\n${s.snippet}\nURL: ${s.url}`,
    )
    .join("\n\n");

  return `Question: ${query}

Sources:
${sourcesBlock}`;
}
