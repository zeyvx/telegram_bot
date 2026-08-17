import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createAuthorizationRepository, createCommunityAccessRepository, createRoleRepository } from "@community-os/database";
import { getTelegramIdentity } from "../auth/telegram-init-data.js";

const paramsSchema = z.object({ communityId: z.string().uuid() });
const roleParamsSchema = z.object({ communityId: z.string().uuid(), roleId: z.string().uuid() });
const querySchema = z.object({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(50) });
const createRoleSchema = z.object({ name: z.string().trim().min(1).max(64), description: z.string().trim().max(500).optional(), icon: z.string().trim().max(16).optional(), priority: z.number().int().min(0).max(100000), assignable: z.boolean().optional() });
const updateRoleSchema = createRoleSchema.partial();
const permissionsSchema = z.object({ permissionIds: z.array(z.string().min(1)).max(100) });
const assignRoleSchema = z.object({ targetUserId: z.string().uuid(), expiresAt: z.string().datetime({ offset: true }).nullable().optional() });

type Dependencies = { db: any; botToken: string };

function unauthorized(reply: any) {
  return reply.code(403).send({ error: { code: "FORBIDDEN", message: "Insufficient permissions" } });
}

export async function roleRoutes(app: FastifyInstance, deps: Dependencies) {
  const access = createCommunityAccessRepository(deps.db);
  const roles = createRoleRepository(deps.db);
  const authorization = createAuthorizationRepository(deps.db);

  async function context(request: any, communityId: string) {
    const identity = getTelegramIdentity(request, deps.botToken);
    const community = await access.getForTelegramUser(identity.telegramUserId, communityId);
    if (!community) return null;
    return { identity, community };
  }

  async function can(contextValue: any, permission: string) {
    if (!contextValue) return false;
    const permissions = await authorization.getActorPermissions(contextValue.community.id, contextValue.identity.telegramUserId);
    return permissions.has(permission as any);
  }

  app.get("/api/v1/communities/:communityId/roles", async (request, reply) => {
    const { communityId } = paramsSchema.parse(request.params);
    const query = querySchema.parse(request.query);
    const ctx = await context(request, communityId);
    if (!ctx) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found" } });
    const allRoles = await roles.list(communityId);
    const start = (query.page - 1) * query.limit;
    const data = allRoles.slice(start, start + query.limit);
    return { data, pagination: { page: query.page, limit: query.limit, total: allRoles.length, pages: Math.ceil(allRoles.length / query.limit) } };
  });

  app.get("/api/v1/communities/:communityId/roles/:roleId", async (request, reply) => {
    const params = roleParamsSchema.parse(request.params);
    const ctx = await context(request, params.communityId);
    if (!ctx) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found" } });
    const role = await roles.get(params.communityId, params.roleId);
    if (!role) return reply.code(404).send({ error: { code: "ROLE_NOT_FOUND", message: "Role not found" } });
    return { data: role };
  });

  app.post("/api/v1/communities/:communityId/roles", async (request, reply) => {
    const { communityId } = paramsSchema.parse(request.params);
    const body = createRoleSchema.parse(request.body);
    const ctx = await context(request, communityId);
    if (!ctx) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found" } });
    if (!(await can(ctx, "MANAGE_ROLES"))) return unauthorized(reply);
    const actorPriority = await authorization.getActorHighestRolePriority(communityId, ctx.identity.telegramUserId);
    if (body.priority >= actorPriority) return reply.code(403).send({ error: { code: "ROLE_HIERARCHY_VIOLATION", message: "Role priority must be below your highest role" } });
    const role = await roles.create({ communityId, ...body, priority: body.priority });
    return reply.code(201).send({ data: role });
  });

  app.patch("/api/v1/communities/:communityId/roles/:roleId", async (request, reply) => {
    const params = roleParamsSchema.parse(request.params);
    const body = updateRoleSchema.parse(request.body);
    const ctx = await context(request, params.communityId);
    if (!ctx) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found" } });
    if (!(await can(ctx, "MANAGE_ROLES"))) return unauthorized(reply);
    const targetPriority = await authorization.getRolePriority(params.communityId, params.roleId);
    const actorPriority = await authorization.getActorHighestRolePriority(params.communityId, ctx.identity.telegramUserId);
    if (targetPriority >= actorPriority || (body.priority !== undefined && body.priority >= actorPriority)) return reply.code(403).send({ error: { code: "ROLE_HIERARCHY_VIOLATION", message: "You cannot manage a role at or above your level" } });
    const role = await roles.update({ communityId: params.communityId, roleId: params.roleId, ...body });
    if (!role) return reply.code(404).send({ error: { code: "ROLE_NOT_FOUND", message: "Role not found" } });
    return { data: role };
  });

  app.delete("/api/v1/communities/:communityId/roles/:roleId", async (request, reply) => {
    const params = roleParamsSchema.parse(request.params);
    const ctx = await context(request, params.communityId);
    if (!ctx) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found" } });
    if (!(await can(ctx, "MANAGE_ROLES"))) return unauthorized(reply);
    const targetPriority = await authorization.getRolePriority(params.communityId, params.roleId);
    const actorPriority = await authorization.getActorHighestRolePriority(params.communityId, ctx.identity.telegramUserId);
    if (targetPriority >= actorPriority) return reply.code(403).send({ error: { code: "ROLE_HIERARCHY_VIOLATION", message: "You cannot manage this role" } });
    if (!(await roles.delete(params.communityId, params.roleId))) return reply.code(404).send({ error: { code: "ROLE_NOT_FOUND", message: "Role not found or managed" } });
    return reply.code(204).send();
  });

  app.put("/api/v1/communities/:communityId/roles/:roleId/permissions", async (request, reply) => {
    const params = roleParamsSchema.parse(request.params);
    const body = permissionsSchema.parse(request.body);
    const ctx = await context(request, params.communityId);
    if (!ctx) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found" } });
    if (!(await can(ctx, "MANAGE_ROLES"))) return unauthorized(reply);
    const targetPriority = await authorization.getRolePriority(params.communityId, params.roleId);
    const actorPriority = await authorization.getActorHighestRolePriority(params.communityId, ctx.identity.telegramUserId);
    if (targetPriority >= actorPriority) return reply.code(403).send({ error: { code: "ROLE_HIERARCHY_VIOLATION", message: "You cannot manage this role" } });
    const role = await roles.get(params.communityId, params.roleId);
    if (!role) return reply.code(404).send({ error: { code: "ROLE_NOT_FOUND", message: "Role not found" } });
    await roles.setPermissions(params.roleId, body.permissionIds);
    return { data: await roles.get(params.communityId, params.roleId) };
  });

  app.post("/api/v1/communities/:communityId/roles/:roleId/assign", async (request, reply) => {
    const params = roleParamsSchema.parse(request.params);
    const body = assignRoleSchema.parse(request.body);
    const ctx = await context(request, params.communityId);
    if (!ctx) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found" } });
    if (!(await can(ctx, "ASSIGN_ROLES"))) return unauthorized(reply);
    const targetPriority = await authorization.getRolePriority(params.communityId, params.roleId);
    const actorPriority = await authorization.getActorHighestRolePriority(params.communityId, ctx.identity.telegramUserId);
    if (targetPriority >= actorPriority) return reply.code(403).send({ error: { code: "ROLE_HIERARCHY_VIOLATION", message: "You cannot assign this role" } });
    const role = await roles.get(params.communityId, params.roleId);
    if (!role || !role.assignable) return reply.code(400).send({ error: { code: "ROLE_NOT_ASSIGNABLE", message: "Role cannot be assigned" } });
    await roles.assignRole({ communityId: params.communityId, roleId: params.roleId, targetUserId: body.targetUserId, assignedBy: ctx.identity.telegramUserId, expiresAt: body.expiresAt ? new Date(body.expiresAt) : null });
    return reply.code(204).send();
  });

  app.delete("/api/v1/communities/:communityId/roles/:roleId/members/:targetUserId", async (request, reply) => {
    const params = z.object({ communityId: z.string().uuid(), roleId: z.string().uuid(), targetUserId: z.string().uuid() }).parse(request.params);
    const ctx = await context(request, params.communityId);
    if (!ctx) return reply.code(404).send({ error: { code: "COMMUNITY_NOT_FOUND", message: "Community not found" } });
    if (!(await can(ctx, "REMOVE_ROLES"))) return unauthorized(reply);
    const targetPriority = await authorization.getRolePriority(params.communityId, params.roleId);
    const actorPriority = await authorization.getActorHighestRolePriority(params.communityId, ctx.identity.telegramUserId);
    if (targetPriority >= actorPriority) return reply.code(403).send({ error: { code: "ROLE_HIERARCHY_VIOLATION", message: "You cannot remove this role" } });
    const removed = await roles.removeRole({ communityId: params.communityId, roleId: params.roleId, targetUserId: params.targetUserId });
    if (!removed) return reply.code(404).send({ error: { code: "MEMBER_ROLE_NOT_FOUND", message: "Role assignment not found" } });
    return reply.code(204).send();
  });
}
