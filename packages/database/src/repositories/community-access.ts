import { and, asc, desc, eq } from "drizzle-orm";
import { communities, communityMembers, memberRoles, roles, users } from "../schema.js";

async function highestRole(db: any, memberId: string) {
  const rows = await db.select({ name: roles.name }).from(memberRoles)
    .innerJoin(roles, eq(roles.id, memberRoles.roleId))
    .where(eq(memberRoles.memberId, memberId)).orderBy(desc(roles.priority)).limit(1);
  return rows[0]?.name ?? "Member";
}

export function createCommunityAccessRepository(db: any) {
  return {
    async listForTelegramUser(telegramUserId: string) {
      const rows = await db.select({ memberId: communityMembers.id, id: communities.id, name: communities.title, telegramChatId: communities.telegramChatId })
        .from(communityMembers)
        .innerJoin(users, eq(users.id, communityMembers.userId))
        .innerJoin(communities, eq(communities.id, communityMembers.communityId))
        .where(and(eq(users.telegramUserId, telegramUserId), eq(communityMembers.isActive, true), eq(communities.isActive, true)))
        .orderBy(asc(communities.title));
      return Promise.all(rows.map(async (row: any) => ({ id: row.id, name: row.name, telegramChatId: row.telegramChatId, roleName: await highestRole(db, row.memberId) })));
    },

    async getForTelegramUser(telegramUserId: string, communityId: string) {
      const rows = await db.select({ memberId: communityMembers.id, id: communities.id, name: communities.title, telegramChatId: communities.telegramChatId })
        .from(communityMembers)
        .innerJoin(users, eq(users.id, communityMembers.userId))
        .innerJoin(communities, eq(communities.id, communityMembers.communityId))
        .where(and(eq(users.telegramUserId, telegramUserId), eq(communityMembers.communityId, communityId), eq(communityMembers.isActive, true), eq(communities.isActive, true)))
        .limit(1);
      if (!rows[0]) return null;
      return { id: rows[0].id, name: rows[0].name, telegramChatId: rows[0].telegramChatId, roleName: await highestRole(db, rows[0].memberId) };
    }
  };
}
