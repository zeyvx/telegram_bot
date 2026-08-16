import { and, desc, eq } from "drizzle-orm";
import { communityMembers, memberRoles, roles, users } from "../schema.js";

export function createMemberRepository(db: any) {
  return {
    async find(communityId: string, userId: string) {
      const rows = await db.select({
        id: communityMembers.id,
        userId: users.id,
        username: users.username,
        displayName: users.firstName,
        lastName: users.lastName,
        level: communityMembers.level,
        xp: communityMembers.xp,
        warnings: communityMembers.warnings,
        joinedAt: communityMembers.joinedAt
      }).from(communityMembers)
        .innerJoin(users, eq(users.id, communityMembers.userId))
        .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId), eq(communityMembers.isActive, true)))
        .limit(1);
      if (!rows[0]) return null;
      const roleRows = await db.select({ name: roles.name }).from(memberRoles)
        .innerJoin(roles, eq(roles.id, memberRoles.roleId))
        .where(eq(memberRoles.memberId, rows[0].id)).orderBy(desc(roles.priority));
      return { ...rows[0], displayName: [rows[0].displayName, rows[0].lastName].filter(Boolean).join(" "), roles: roleRows.map((r: { name: string }) => r.name) };
    },

    async list(communityId: string, page: number, pageSize = 10) {
      const offset = Math.max(0, page - 1) * pageSize;
      const rows = await db.select({
        id: communityMembers.userId,
        displayName: users.firstName,
        lastName: users.lastName,
        username: users.username
      }).from(communityMembers)
        .innerJoin(users, eq(users.id, communityMembers.userId))
        .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.isActive, true)))
        .orderBy(users.firstName, users.username)
        .limit(pageSize + 1).offset(offset);
      const hasNext = rows.length > pageSize;
      return { members: rows.slice(0, pageSize).map((row: any) => ({ id: row.id, displayName: row.username ? `@${row.username}` : [row.displayName, row.lastName].filter(Boolean).join(" ") || "Без имени" })), hasNext };
    },

    async upsert(input: { communityId: string; userId: string }) {
      const rows = await db.insert(communityMembers).values({ communityId: input.communityId, userId: input.userId, isActive: true })
        .onConflictDoUpdate({ target: [communityMembers.communityId, communityMembers.userId], set: { isActive: true } }).returning();
      return rows[0];
    }
  };
}
