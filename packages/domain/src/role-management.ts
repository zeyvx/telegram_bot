import type { Permission } from "./permissions.js";
import { canManageTargetRole, hasPermission, type AuthorizationSubject } from "./authorization.js";

export function canCreateRole(subject: AuthorizationSubject, permission: Permission, priority: number): boolean {
  return hasPermission(subject, permission) && subject.actorHighestRolePriority > priority;
}

export function canEditRole(subject: AuthorizationSubject, permission: Permission, role: { communityId: string; priority: number }, nextPriority?: number): boolean {
  if (!hasPermission(subject, permission) || !canManageTargetRole(subject, role)) return false;
  return nextPriority === undefined || subject.actorHighestRolePriority > nextPriority;
}

export function canDeleteRole(subject: AuthorizationSubject, permission: Permission, role: { communityId: string; priority: number; managed: boolean }): boolean {
  return !role.managed && hasPermission(subject, permission) && canManageTargetRole(subject, role);
}

export function canAssignRole(subject: AuthorizationSubject, role: { communityId: string; priority: number; assignable: boolean }): boolean {
  return role.assignable && hasPermission(subject, "ASSIGN_ROLES") && canManageTargetRole(subject, role);
}

export function canRemoveRole(subject: AuthorizationSubject, role: { communityId: string; priority: number }): boolean {
  return hasPermission(subject, "REMOVE_ROLES") && canManageTargetRole(subject, role);
}
