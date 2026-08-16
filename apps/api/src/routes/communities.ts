import type { FastifyInstance } from "fastify";
import { z } from "zod";

const communityIdParams = z.object({
  communityId: z.string().uuid()
});

export async function communityRoutes(app: FastifyInstance) {
  app.get("/api/v1/communities/:communityId", async (request) => {
    const params = communityIdParams.parse(request.params);

    // Authentication and repository integration are intentionally added before
    // exposing real community data. Never return client-supplied community state.
    return {
      id: params.communityId
    };
  });
}
