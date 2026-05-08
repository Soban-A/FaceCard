import "server-only";
import { env } from "~/env.js";
import type { Source } from "../lib/types";

interface SerpApiOrganicResult {
  title?: string;
  link?: string;
  snippet?: string;
  favicon?: string;
}

interface SerpApiResponse {
  organic_results?: SerpApiOrganicResult[];
  error?: string;
}

const SERPAPI_TIMEOUT_MS = 8_000;
const MAX_RESULTS = 5;

/**
 * Run a Google search via SerpAPI and return the top organic results,
 * normalized to our Source shape.
 */
export async function searchWeb(query: string): Promise<Source[]> {
  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("num", String(MAX_RESULTS));
  url.searchParams.set("api_key", env.SERPAPI_API_KEY);

  const res = await fetch(url, {
    signal: AbortSignal.timeout(SERPAPI_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`SerpAPI request failed (${res.status})`);
  }

  const data = (await res.json()) as SerpApiResponse;
  if (data.error) throw new Error(`SerpAPI: ${data.error}`);

  const organic = data.organic_results ?? [];
  return organic
    .slice(0, MAX_RESULTS)
    .filter((r): r is SerpApiOrganicResult & { link: string } =>
      Boolean(r.link),
    )
    .map((r) => {
      const domain = safeHostname(r.link);
      return {
        title: r.title ?? r.link,
        url: r.link,
        snippet: r.snippet ?? "",
        domain,
        faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      };
    });
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}
