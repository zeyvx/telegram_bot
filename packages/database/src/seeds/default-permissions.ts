import type { Permission } from "@community-os/domain";
import { permissions } from "../schema.js";

export const DEFAULT_PERMISSIONS: ReadonlyArray<{ id: Permission; description: string }> = [
  { id: "VIEW_MEMBERS", description: "Просматривать участников" },
  { id: "MANAGE_MEMBERS", description: "Управлять участниками" },
  { id: "MANAGE_ROLES", description: "Создавать и изменять роли" },
  { id: "ASSIGN_ROLES", description: "Выдавать роли участникам" },
  { id: "REMOVE_ROLES", description: "Снимать роли с участников" },
  { id: "WARN_MEMBERS", description: "Выдавать предупреждения" },
  { id: "MUTE_MEMBERS", description: "Ограничивать участников" },
  { id: "BAN_MEMBERS", description: "Блокировать участников" },
  { id: "DELETE_MESSAGES", description: "Удалять сообщения" },
  { id: "PIN_MESSAGES", description: "Закреплять сообщения" },
  { id: "MANAGE_AUTOMATIONS", description: "Управлять автоматизациями" },
  { id: "VIEW_ANALYTICS", description: "Просматривать аналитику" },
  { id: "MANAGE_SETTINGS", description: "Управлять настройками" },
  { id: "MANAGE_BOT", description: "Управлять настройками бота" },
  { id: "VIEW_LOGS", description: "Просматривать журнал действий" }
];

export async function seedDefaultPermissions(db: any) {
  await db.insert(permissions).values(DEFAULT_PERMISSIONS).onConflictDoNothing();
}
