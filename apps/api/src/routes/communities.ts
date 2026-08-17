import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createCommunityAccessRepository } from "@community-os/database";
import { getTelegramIdentity } from "../auth/telegram-init-data.js";

const communityIdParams = z.object({ communityId: z.string().uuid() });

type Dependencies = { db: any; botToken: string };

export async function communityRoutes(app: FastifyInstance, deps: Dependencies) {
  const access = createCommunityAccessRepository(deps.db);

  app.get("/api/v1/communities", async (request) => {
    const identity = getTelegramIdentity(request, deps.botToken);
    return { data: await access.listForTelegramUser(identity.telegramUserId) };
  });

  app.get("/api/v1/communities/:communityId", async (request, reply) => {
    const { communityId } = communityIdParams.parse(request.params);
    const identity = getTelegramIdentity(request, deps.botToken);
    const community = await access.getForTelegramUser(identity.telegramUserId, communityId);
    if (!community) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found", requestId: request.id } });
    return { data: community };
  });
}
