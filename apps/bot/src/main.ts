import { Bot, webhookCallback } from "grammy";
import { loadConfig } from "@community-os/config";
import Fastify from "fastify";
import { communityMenuKeyboard, communityPickerKeyboard } from "./ui/community-menu.js";
import { mainMenuText } from "./ui/text.js";

const config = loadConfig();
const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

// v1.0 foundation: the provider is intentionally kept behind a small interface.
// The database-backed implementation can be injected here without coupling UI to Drizzle.
interface CommunityProvider {
  listForTelegramUser(telegramUserId: string): Promise<Array<{ id: string; name: string; roleName: string }>>;
  getForTelegramUser(telegramUserId: string, communityId: string): Promise<{ id: string; name: string; roleName: string } | null>;
}

const provider: CommunityProvider = {
  async listForTelegramUser() { return []; },
  async getForTelegramUser() { return null; }
};

bot.command("start", async (ctx) => {
  const communities = await provider.listForTelegramUser(String(ctx.from.id));
  if (!communities.length) {
    await ctx.reply("🛡 Community OS\n\nУ вас пока нет подключённых сообществ.\n\nДобавьте бота в Telegram-группу и назначьте необходимые права администратора.");
    return;
  }
  await ctx.reply("🛡 Community OS\n\nВыберите сообщество:", { reply_markup: communityPickerKeyboard(communities) });
});

bot.callbackQuery(/^community:open:(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const community = await provider.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community) {
    await ctx.answerCallbackQuery({ text: "⛔ Нет доступа к этому сообществу", show_alert: true });
    return;
  }

  await ctx.answerCallbackQuery();
  await ctx.editMessageText(mainMenuText(community.name, community.roleName), {
    reply_markup: communityMenuKeyboard()
  });
});

bot.callbackQuery("communities:open", async (ctx) => {
  const communities = await provider.listForTelegramUser(String(ctx.from.id));
  await ctx.answerCallbackQuery();
  if (!communities.length) {
    await ctx.editMessageText("🛡 Community OS\n\nУ вас пока нет подключённых сообществ.");
    return;
  }
  await ctx.editMessageText("🛡 Community OS\n\nВыберите сообщество:", {
    reply_markup: communityPickerKeyboard(communities)
  });
});

bot.callbackQuery("menu:open", async (ctx) => {
  await ctx.answerCallbackQuery();
  const communities = await provider.listForTelegramUser(String(ctx.from.id));
  if (!communities.length) {
    await ctx.editMessageText("🛡 Community OS\n\nУ вас пока нет подключённых сообществ.");
    return;
  }
  await ctx.editMessageText("🛡 Community OS\n\nВыберите сообщество:", {
    reply_markup: communityPickerKeyboard(communities)
  });
});

bot.on("my_chat_member", async (ctx) => {
  ctx.log.info?.({ chatId: ctx.chat.id }, "bot membership status changed");
});

const app = Fastify({ logger: true });
app.get("/health", async () => ({ status: "ok" }));
app.post("/telegram/webhook", async (request, reply) => {
  const secret = request.headers["x-telegram-bot-api-secret-token"];
  if (secret !== config.TELEGRAM_WEBHOOK_SECRET) {
    return reply.code(401).send({ error: "Unauthorized" });
  }
  return webhookCallback(bot, "fastify")(request, reply);
});

await app.listen({ host: config.API_HOST, port: config.API_PORT + 1 });
