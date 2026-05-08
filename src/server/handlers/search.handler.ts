import { TRPCError } from "@trpc/server";
import type { SearchResult } from "../lib/types";
import { searchWeb } from "../queries/serpapi.query";

/**
 * Run the structured part of a search: web results only.
 * The streamed AI answer is handled separately by the answer handler so the UI
 * can render sources immediately while the LLM is still generating.
 */
export async function runSearch(query: string): Promise<SearchResult> {
  try {
    const sources = await searchWeb(query);
    return { query, sources };
  } catch (err) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: err instanceof Error ? err.message : "Web search failed",
    });
  }
}
