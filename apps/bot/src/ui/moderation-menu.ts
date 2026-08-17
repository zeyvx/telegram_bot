import { InlineKeyboard } from "grammy";

export function moderationConfirmKeyboard(action: string, communityId: string, memberId: string) {
  return new InlineKeyboard()
    .text("❌ Отмена", `member:open:${communityId}:${memberId}`)
    .text("✅ Подтвердить", `moderation:execute:${action}:${communityId}:${memberId}`);
}

export function moderationResultKeyboard(communityId: string, memberId: string) {
  return new InlineKeyboard()
    .text("⚠️ Предупредить", `member:warn:${communityId}:${memberId}`)
    .text("🔇 Ограничить", `member:mute:${communityId}:${memberId}`).row()
    .text("🚫 Заблокировать", `member:ban:${communityId}:${memberId}`).row()
    .text("← Профиль", `member:open:${communityId}:${memberId}`);
}
