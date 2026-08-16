import { and, eq } from "drizzle-orm";
import { communityMembers, memberRoles, roles } from "../schema.js";

export function createRoleRepository(db: any) {
  return {
    async roleExists(communityId: string, roleId: string): Promise<boolean> {
      const rows = await db.select({ id: roles.id }).from(roles)
        .where(and(eq(roles.id, roleId), eq(roles.communityId, communityId))).limit(1);
      return rows.length > 0;
    },

    async memberExists(communityId: string, userId: string): Promise<boolean> {
      const rows = await db.select({ id: communityMembers.id }).from(communityMembers)
        .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId), eq(communityMembers.isActive, true))).limit(1);
      return rows.length > 0;
    },

    async assignRole(input: { communityId: string; roleId: string; targetUserId: string; assignedBy: string; expiresAt: Date | null }): Promise<void> {
      const members = await db.select({ id: communityMembers.id }).from(communityMembers)
        .where(and(eq(communityMembers.communityId, input.communityId), eq(communityMembers.userId, input.targetUserId))).limit(1);
      if (!members[0]) throw new Error("Community member disappeared during role assignment");

      await db.insert(memberRoles).values({
        memberId: members[0].id,
        roleId: input.roleId,
        assignedBy: input.assignedBy,
        expiresAt: input.expiresAt
      }).onConflictDoUpdate({
        target: [memberRoles.memberId, memberRoles.roleId],
        set: { assignedBy: input.assignedBy, expiresAt: input.expiresAt, assignedAt: new Date() }
      });
    }
  };
}
