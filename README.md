# Search — a Perplexity Clone

A grounded search experience for the Face Card take-home: submit a query, get a streamed AI answer with inline citations to the live web sources it drew from.

## Stack

- **Next.js 15** (App Router) + **React 19**
- **tRPC v11** with **Zod** for input validation, **superjson** transformer
- **Tailwind v4**
- **Google Gemini** (`gemini-1.5-flash`) via `@google/genai`
- **SerpAPI** for web search
- `react-markdown` + `remark-gfm` for the answer rendering

## Quick start

```bash
# 1. Install
npm install

# 2. Add API keys
cp .env.example .env
# then fill in:
#   GEMINI_API_KEY  — from https://aistudio.google.com/apikey
#   SERPAPI_API_KEY — from https://serpapi.com/manage-api-key

# 3. Run
npm run dev
```

Open http://localhost:3000 and submit a query.

Both keys have generous free tiers (1500 Gemini requests/day, 100 SerpAPI searches/month) — no billing setup required for development.

## How it works

```
[ User submits query ]
        │
        ▼
trpc.search.run.mutate({ query })   ────►   POST /api/trpc/search.run
        │                                            │
        ▼                                            ▼
client renders source cards         searchRouter ─► runSearch ─► searchWeb (SerpAPI)
in ~1s, then…
        │
        └──► POST /api/answer { query, sources }
                                    │
                                    ▼
                    streamGroundedAnswer → buildUserPrompt → streamAnswer (Gemini)
                                    │
                                    ▼
                       text/plain ReadableStream of token deltas
                                    │
                                    ▼
                client appends tokens; replaces [N] with citation chips that
                scroll the matching source card into view on click
```

Two phases on purpose: sources are fast (one fetch), so render them immediately. The slow part — LLM generation — streams in below. Better perceived performance than waiting on both.

## Architecture

### Three-layer backend

```
src/server/
├── api/routers/        ROUTES    tRPC procedures, Zod input only, delegate to handlers
├── handlers/           HANDLERS  orchestration + error translation (TRPCError)
├── queries/            QUERIES   single-purpose external API calls, "server-only"
└── lib/                          shared types + system/user prompt builder
```

Each layer is only allowed to touch the one below. Routes can't accidentally call SerpAPI. Queries don't know about tRPC. Handlers are the only place that knows about both. The result: each layer is independently testable, and swapping the LLM or search provider is a one-file change.

### Why a `mutation`, not a `query`, for `search.run`

It's an external billable side-effect. Modeling it as a mutation prevents React Query from prefetching/auto-refetching/caching it like a pure read.

### Why a Route Handler for streaming, not tRPC subscriptions

Plain `text/plain` `ReadableStream` from a Next.js Route Handler works with vanilla `fetch` on the client and avoids the boilerplate of tRPC v11 subscriptions for a single streaming surface. tRPC still owns the structured part of the response (sources); only the token stream takes the alternate path.

### Citation rendering

The LLM is instructed to emit `[1]`, `[2]`, etc. inline. On the client, [`citation-text.tsx`](src/app/_components/citation-text.tsx) walks the rendered Markdown tree and replaces those tokens (wherever they appear — including inside `<strong>` or list items) with anchor chips that scroll the matching source card into view via `scrollIntoView`. The source cards expose anchor IDs like `#source-3`.

## Project layout

```
src/
├── app/
│   ├── _components/
│   │   ├── search-view.tsx        owns input + tRPC mutation, error/skeleton/suggestions
│   │   ├── source-card.tsx        favicon + title + snippet, anchored
│   │   ├── answer-stream.tsx      reads /api/answer body, accumulates tokens
│   │   └── citation-text.tsx      Markdown + [N] → citation chips
│   ├── api/
│   │   ├── answer/route.ts        POST → ReadableStream<text>
│   │   └── trpc/[trpc]/route.ts   tRPC HTTP adapter (scaffold)
│   ├── layout.tsx                 dark theme + TRPCReactProvider
│   └── page.tsx                   Server Component shell
├── server/
│   ├── api/
│   │   ├── root.ts                mounts searchRouter
│   │   ├── routers/search.ts      search.run mutation
│   │   └── trpc.ts                tRPC init (scaffold)
│   ├── handlers/
│   │   ├── search.handler.ts      orchestrates SerpAPI call
│   │   └── answer.handler.ts      builds prompt + streams Gemini
│   ├── queries/
│   │   ├── serpapi.query.ts       searchWeb(query) → Source[]
│   │   └── gemini.query.ts        streamAnswer(system, user) async generator
│   └── lib/
│       ├── types.ts               Source, SearchResult
│       └── prompt.ts              SYSTEM_PROMPT + buildUserPrompt
├── styles/globals.css             Tailwind import + Geist font variable
├── trpc/                          tRPC client + provider (scaffold)
└── env.js                         typed env schema
```

