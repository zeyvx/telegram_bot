import type { Permission } from "@community-os/domain";

export interface AuthContext {
  userId: string;
  communityId: string;
  permissions: ReadonlySet<Permission>;
  highestRolePriority: number;
  telegramAdmin: boolean;
}

export interface AuthContextLoader {
  load(input: { userId: string; communityId: string }): Promise<AuthContext | null>;
}

export function requirePermission(context: AuthContext, permission: Permission): void {
  if (!context.permissions.has(permission)) throw new Error("FORBIDDEN");
}

export function requireTelegramAdmin(context: AuthContext): void {
  if (!context.telegramAdmin) throw new Error("TELEGRAM_ADMIN_REQUIRED");
}
