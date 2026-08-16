import { InlineKeyboard } from "grammy";

export function membersKeyboard(communityId: string, members: Array<{ id: string; displayName: string }>, page: number, hasNext: boolean) {
  const keyboard = new InlineKeyboard();
  for (const member of members) keyboard.text(member.displayName, `member:open:${communityId}:${member.id}`).row();
  if (page > 1) keyboard.text("←", `members:page:${communityId}:${page - 1}`);
  if (hasNext) keyboard.text("→", `members:page:${communityId}:${page + 1}`);
  keyboard.row().text("← Назад", `community:open:${communityId}`);
  return keyboard;
}

export function memberActionsKeyboard(communityId: string, memberId: string) {
  return new InlineKeyboard()
    .text("🎭 Роли", `member:roles:${communityId}:${memberId}`).row()
    .text("⚠️ Предупредить", `member:warn:${communityId}:${memberId}`).row()
    .text("🔇 Ограничить", `member:mute:${communityId}:${memberId}`)
    .text("🚫 Заблокировать", `member:ban:${communityId}:${memberId}`).row()
    .text("📜 История", `member:logs:${communityId}:${memberId}`).row()
    .text("← Участники", `members:open:${communityId}`);
}