## Manual smoke tests

With `npm run dev` running:

```powershell
# Sources only — should return 5 normalized source objects
curl.exe -X POST http://localhost:3000/api/trpc/search.run `
  -H "Content-Type: application/json" `
  -d '{"json":{"query":"latest news about openai"}}'

# Streaming answer — use -N to see tokens arrive live
curl.exe -N -X POST http://localhost:3000/api/answer `
  -H "Content-Type: application/json" `
  -d '{\"query\":\"what is next.js\",\"sources\":[{\"title\":\"Next.js\",\"url\":\"https://nextjs.org\",\"snippet\":\"The React framework for production\",\"domain\":\"nextjs.org\",\"faviconUrl\":\"https://www.google.com/s2/favicons?domain=nextjs.org&sz=64\"}]}'

# Validation — should return a tRPC zodError
curl.exe -X POST http://localhost:3000/api/trpc/search.run `
  -H "Content-Type: application/json" `
  -d '{"json":{"query":""}}'
```

## Future enhancements

### Small / incremental

- **Server tests** — vitest suite per backend layer: queries with mocked `fetch`, handlers with mocked queries, routes via `createCaller`. The architecture is already set up for this — each layer mocks cleanly at one boundary.
- **End-to-end tests** — Playwright covering the golden path, citation scroll-to-source, abort-on-resubmit, and the empty-query and oversized-query rejection cases.
- **Stricter input validation** — strip control characters and zero-width chars from queries before they reach SerpAPI; cap source snippet length before embedding into the LLM prompt to mitigate prompt injection from compromised search results; tighten URL validation in the `/api/answer` Zod schema beyond `.url()`.
- **Rate limiting** — per-IP via `@upstash/ratelimit` on both `search.run` and `/api/answer`. Protects free-tier quotas from abuse.
- **Result caching** — Redis cache on `query → sources` so repeat queries don't re-bill SerpAPI; short TTL (~5 min) to keep results fresh.
- **Structured logging / telemetry** — request IDs, latency per layer, source count, token usage, error rates. Even just `console.log` JSON in production goes far.
- **Stop button** — let the user abort an in-flight stream without submitting a new query.
- **Error boundaries** — isolate the answer renderer so a malformed Markdown chunk can't crash the page.
- **Accessibility pass** — ARIA labels on citation chips, keyboard focus management, `prefers-reduced-motion` variant of the streaming caret and scroll behavior.
- **Model toggle via env** — switch between Gemini variants (or providers) without code changes.

### Larger / multi-session

- **Auth + persistent search history** — DB-backed history per user with a sidebar, search-within-history, and click-to-rerun. Probably Postgres + Drizzle + NextAuth or Clerk.
- **Multi-turn conversations** — "ask a follow-up" that carries prior turns as context. Each turn streams independently; sources accumulate across the thread.
- **Workspaces and shareable threads** — group searches into projects; generate public read-only URLs for an answer + its sources, with a permanent snapshot of the cited pages.
- **Real-time collaboration** — multiple users in the same session via Liveblocks or a Yjs CRDT. Useful for research teams working a problem together.
- **Background research agents** — long-running tasks that re-run a query daily/weekly and aggregate sources into a digest. Cron-driven, results delivered as a thread.
- **Domain-specific modes** — fintech mode (SEC filings, earnings calls, ticker overlays from Finnhub/Yahoo above the answer); legal mode (case law); medical (PubMed). Each mode swaps the source-retrieval strategy and prompt while keeping the rest of the pipeline identical.
- **Multi-modal input** — drag-and-drop a PDF, image, or screenshot; extract content; ground the answer in both the upload and the web. Likely Gemini's multi-modal endpoint plus a small extraction worker.
- **User-curated source allowlists** — domain weighting or exclusion ("only academic sources", "exclude reddit"), persisted per user.