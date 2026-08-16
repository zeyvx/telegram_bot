import { Bot, webhookCallback } from "grammy";
import { loadConfig } from "@community-os/config";
import { createAuthorizationRepository, createCommunityAccessRepository, createDatabase, createMemberRepository, createRoleRepository } from "@community-os/database";
import { PERMISSIONS, hasPermission, canManageTargetRole } from "@community-os/domain";
import Fastify from "fastify";
import { communityMenuKeyboard, communityPickerKeyboard } from "./ui/community-menu.js";
import { membersKeyboard, memberActionsKeyboard } from "./ui/members-menu.js";
import { rolesKeyboard, roleActionsKeyboard } from "./ui/roles-menu.js";
import { formatMemberProfile } from "./ui/format.js";
import { mainMenuText, accessDeniedText } from "./ui/text.js";

const config = loadConfig();
const bot = new Bot(config.TELEGRAM_BOT_TOKEN);
const { db, client } = createDatabase(config.DATABASE_URL);
const communities = createCommunityAccessRepository(db);
const members = createMemberRepository(db);
const roles = createRoleRepository(db);
const authorization = createAuthorizationRepository(db);

async function loadActor(telegramUserId: string, communityId: string) {
  const user = await db.query.users.findFirst({ where: (u: any, { eq }: any) => eq(u.telegramUserId, telegramUserId) });
  if (!user) return null;
  const member = await members.find(communityId, user.id);
  if (!member) return null;
  const permissions = await authorization.getActorPermissions(communityId, user.id);
  const priority = await authorization.getActorHighestRolePriority(communityId, user.id);
  return { userId: user.id, member, permissions, priority };
}

bot.command("start", async (ctx) => {
  const items = await communities.listForTelegramUser(String(ctx.from.id));
  if (!items.length) return void await ctx.reply("🛡 Community OS\n\nУ вас пока нет подключённых сообществ.\n\nДобавьте бота в Telegram-группу и назначьте необходимые права администратора.");
  await ctx.reply("🛡 Community OS\n\nВыберите сообщество:", { reply_markup: communityPickerKeyboard(items) });
});

bot.callbackQuery(/^community:open:(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const community = await communities.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community) return void await ctx.answerCallbackQuery({ text: "⛔ Нет доступа к этому сообществу", show_alert: true });
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(mainMenuText(community.name, community.roleName), { reply_markup: communityMenuKeyboard(community.id) });
});

bot.callbackQuery("communities:open", async (ctx) => {
  const items = await communities.listForTelegramUser(String(ctx.from.id));
  await ctx.answerCallbackQuery();
  if (!items.length) return void await ctx.editMessageText("🛡 Community OS\n\nУ вас пока нет подключённых сообществ.");
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

bot.callbackQuery(/^roles:open:(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const community = await communities.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community) return void await ctx.answerCallbackQuery({ text: "⛔ Нет доступа", show_alert: true });
  const list = await roles.list(communityId);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`🎭 Роли\n\n${community.name}\n\nВыберите роль:`, { reply_markup: rolesKeyboard(communityId, list) });
});

bot.callbackQuery(/^role:open:(.+):(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const roleId = ctx.match[2];
  const community = await communities.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community) return void await ctx.answerCallbackQuery({ text: "⛔ Нет доступа", show_alert: true });
  const role = await roles.get(communityId, roleId);
  if (!role) return void await ctx.answerCallbackQuery({ text: "Роль не найдена", show_alert: true });
  const permissionsText = role.permissions.length ? role.permissions.map((p: any) => `• ${p.id}`).join("\n") : "• Нет разрешений";
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`🎭 ${role.icon ?? ""} ${role.name}\n\n${role.description ?? "Без описания"}\n\nПриоритет: ${role.priority}\n\nРазрешения:\n${permissionsText}`, { reply_markup: roleActionsKeyboard(communityId, roleId) });
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

await app.listen({ host: config.API_HOST, port: config.API_PORT + 1 });
