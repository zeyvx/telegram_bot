import { eq, and } from "drizzle-orm";
import { permissions, rolePermissions, roles } from "../schema.js";

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  Owner: [
    "VIEW_MEMBERS", "MANAGE_MEMBERS", "MANAGE_ROLES", "ASSIGN_ROLES", "REMOVE_ROLES",
    "WARN_MEMBERS", "MUTE_MEMBERS", "BAN_MEMBERS", "DELETE_MESSAGES", "PIN_MESSAGES",
    "MANAGE_AUTOMATIONS", "VIEW_ANALYTICS", "MANAGE_SETTINGS", "MANAGE_BOT", "VIEW_LOGS"
  ],
  Administrator: [
    "VIEW_MEMBERS", "MANAGE_MEMBERS", "MANAGE_ROLES", "ASSIGN_ROLES", "REMOVE_ROLES",
    "WARN_MEMBERS", "MUTE_MEMBERS", "BAN_MEMBERS", "DELETE_MESSAGES", "PIN_MESSAGES",
    "MANAGE_AUTOMATIONS", "VIEW_ANALYTICS", "MANAGE_SETTINGS", "VIEW_LOGS"
  ],
  Moderator: [
    "VIEW_MEMBERS", "MANAGE_MEMBERS", "WARN_MEMBERS", "MUTE_MEMBERS", "BAN_MEMBERS",
    "DELETE_MESSAGES", "VIEW_LOGS"
  ],
  Helper: ["VIEW_MEMBERS", "WARN_MEMBERS"],
  VIP: ["VIEW_MEMBERS"],
  Veteran: ["VIEW_MEMBERS"],
  Member: ["VIEW_MEMBERS"]
};

export async function seedDefaultRolePermissions(db: any, communityId: string) {
  const roleRows = await db.select({ id: roles.id, name: roles.name }).from(roles).where(eq(roles.communityId, communityId));
  const permissionRows = await db.select({ id: permissions.id }).from(permissions);
  const available = new Set(permissionRows.map((permission: { id: string }) => permission.id));

  for (const role of roleRows) {
    const ids = (ROLE_PERMISSION_MAP[role.name] ?? []).filter((id) => available.has(id));
    if (!ids.length) continue;
    await db.insert(rolePermissions).values(ids.map((permissionId) => ({ roleId: role.id, permissionId }))).onConflictDoNothing();
  }
}
