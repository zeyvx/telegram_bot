import { and, asc, eq } from "drizzle-orm";
import { communityMembers, memberRoles, permissions, rolePermissions, roles } from "../schema.js";

export function createRoleRepository(db: any) {
  return {
    async list(communityId: string) {
      return db.select({ id: roles.id, name: roles.name, description: roles.description, icon: roles.icon, priority: roles.priority, assignable: roles.assignable, managed: roles.managed })
        .from(roles).where(eq(roles.communityId, communityId)).orderBy(asc(roles.priority));
    },

    async get(communityId: string, roleId: string) {
      const rows = await db.select({ id: roles.id, name: roles.name, description: roles.description, icon: roles.icon, priority: roles.priority, assignable: roles.assignable, managed: roles.managed })
        .from(roles).where(and(eq(roles.id, roleId), eq(roles.communityId, communityId))).limit(1);
      if (!rows[0]) return null;
      const permissionRows = await db.select({ id: permissions.id, description: permissions.description })
        .from(rolePermissions).innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId)).where(eq(rolePermissions.roleId, roleId));
      return { ...rows[0], permissions: permissionRows };
    },

    async create(input: { communityId: string; name: string; description?: string; icon?: string; priority: number }) {
      const rows = await db.insert(roles).values({ communityId: input.communityId, name: input.name, description: input.description ?? null, icon: input.icon ?? null, priority: input.priority }).returning();
      return rows[0];
    },

    async roleExists(communityId: string, roleId: string) {
      const rows = await db.select({ id: roles.id }).from(roles).where(and(eq(roles.id, roleId), eq(roles.communityId, communityId))).limit(1);
      return rows.length > 0;
    },

    async memberExists(communityId: string, userId: string) {
      const rows = await db.select({ id: communityMembers.id }).from(communityMembers).where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId), eq(communityMembers.isActive, true))).limit(1);
      return rows.length > 0;
    },

    async assignRole(input: { communityId: string; roleId: string; targetUserId: string; assignedBy: string; expiresAt: Date | null }) {
      const memberRows = await db.select({ id: communityMembers.id }).from(communityMembers).where(and(eq(communityMembers.communityId, input.communityId), eq(communityMembers.userId, input.targetUserId), eq(communityMembers.isActive, true))).limit(1);
      if (!memberRows[0]) throw new Error("COMMUNITY_MEMBER_NOT_FOUND");
      await db.insert(memberRoles).values({ memberId: memberRows[0].id, roleId: input.roleId, assignedBy: input.assignedBy, expiresAt: input.expiresAt })
        .onConflictDoUpdate({ target: [memberRoles.memberId, memberRoles.roleId], set: { assignedBy: input.assignedBy, expiresAt: input.expiresAt, assignedAt: new Date() } });
    }
  };
}
