import { z } from "zod";
import { streamGroundedAnswer } from "~/server/handlers/answer.handler";

export const runtime = "nodejs";

const SourceSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
  domain: z.string(),
  faviconUrl: z.string().url(),
});

const InputSchema = z.object({
  query: z.string().trim().min(1).max(500),
  sources: z.array(SourceSchema).max(10),
});

export async function POST(req: Request) {
  let parsed;
  try {
    const body = (await req.json()) as unknown;
    parsed = InputSchema.parse(body);
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const delta of streamGroundedAnswer(
          parsed.query,
          parsed.sources,
        )) {
          controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Answer generation failed";
        controller.enqueue(encoder.encode(`\n\n[error] ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
