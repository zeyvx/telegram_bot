import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createCommunityAccessRepository, createRoleRepository } from "@community-os/database";
import { getTelegramIdentity } from "../auth/telegram-init-data.js";

const paramsSchema = z.object({ communityId: z.string().uuid() });
const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(50) });

type Dependencies = { db: any; botToken: string };

export async function roleRoutes(app: FastifyInstance, deps: Dependencies) {
  const access = createCommunityAccessRepository(deps.db);
  const roles = createRoleRepository(deps.db);

  app.get("/api/v1/communities/:communityId/roles", async (request, reply) => {
    const { communityId } = paramsSchema.parse(request.params);
    const query = querySchema.parse(request.query);
    const identity = getTelegramIdentity(request, deps.botToken);
    const community = await access.getForTelegramUser(identity.telegramUserId, communityId);
    if (!community) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found", requestId: request.id } });
    const allRoles = await roles.list(communityId);
    const start = (query.page - 1) * query.limit;
    const data = allRoles.slice(start, start + query.limit);
    return { data, pagination: { page: query.page, limit: query.limit, total: allRoles.length, pages: Math.ceil(allRoles.length / query.limit) } };
  });

  app.get("/api/v1/communities/:communityId/roles/:roleId", async (request, reply) => {
    const params = z.object({ communityId: z.string().uuid(), roleId: z.string().uuid() }).parse(request.params);
    const identity = getTelegramIdentity(request, deps.botToken);
    const community = await access.getForTelegramUser(identity.telegramUserId, params.communityId);
    if (!community) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found", requestId: request.id } });
    const role = await roles.get(params.communityId, params.roleId);
    if (!role) return reply.code(404).send({ error: { code: "ROLE_NOT_FOUND", message: "Role not found", requestId: request.id } });
    return { data: role };
  });
}
