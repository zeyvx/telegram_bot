import { InlineKeyboard } from "grammy";

export function mainMenuKeyboard() {
  return new InlineKeyboard()
    .text("👥 Участники", "members:open")
    .text("🛡 Модерация", "moderation:open")
    .row()
    .text("🎭 Роли", "roles:open")
    .text("⚡ Автоматизация", "automation:open")
    .row()
    .text("📜 Журнал", "logs:open")
    .text("⚙️ Настройки", "settings:open");
}
