import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createCommunityAccessRepository, createMemberRepository } from "@community-os/database";
import { getTelegramIdentity } from "../auth/telegram-init-data.js";

const paramsSchema = z.object({ communityId: z.string().uuid() });
const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(50) });

type Dependencies = { db: any; botToken: string };

export async function memberRoutes(app: FastifyInstance, deps: Dependencies) {
  const access = createCommunityAccessRepository(deps.db);
  const members = createMemberRepository(deps.db);

  app.get("/api/v1/communities/:communityId/members", async (request, reply) => {
    const { communityId } = paramsSchema.parse(request.params);
    const query = querySchema.parse(request.query);
    const identity = getTelegramIdentity(request, deps.botToken);
    const community = await access.getForTelegramUser(identity.telegramUserId, communityId);
    if (!community) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found", requestId: request.id } });
    const result = await members.list(communityId, query.page, query.limit);
    return { data: result.members, pagination: { page: query.page, limit: query.limit, hasNext: result.hasNext } };
  });
}
