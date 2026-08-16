export const ROLE_PRIORITIES = {
  OWNER: 1000,
  ADMINISTRATOR: 900,
  MODERATOR: 700,
  HELPER: 500,
  VIP: 300,
  VETERAN: 200,
  MEMBER: 100
} as const;

export function canManageRole(actorPriority: number, targetPriority: number): boolean {
  return actorPriority > targetPriority;
}

export function canAssignRole(
  actorPriority: number,
  targetRolePriority: number,
  hasPermission: boolean
): boolean {
  return hasPermission && canManageRole(actorPriority, targetRolePriority);
}
