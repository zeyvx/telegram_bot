import { InlineKeyboard } from "grammy";

export function communityPickerKeyboard(communities: Array<{ id: string; name: string }>) {
  const keyboard = new InlineKeyboard();
  for (const community of communities) keyboard.text(community.name, `community:open:${community.id}`).row();
  return keyboard;
}

export function communityMenuKeyboard(communityId: string) {
  return new InlineKeyboard()
    .text("👥 Участники", `members:open:${communityId}`).text("🛡 Модерация", `moderation:open:${communityId}`).row()
    .text("🎭 Роли", `roles:open:${communityId}`).text("📜 Журнал", `logs:open:${communityId}`).row()
    .text("⚙️ Настройки", `settings:open:${communityId}`).row()
    .text("← Сообщества", "communities:open");
}
