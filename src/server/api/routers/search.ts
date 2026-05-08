import { z } from "zod";
import { runSearch } from "~/server/handlers/search.handler";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const QueryInput = z.object({
  query: z.string().trim().min(1, "Query cannot be empty").max(500),
});

export const searchRouter = createTRPCRouter({
  run: publicProcedure
    .input(QueryInput)
    .mutation(({ input }) => runSearch(input.query)),
});
