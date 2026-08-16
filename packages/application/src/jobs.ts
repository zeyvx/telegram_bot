export interface RoleExpirationScheduler {
  scheduleRoleExpiration(input: {
    communityId: string;
    targetUserId: string;
    roleId: string;
    expiresAt: Date;
  }): Promise<void>;
}

export function assertFutureExpiration(expiresAt: Date): void {
  if (expiresAt.getTime() <= Date.now()) {
    throw new Error("Role expiration must be in the future");
  }
}
