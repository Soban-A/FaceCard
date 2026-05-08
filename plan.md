# Perplexity Clone — Implementation Plan

A simple Perplexity clone for the Face Card take-home. User submits a query, gets web search results + a streamed AI answer with inline citations.

---

## Stack & decisions locked in

- **Framework:** Next.js 15 (App Router) + React 19
- **API layer:** tRPC v11 with superjson, Zod inputs
- **Styling:** Tailwind v4
- **LLM:** Google Gemini (`gemini-2.0-flash`) via `@google/genai`
- **Web search:** SerpAPI (free tier — 100 searches/month)
- **Streaming transport:** Plain-text `ReadableStream` from a Next.js Route Handler. Chose this over tRPC subscriptions because it's simpler, works with vanilla `fetch` on the client, and tRPC v11 subscriptions add real complexity for one streaming surface.
- **Search procedure shape:** `mutation`, not `query` — it's a billable external side-effect; we don't want React Query prefetching or auto-refetching it.
- **Fintech extra credit:** Deferred. Originally planned ticker detection + live quote card, but pulled out to keep the minimum bar tight. Easy to add back later (see "Stretch" below).

---

## Backend architecture

Three-layer separation under [src/server/](src/server/):

```
api/routers/search.ts       ROUTE     — tRPC procedure, Zod input only, delegates to handler
handlers/*.handler.ts       HANDLER   — orchestration, error translation (TRPCError)
queries/*.query.ts          QUERY     — single-purpose external API calls, "server-only"
lib/{types,prompt}.ts       SHARED    — domain types, prompt construction
```

Plus the streaming endpoint at [src/app/api/answer/route.ts](src/app/api/answer/route.ts).

**Why this split:** routes can't accidentally call SerpAPI directly; queries can't accidentally throw `TRPCError`; handlers are the only place that knows about both. Easy to test each in isolation.

---

## Status

### Done

**Backend**

- [x] Project scaffold (`create-t3-app` — TS + tRPC + Tailwind + App Router)
- [x] Env schema ([src/env.js](src/env.js)) — `GEMINI_API_KEY`, `SERPAPI_API_KEY` filled in [.env](.env)
- [x] `@google/genai` SDK installed; `openai` removed
- [x] **Queries layer**
  - [x] [serpapi.query.ts](src/server/queries/serpapi.query.ts) — `searchWeb(query) → Source[]`, 8s timeout, normalized response
  - [x] [gemini.query.ts](src/server/queries/gemini.query.ts) — `streamAnswer(system, user)` async generator (model: `gemini-1.5-flash`)
- [x] **Handlers layer**
  - [x] [search.handler.ts](src/server/handlers/search.handler.ts) — runs SerpAPI, wraps errors as `TRPCError`
  - [x] [answer.handler.ts](src/server/handlers/answer.handler.ts) — builds prompt, streams from Gemini, handles empty-sources case
- [x] **Routes layer**
  - [x] [search.ts](src/server/api/routers/search.ts) — `search.run` mutation, Zod validates `query` (1–500 chars, trimmed)
  - [x] [root.ts](src/server/api/root.ts) — mounts `searchRouter`, post router removed
- [x] **Streaming endpoint** [api/answer/route.ts](src/app/api/answer/route.ts) — POST, Zod input, `text/plain` `ReadableStream`, error frames inline

**Frontend**

- [x] [layout.tsx](src/app/layout.tsx) — dark `bg-zinc-950` body, updated metadata
- [x] [page.tsx](src/app/page.tsx) — Server Component shell with header + `<SearchView />`
- [x] [search-view.tsx](src/app/_components/search-view.tsx) — Client; owns input + tRPC mutation, error display, skeleton, suggestions
- [x] [source-card.tsx](src/app/_components/source-card.tsx) — favicon + title + domain + snippet, anchored (`#source-N`) for citation scroll-into-view
- [x] [answer-stream.tsx](src/app/_components/answer-stream.tsx) — Client; reads `/api/answer` body stream, accumulates tokens, `AbortController` on remount
- [x] [citation-text.tsx](src/app/_components/citation-text.tsx) — Markdown rendering (`react-markdown` + `remark-gfm`) with `[N]` → citation chips that scroll the matching source into view
- [x] Empty-state suggestions (4 example queries, one-click run)
- [x] Tailwind polish — max-w-3xl column, rounded search input with focus ring, source card hover, citation chips, blinking caret while streaming
- [x] Old `_components/post.tsx` scaffold deleted

- [x] Whole project typechecks clean (`tsc --noEmit`)

### To do

