import { InlineKeyboard } from "grammy";

export function communityPickerKeyboard(communities: Array<{ id: string; name: string }>) {
  const keyboard = new InlineKeyboard();
  for (const community of communities) {
    keyboard.text(community.name, `community:open:${community.id}`).row();
  }
  return keyboard;
}

export function communityMenuKeyboard() {
  return new InlineKeyboard()
    .text("👥 Участники", "members:open").text("🛡 Модерация", "moderation:open").row()
    .text("🎭 Роли", "roles:open").text("📜 Журнал", "logs:open").row()
    .text("⚙️ Настройки", "settings:open").row()
    .text("← Сообщества", "communities:open");
}
