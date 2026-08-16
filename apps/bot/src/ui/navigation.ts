import { InlineKeyboard } from "grammy";

export function backKeyboard(target = "menu:open") {
  return new InlineKeyboard().text("← Назад", target);
}

export function confirmKeyboard(confirmCallback: string, cancelCallback = "menu:open") {
  return new InlineKeyboard()
    .text("❌ Отмена", cancelCallback)
    .text("✅ Подтвердить", confirmCallback);
}
