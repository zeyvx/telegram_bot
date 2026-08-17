import { InlineKeyboard } from "grammy";

export function roleDeleteConfirmKeyboard(communityId: string, roleId: string) {
  return new InlineKeyboard()
    .text("❌ Отмена", `role:open:${communityId}:${roleId}`)
    .text("🗑 Удалить", `role:delete:execute:${communityId}:${roleId}`);
}

export function roleAssignMembersKeyboard(communityId: string, roleId: string, members: Array<{ id: string; displayName: string }>) {
  const keyboard = new InlineKeyboard();
  for (const member of members) keyboard.text(member.displayName, `role:assign:confirm:${communityId}:${roleId}:${member.id}`).row();
  return keyboard.text("← Назад", `role:open:${communityId}:${roleId}`);
}

export function roleAssignConfirmKeyboard(communityId: string, roleId: string, memberId: string) {
  return new InlineKeyboard()
    .text("❌ Отмена", `role:assign:${communityId}:${roleId}`)
    .text("✅ Выдать", `role:assign:execute:${communityId}:${roleId}:${memberId}`);
}
