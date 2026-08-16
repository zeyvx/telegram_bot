import type { FastifyInstance } from "fastify";
import { z } from "zod";

const paramsSchema = z.object({ communityId: z.string().uuid() });

export async function memberRoutes(app: FastifyInstance) {
  app.get("/api/v1/communities/:communityId/members", async (request) => {
    const { communityId } = paramsSchema.parse(request.params);
    return { data: [], communityId, pagination: { page: 1, limit: 50, total: 0 } };
  });
}
