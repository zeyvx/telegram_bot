import { hasPermission, type Permission } from "@community-os/domain";
import type { AuthContext } from "./auth-context.js";

export function canAccessCommunity(context: AuthContext, communityId: string): boolean {
  return context.communityId === communityId;
}

export function authorize(context: AuthContext, communityId: string, permission: Permission): boolean {
  return canAccessCommunity(context, communityId) && hasPermission(context, permission);
}
