import type { Bot, Context } from "grammy";
import { communityPickerKeyboard, communityMenuKeyboard } from "../ui/community-menu.js";
import { mainMenuText } from "../ui/text.js";

export interface BotCommunity {
  id: string;
  name: string;
  roleName: string;
}

export interface CommunityProvider {
  listForTelegramUser(telegramUserId: string): Promise<BotCommunity[]>;
  getForTelegramUser(telegramUserId: string, communityId: string): Promise<BotCommunity | null>;
}

function telegramUserId(ctx: Context): string {
  const id = ctx.from?.id;
  if (!id) throw new Error("TELEGRAM_USER_REQUIRED");
  return String(id);
}

export function registerNavigationHandlers(bot: Bot, provider: CommunityProvider) {
  bot.command("start", async (ctx) => {
    const communities = await provider.listForTelegramUser(telegramUserId(ctx));
    if (communities.length === 0) {
      await ctx.reply("🛡 Community OS\n\nУ вас пока нет подключённых сообществ.");
      return;
    }
    await ctx.reply("🛡 Community OS\n\nВыберите сообщество:", {
      reply_markup: communityPickerKeyboard(communities)
    });
  });

  bot.callbackQuery("communities:open", async (ctx) => {
    const communities = await provider.listForTelegramUser(telegramUserId(ctx));
    await ctx.answerCallbackQuery();
    await ctx.editMessageText("🛡 Community OS\n\nВыберите сообщество:", {
      reply_markup: communityPickerKeyboard(communities)
    });
  });

  bot.callbackQuery(/^community:open:(.+)$/, async (ctx) => {
    const communityId = ctx.match[1];
    const community = await provider.getForTelegramUser(telegramUserId(ctx), communityId);
    await ctx.answerCallbackQuery();
    if (!community) {
      await ctx.editMessageText("⛔ У вас нет доступа к этому сообществу.");
      return;
    }
    await ctx.editMessageText(mainMenuText(community.name, community.roleName), {
      reply_markup: communityMenuKeyboard()
    });
  });

  bot.callbackQuery("menu:open", async (ctx) => {
    await ctx.answerCallbackQuery();
    const communities = await provider.listForTelegramUser(telegramUserId(ctx));
    if (communities.length === 1) {
      const community = communities[0];
      await ctx.editMessageText(mainMenuText(community.name, community.roleName), {
        reply_markup: communityMenuKeyboard()
      });
      return;
    }
    await ctx.editMessageText("🛡 Community OS\n\nВыберите сообщество:", {
      reply_markup: communityPickerKeyboard(communities)
    });
  });
}
