"use client";

import { useEffect, useState } from "react";
import type { Source } from "~/server/lib/types";
import { CitationText } from "./citation-text";

interface Props {
  query: string;
  sources: Source[];
}

type Status = "streaming" | "done" | "error";

/**
 * POSTs to /api/answer and accumulates the streamed response.
 * Parent should mount this with `key={query}` so a new search remounts
 * the component and starts a fresh stream.
 */
export function AnswerStream({ query, sources }: Props) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("streaming");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, sources }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Stream failed (${res.status})`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          setText((prev) => prev + chunk);
        }
        if (!cancelled) setStatus("done");
      } catch (err) {
        if (cancelled) return;
        if (err instanceof Error && err.name === "AbortError") return;
        setErrorMsg(err instanceof Error ? err.message : "Unknown error");
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [query, sources]);

  if (status === "error" && !text) {
    return (
      <p className="text-sm text-red-300">
        Sorry, the answer failed to generate.
        {errorMsg ? ` ${errorMsg}` : ""}
      </p>
    );
  }

  return (
    <CitationText
      text={text}
      sources={sources}
      streaming={status === "streaming"}
    />
  );
}
