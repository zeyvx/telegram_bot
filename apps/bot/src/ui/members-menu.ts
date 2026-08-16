import { InlineKeyboard } from "grammy";

export function membersKeyboard(members: Array<{ id: string; displayName: string }>, page: number, hasNext: boolean) {
  const keyboard = new InlineKeyboard();
  for (const member of members) {
    keyboard.text(member.displayName, `member:open:${member.id}`).row();
  }
  if (page > 1) keyboard.text("←", `members:page:${page - 1}`);
  if (hasNext) keyboard.text("→", `members:page:${page + 1}`);
  keyboard.row().text("← Назад", "menu:open");
  return keyboard;
}

export function memberActionsKeyboard(memberId: string) {
  return new InlineKeyboard()
    .text("🎭 Роли", `member:roles:${memberId}`).row()
    .text("⚠️ Предупредить", `member:warn:${memberId}`).row()
    .text("🔇 Ограничить", `member:mute:${memberId}`)
    .text("🚫 Заблокировать", `member:ban:${memberId}`).row()
    .text("📜 История", `member:logs:${memberId}`).row()
    .text("← Участники", "members:open");
}
