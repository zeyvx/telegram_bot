import type { FastifyInstance } from "fastify";
import { z } from "zod";

const paramsSchema = z.object({ communityId: z.string().uuid() });
const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50)
});

export async function roleRoutes(app: FastifyInstance) {
  app.get("/api/v1/communities/:communityId/roles", async (request) => {
    const { communityId } = paramsSchema.parse(request.params);
    const query = querySchema.parse(request.query);
    return { data: [], communityId, pagination: { page: query.page, limit: query.limit, total: 0, pages: 0 } };
  });
}
