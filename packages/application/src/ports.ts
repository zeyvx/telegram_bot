import type { Permission } from "@community-os/domain";

export interface AuthorizationRepository {
  getActorPermissions(communityId: string, userId: string): Promise<ReadonlySet<Permission>>;
  getActorHighestRolePriority(communityId: string, userId: string): Promise<number>;
  getRolePriority(communityId: string, roleId: string): Promise<number>;
}

export interface AuditLogWriter {
  write(input: {
    communityId: string;
    actorUserId: string;
    targetUserId?: string;
    action: string;
    metadata?: Record<string, unknown>;
  }): Promise<void>;
}
