import type { Permission } from "./permissions.js";

export interface AuthorizationSubject {
  communityId: string;
  actorUserId: string;
  actorHighestRolePriority: number;
  actorPermissions: ReadonlySet<Permission>;
}

export interface TargetRole {
  communityId: string;
  priority: number;
}

export function hasPermission(subject: AuthorizationSubject, permission: Permission): boolean {
  return subject.actorPermissions.has(permission);
}

export function canManageTargetRole(subject: AuthorizationSubject, target: TargetRole): boolean {
  return subject.communityId === target.communityId && subject.actorHighestRolePriority > target.priority;
}

export function authorizeRoleAssignment(
  subject: AuthorizationSubject,
  permission: Permission,
  target: TargetRole
): boolean {
  return hasPermission(subject, permission) && canManageTargetRole(subject, target);
}
