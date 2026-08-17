import { Bot, webhookCallback } from "grammy";
import { loadConfig } from "@community-os/config";
import { createAuthorizationRepository, createAuditLogRepository, createCommunityAccessRepository, createDatabase, createMemberRepository, createRoleRepository } from "@community-os/database";
import { PERMISSIONS, canAssignRole, canDeleteRole, hasPermission } from "@community-os/domain";
import Fastify from "fastify";
import { communityMenuKeyboard, communityPickerKeyboard } from "./ui/community-menu.js";
import { membersKeyboard, memberActionsKeyboard } from "./ui/members-menu.js";
import { rolesKeyboard, roleActionsKeyboard } from "./ui/roles-menu.js";
import { roleAssignConfirmKeyboard, roleAssignMembersKeyboard, roleDeleteConfirmKeyboard } from "./ui/role-confirm.js";
import { formatMemberProfile } from "./ui/format.js";
import { mainMenuText, accessDeniedText } from "./ui/text.js";

const config = loadConfig();
const bot = new Bot(config.TELEGRAM_BOT_TOKEN);
const { db } = createDatabase(config.DATABASE_URL);
const communities = createCommunityAccessRepository(db);
const members = createMemberRepository(db);
const roles = createRoleRepository(db);
const authorization = createAuthorizationRepository(db);
const audit = createAuditLogRepository(db);

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
  if (!community) return void await ctx.answerCallbackQuery({ text: "⛔ Нет доступа к этому сообществу", show_alert: true });
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
  if (!community) return void await ctx.answerCallbackQuery({ text: "⛔ Нет доступа к этому сообществу", show_alert: true });
  const role = await roles.get(communityId, roleId);
  if (!role) return void await ctx.answerCallbackQuery({ text: "Роль не найдена", show_alert: true });
  const permissionsText = role.permissions.length ? role.permissions.map((p: any) => `• ${p.id}`).join("\n") : "• Нет разрешений";
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`🎭 ${role.icon ?? ""} ${role.name}\n\n${role.description ?? "Без описания"}\n\nПриоритет: ${role.priority}\n\nРазрешения:\n${permissionsText}`, { reply_markup: roleActionsKeyboard(communityId, roleId) });
});

bot.callbackQuery(/^role:create:(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const actor = await loadActor(String(ctx.from.id), communityId);
  if (!actor || !hasPermission(actor, PERMISSIONS.MANAGE_ROLES)) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("➕ Создание роли\n\nДля v1.0: /role create Название Приоритет\n\nПриоритет должен быть ниже вашей собственной роли.\n\nПосле создания права роли можно настроить.", { reply_markup: rolesKeyboard(communityId, await roles.list(communityId)) });
});

bot.callbackQuery(/^role:delete:(.+):(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const roleId = ctx.match[2];
  const actor = await loadActor(String(ctx.from.id), communityId);
  const role = await roles.get(communityId, roleId);
  if (!actor || !role || !hasPermission(actor, PERMISSIONS.MANAGE_ROLES) || actor.priority <= role.priority || role.managed) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`⚠️ Удалить роль «${role.name}»?\n\nЭто действие нельзя отменить.`, { reply_markup: roleDeleteConfirmKeyboard(communityId, roleId) });
});

bot.callbackQuery(/^role:delete:execute:(.+):(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const roleId = ctx.match[2];
  const actor = await loadActor(String(ctx.from.id), communityId);
  const role = await roles.get(communityId, roleId);
  if (!actor || !role || !hasPermission(actor, PERMISSIONS.MANAGE_ROLES) || actor.priority <= role.priority || role.managed) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  const deleted = await roles.delete(communityId, roleId);
  if (!deleted) return void await ctx.answerCallbackQuery({ text: "Роль уже удалена или недоступна", show_alert: true });
  await audit.write({ communityId, actorUserId: actor.userId, action: "ROLE_DELETED", metadata: { roleId, roleName: role.name } });
  await ctx.answerCallbackQuery({ text: "Роль удалена" });
  await ctx.editMessageText("🎭 Роли\n\nРоль удалена.", { reply_markup: rolesKeyboard(communityId, await roles.list(communityId)) });
});

bot.callbackQuery(/^role:assign:(.+):(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const roleId = ctx.match[2];
  const actor = await loadActor(String(ctx.from.id), communityId);
  const role = await roles.get(communityId, roleId);
  if (!actor || !role || !canAssignRole(actor, role)) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  const result = await members.list(communityId, 1, 20);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`👥 Выдать роль «${role.name}»\n\nВыберите участника:`, { reply_markup: roleAssignMembersKeyboard(communityId, roleId, result.members) });
});

bot.callbackQuery(/^role:assign:confirm:(.+):(.+):(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const roleId = ctx.match[2];
  const memberId = ctx.match[3];
  const actor = await loadActor(String(ctx.from.id), communityId);
  const role = await roles.get(communityId, roleId);
  const target = await members.find(communityId, memberId);
  if (!actor || !role || !target || !canAssignRole(actor, role)) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`Выдать «${role.name}» пользователю ${target.username ? `@${target.username}` : target.displayName}?`, { reply_markup: roleAssignConfirmKeyboard(communityId, roleId, memberId) });
});

bot.callbackQuery(/^role:assign:execute:(.+):(.+):(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const roleId = ctx.match[2];
  const memberId = ctx.match[3];
  const actor = await loadActor(String(ctx.from.id), communityId);
  const role = await roles.get(communityId, roleId);
  const target = await members.find(communityId, memberId);
  if (!actor || !role || !target || !canAssignRole(actor, role)) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  await roles.assignRole({ communityId, roleId, targetUserId: target.userId, assignedBy: actor.userId, expiresAt: null });
  await audit.write({ communityId, actorUserId: actor.userId, targetUserId: target.userId, action: "ROLE_ASSIGNED", metadata: { roleId, roleName: role.name } });
  await ctx.answerCallbackQuery({ text: "Роль выдана" });
  await ctx.editMessageText(`✅ Роль «${role.name}» выдана.`, { reply_markup: roleActionsKeyboard(communityId, roleId) });
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
