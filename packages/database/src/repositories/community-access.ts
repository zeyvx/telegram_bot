import { and, asc, eq } from "drizzle-orm";
import { communities, communityMembers, roles, users } from "../schema.js";

export function createCommunityAccessRepository(db: any) {
  return {
    async listForTelegramUser(telegramUserId: string) {
      return db.select({ id: communities.id, name: communities.title, roleName: roles.name })
        .from(communityMembers)
        .innerJoin(users, eq(users.id, communityMembers.userId))
        .innerJoin(communities, eq(communities.id, communityMembers.communityId))
        .leftJoin(roles, eq(roles.communityId, communities.id))
        .where(and(eq(users.telegramUserId, telegramUserId), eq(communityMembers.isActive, true), eq(communities.isActive, true)))
        .orderBy(asc(communities.title));
    },
    async getForTelegramUser(telegramUserId: string, communityId: string) {
      const rows = await db.select({ id: communities.id, name: communities.title, roleName: roles.name })
        .from(communityMembers)
        .innerJoin(users, eq(users.id, communityMembers.userId))
        .innerJoin(communities, eq(communities.id, communityMembers.communityId))
        .leftJoin(roles, eq(roles.communityId, communities.id))
        .where(and(eq(users.telegramUserId, telegramUserId), eq(communityMembers.communityId, communityId), eq(communityMembers.isActive, true), eq(communities.isActive, true)))
        .limit(1);
      return rows[0] ?? null;
    }
  };
}
