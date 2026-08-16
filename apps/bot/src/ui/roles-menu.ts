import { InlineKeyboard } from "grammy";

export function rolesKeyboard(communityId: string, roles: Array<{ id: string; name: string; priority: number }>) {
  const keyboard = new InlineKeyboard();
  for (const role of roles) keyboard.text(`${role.name} · ${role.priority}`, `role:open:${communityId}:${role.id}`).row();
  return keyboard.text("➕ Создать роль", `role:create:${communityId}`).row().text("← Назад", `community:open:${communityId}`);
}

export function roleActionsKeyboard(communityId: string, roleId: string) {
  return new InlineKeyboard()
    .text("👥 Выдать участнику", `role:assign:${communityId}:${roleId}`).row()
    .text("🗑 Удалить", `role:delete:${communityId}:${roleId}`).row()
    .text("← Роли", `roles:open:${communityId}`);
}
