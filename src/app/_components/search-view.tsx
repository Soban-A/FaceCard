"use client";

import { useState } from "react";
import { api, type RouterOutputs } from "~/trpc/react";
import { AnswerStream } from "./answer-stream";
import { SourceCard } from "./source-card";

type SearchData = RouterOutputs["search"]["run"];

export function SearchView() {
  const [input, setInput] = useState("");
  const [active, setActive] = useState<SearchData | null>(null);

  const search = api.search.run.useMutation({
    onSuccess: (data) => setActive(data),
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q || search.isPending) return;
    search.mutate({ query: q });
  };

  const errorMessage = search.error
    ? (search.error.data?.zodError?.fieldErrors.query?.[0] ??
      search.error.message)
    : null;

  return (
    <div className="flex flex-col gap-10">
      <form onSubmit={onSubmit} className="relative">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything…"
          autoFocus
          disabled={search.isPending}
          className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-4 pr-32 text-zinc-100 placeholder-zinc-500 outline-none transition focus:border-teal-300/50 focus:ring-2 focus:ring-teal-300/20 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!input.trim() || search.isPending}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-xl bg-teal-300 px-4 py-2 text-sm font-medium text-zinc-950 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {search.isPending ? "Searching…" : "Search"}
        </button>
      </form>

      {errorMessage && (
        <div className="rounded-xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300">
          {errorMessage}
        </div>
      )}

      {search.isPending && <SkeletonSources />}

      {active && !search.isPending && <Results data={active} />}

      {!active && !search.isPending && !errorMessage && (
        <Suggestions
          onPick={(q) => {
            setInput(q);
            search.mutate({ query: q });
          }}
        />
      )}
    </div>
  );
}

const EXAMPLES = [
  "What's the latest news about OpenAI?",
  "Compare Next.js App Router vs Pages Router",
  "How do tRPC subscriptions work?",
  "Best practices for prompt caching with Anthropic",
];

function Suggestions({ onPick }: { onPick: (q: string) => void }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">
        Try
      </h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {EXAMPLES.map((q) => (
          <li key={q}>
            <button
              type="button"
              onClick={() => onPick(q)}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-left text-sm text-zinc-300 transition hover:border-teal-300/40 hover:bg-zinc-900 hover:text-zinc-100"
            >
              {q}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Results({ data }: { data: SearchData }) {
  return (
    <>
      <section>
        <h2 className="mb-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">
          Sources
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.sources.map((source, i) => (
            <SourceCard key={source.url} source={source} index={i + 1} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">
          Answer
        </h2>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
          <AnswerStream
            key={data.query}
            query={data.query}
            sources={data.sources}
          />
        </div>
      </section>
    </>
  );
}

function SkeletonSources() {
  return (
    <section>
      <h2 className="mb-3 text-xs font-medium tracking-wider text-zinc-500 uppercase">
        Searching the web…
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-xl border border-zinc-800 bg-zinc-900"
          />
        ))}
      </div>
    </section>
  );
}
