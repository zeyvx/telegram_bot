import { Bot, webhookCallback } from "grammy";
import { loadConfig } from "@community-os/config";
import { createCommunityAccessRepository, createDatabase, createMemberRepository } from "@community-os/database";
import Fastify from "fastify";
import { communityMenuKeyboard, communityPickerKeyboard } from "./ui/community-menu.js";
import { membersKeyboard, memberActionsKeyboard } from "./ui/members-menu.js";
import { formatMemberProfile } from "./ui/format.js";
import { mainMenuText } from "./ui/text.js";

const config = loadConfig();
const bot = new Bot(config.TELEGRAM_BOT_TOKEN);
const { db, client } = createDatabase(config.DATABASE_URL);
const communities = createCommunityAccessRepository(db);
const members = createMemberRepository(db);

bot.command("start", async (ctx) => {
  const items = await communities.listForTelegramUser(String(ctx.from.id));
  if (!items.length) {
    await ctx.reply("🛡 Community OS\n\nУ вас пока нет подключённых сообществ.\n\nДобавьте бота в Telegram-группу и назначьте необходимые права администратора.");
    return;
  }
  await ctx.reply("🛡 Community OS\n\nВыберите сообщество:", { reply_markup: communityPickerKeyboard(items) });
});

bot.callbackQuery(/^community:open:(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const community = await communities.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community) {
    await ctx.answerCallbackQuery({ text: "⛔ Нет доступа к этому сообществу", show_alert: true });
    return;
  }
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(mainMenuText(community.name, community.roleName), { reply_markup: communityMenuKeyboard(community.id) });
});

bot.callbackQuery("communities:open", async (ctx) => {
  const items = await communities.listForTelegramUser(String(ctx.from.id));
  await ctx.answerCallbackQuery();
  if (!items.length) {
    await ctx.editMessageText("🛡 Community OS\n\nУ вас пока нет подключённых сообществ.");
    return;
  }
  await ctx.editMessageText("🛡 Community OS\n\nВыберите сообщество:", { reply_markup: communityPickerKeyboard(items) });
});

bot.callbackQuery(/^members:open:(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const community = await communities.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community) return void await ctx.answerCallbackQuery({ text: "⛔ Нет доступа", show_alert: true });
  const result = await members.list(communityId, 1);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`👥 Участники\n\n${community.name}\n\nВыберите участника:`, { reply_markup: membersKeyboard(communityId, result.members, 1, result.hasNext) });
});

bot.callbackQuery(/^members:page:(.+):([0-9]+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const page = Number(ctx.match[2]);
  const community = await communities.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community || !Number.isInteger(page) || page < 1) return void await ctx.answerCallbackQuery({ text: "⛔ Недоступно", show_alert: true });
  const result = await members.list(communityId, page);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`👥 Участники\n\n${community.name}\n\nВыберите участника:`, { reply_markup: membersKeyboard(communityId, result.members, page, result.hasNext) });
});

bot.callbackQuery(/^member:open:(.+):(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const memberId = ctx.match[2];
  const community = await communities.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community) return void await ctx.answerCallbackQuery({ text: "⛔ Нет доступа", show_alert: true });
  const member = await members.find(communityId, memberId);
  if (!member) return void await ctx.answerCallbackQuery({ text: "Участник не найден", show_alert: true });
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(formatMemberProfile(member), { reply_markup: memberActionsKeyboard(communityId, memberId) });
});

bot.callbackQuery(/^menu:open:(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const community = await communities.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community) return void await ctx.answerCallbackQuery({ text: "⛔ Нет доступа", show_alert: true });
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(mainMenuText(community.name, community.roleName), { reply_markup: communityMenuKeyboard(community.id) });
});

bot.on("my_chat_member", async (ctx) => {
  ctx.log.info?.({ chatId: ctx.chat.id, status: ctx.myChatMember.new_chat_member.status }, "bot membership status changed");
});

const app = Fastify({ logger: true });
app.get("/health", async () => ({ status: "ok" }));
app.post("/telegram/webhook", async (request, reply) => {
  const secret = request.headers["x-telegram-bot-api-secret-token"];
  if (secret !== config.TELEGRAM_WEBHOOK_SECRET) return reply.code(401).send({ error: "Unauthorized" });
  return webhookCallback(bot, "fastify")(request, reply);
});

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT + 1 });
} finally {
  await client.end();
}
