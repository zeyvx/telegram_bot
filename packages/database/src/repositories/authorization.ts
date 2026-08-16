import { and, eq } from "drizzle-orm";
import type { Permission } from "@community-os/domain";
import { communityMembers, memberRoles, permissions, rolePermissions, roles } from "../schema.js";

export function createAuthorizationRepository(db: any) {
  return {
    async getActorPermissions(communityId: string, userId: string): Promise<ReadonlySet<Permission>> {
      const rows = await db
        .select({ permissionId: permissions.id })
        .from(communityMembers)
        .innerJoin(memberRoles, eq(memberRoles.memberId, communityMembers.id))
        .innerJoin(rolePermissions, eq(rolePermissions.roleId, memberRoles.roleId))
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .innerJoin(roles, eq(roles.id, memberRoles.roleId))
        .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));

      return new Set(rows.map((row: { permissionId: string }) => row.permissionId as Permission));
    },

    async getActorHighestRolePriority(communityId: string, userId: string): Promise<number> {
      const rows = await db
        .select({ priority: roles.priority })
        .from(communityMembers)
        .innerJoin(memberRoles, eq(memberRoles.memberId, communityMembers.id))
        .innerJoin(roles, eq(roles.id, memberRoles.roleId))
        .where(and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId)));

      return rows.reduce((max: number, row: { priority: number }) => Math.max(max, row.priority), 0);
    },

    async getRolePriority(communityId: string, roleId: string): Promise<number> {
      const rows = await db
        .select({ priority: roles.priority })
        .from(roles)
        .where(and(eq(roles.id, roleId), eq(roles.communityId, communityId)))
        .limit(1);

      return rows[0]?.priority ?? 0;
    }
  };
}