- [ ] **End-to-end browser test**
  - [ ] Real query in browser, confirm citations scroll-into-view
  - [ ] Edge cases: empty query (Zod), no SerpAPI results, Gemini timeout, very long query
- [ ] **README** — what it is, how to run, env vars, design notes (tRPC layering, mutation vs query, streaming endpoint choice)

### Known blockers / notes

- **Gemini quota issue (resolved):** `gemini-2.0-flash` returned `RESOURCE_EXHAUSTED` with `limit: 0` — the AI Studio project had zero free-tier quota for that SKU. Switched to `gemini-1.5-flash` in [gemini.query.ts](src/server/queries/gemini.query.ts). If 1.5-flash also fails, regenerate the key from a clean AI Studio session or swap LLM provider — the swap is one file.
- **Sharing the project:** sending only `src/app/` won't run on the recipient's machine — they also need `src/server/`, `src/trpc/`, `src/env.js`, plus `package.json` (with `react-markdown` + `remark-gfm`). If they already have a working backend, `src/app/` + `package.json` + `npm install` is enough.

### Stretch (extra credit, in priority order)

- [ ] **Fintech angle** — ticker detection (`extractTicker`) + Yahoo Finance no-key quote endpoint + price/change card above the answer. ~1–2 hours.
- [x] ~~**Markdown rendering** in answer (`react-markdown` + GFM)~~ — done.
- [ ] **Recent searches** — `localStorage`, sidebar, click-to-rerun.
- [ ] **Multi-turn / follow-ups** — conversation state, "ask a follow-up" input.
- [ ] **Streaming the search status** too (e.g., "searching the web…" → "thinking…") for nicer perceived perf.

---

## How the request flows

```
[User types query]
       │
       ▼
trpc.search.run.mutate({ query })
       │  (POST /api/trpc/search.run)
       ▼
searchRouter.run  →  runSearch  →  searchWeb (SerpAPI)
       │
       ▼
{ query, sources } returned in ~1s
       │
       ▼
Client renders source cards immediately
       │
       └──► POST /api/answer { query, sources }
                  │
                  ▼
            streamGroundedAnswer  →  buildUserPrompt + streamAnswer (Gemini)
                  │
                  ▼
            ReadableStream of UTF-8 text deltas
                  │
                  ▼
            Client appends tokens; replaces [N] with anchor links live
```

---

## Test commands

Dev server: `npm run dev`

```powershell
# tRPC sources
Invoke-RestMethod -Uri http://localhost:3000/api/trpc/search.run -Method Post -ContentType 'application/json' -Body '{"json":{"query":"latest news about openai"}}'

# Streaming answer (note: Invoke-RestMethod buffers the full response; use curl.exe -N if you need to watch the stream live)
Invoke-RestMethod -Uri http://localhost:3000/api/answer -Method Post -ContentType 'application/json' -Body '{"query":"what is next.js","sources":[{"title":"Next.js","url":"https://nextjs.org","snippet":"The React framework for production","domain":"nextjs.org","faviconUrl":"https://www.google.com/s2/favicons?domain=nextjs.org&sz=64"}]}'

# Validation (should return zodError)
Invoke-RestMethod -Uri http://localhost:3000/api/trpc/search.run -Method Post -ContentType 'application/json' -Body '{"json":{"query":""}}'
```

---

## File index

| Path | Role |
| --- | --- |
| [src/env.js](src/env.js) | Typed env schema (server vars only) |
| [src/server/api/root.ts](src/server/api/root.ts) | tRPC root router |
| [src/server/api/trpc.ts](src/server/api/trpc.ts) | tRPC init (untouched scaffold) |
| [src/server/api/routers/search.ts](src/server/api/routers/search.ts) | `search.run` route |
| [src/server/handlers/search.handler.ts](src/server/handlers/search.handler.ts) | Search orchestration |
| [src/server/handlers/answer.handler.ts](src/server/handlers/answer.handler.ts) | Prompt build + answer streaming |
| [src/server/queries/serpapi.query.ts](src/server/queries/serpapi.query.ts) | SerpAPI fetch |
| [src/server/queries/gemini.query.ts](src/server/queries/gemini.query.ts) | Gemini streaming |
| [src/server/lib/types.ts](src/server/lib/types.ts) | `Source`, `SearchResult` |
| [src/server/lib/prompt.ts](src/server/lib/prompt.ts) | System prompt + user prompt builder |
| [src/app/api/answer/route.ts](src/app/api/answer/route.ts) | Streaming endpoint |
| [src/app/api/trpc/[trpc]/route.ts](src/app/api/trpc/[trpc]/route.ts) | tRPC HTTP adapter (scaffold) |