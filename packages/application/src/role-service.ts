import { authorizeRoleAssignment, ForbiddenError, NotFoundError, PERMISSIONS } from "@community-os/domain";
import type { AuditLogWriter, AuthorizationRepository } from "./ports.js";

export interface RoleAssignmentRepository {
  roleExists(communityId: string, roleId: string): Promise<boolean>;
  memberExists(communityId: string, userId: string): Promise<boolean>;
  assignRole(input: { communityId: string; roleId: string; targetUserId: string; assignedBy: string; expiresAt: Date | null }): Promise<void>;
}

export class RoleService {
  constructor(private readonly authorization: AuthorizationRepository, private readonly roles: RoleAssignmentRepository, private readonly auditLogs: AuditLogWriter) {}

  async assignRole(input: { communityId: string; actorUserId: string; targetUserId: string; roleId: string; expiresAt?: Date | null }): Promise<void> {
    if (!(await this.roles.roleExists(input.communityId, input.roleId))) throw new NotFoundError("Role");
    if (!(await this.roles.memberExists(input.communityId, input.targetUserId))) throw new NotFoundError("Community member");

    const [permissions, actorPriority, targetPriority] = await Promise.all([
      this.authorization.getActorPermissions(input.communityId, input.actorUserId),
      this.authorization.getActorHighestRolePriority(input.communityId, input.actorUserId),
      this.authorization.getRolePriority(input.communityId, input.roleId)
    ]);

    if (!authorizeRoleAssignment({ communityId: input.communityId, actorUserId: input.actorUserId, actorHighestRolePriority: actorPriority, actorPermissions: permissions }, PERMISSIONS.ASSIGN_ROLES, { communityId: input.communityId, priority: targetPriority })) {
      throw new ForbiddenError("You cannot assign this role");
    }

    await this.roles.assignRole({ communityId: input.communityId, roleId: input.roleId, targetUserId: input.targetUserId, assignedBy: input.actorUserId, expiresAt: input.expiresAt ?? null });
    await this.auditLogs.write({ communityId: input.communityId, actorUserId: input.actorUserId, targetUserId: input.targetUserId, action: "ROLE_ASSIGNED", metadata: { roleId: input.roleId, expiresAt: input.expiresAt?.toISOString() ?? null } });
  }
}
