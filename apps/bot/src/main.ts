import { Bot, webhookCallback } from "grammy";
import { loadConfig } from "@community-os/config";
import { createAuthorizationRepository, createAuditLogRepository, createCommunityAccessRepository, createDatabase, createMemberRepository, createModerationRepository, createRoleRepository } from "@community-os/database";
import { PERMISSIONS, canAssignRole, hasPermission } from "@community-os/domain";
import Fastify from "fastify";
import { communityMenuKeyboard, communityPickerKeyboard } from "./ui/community-menu.js";
import { membersKeyboard, memberActionsKeyboard } from "./ui/members-menu.js";
import { rolesKeyboard, roleActionsKeyboard } from "./ui/roles-menu.js";
import { roleAssignConfirmKeyboard, roleAssignMembersKeyboard, roleDeleteConfirmKeyboard } from "./ui/role-confirm.js";
import { moderationConfirmKeyboard, moderationMenuKeyboard, moderationResultKeyboard } from "./ui/moderation-menu.js";
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
const moderation = createModerationRepository(db);

async function loadActor(telegramUserId: string, communityId: string) {
  const user = await db.query.users.findFirst({ where: (u: any, { eq }: any) => eq(u.telegramUserId, telegramUserId) });
  if (!user) return null;
  const member = await members.find(communityId, user.id);
  if (!member) return null;
  const permissions = await authorization.getActorPermissions(communityId, user.id);
  const priority = await authorization.getActorHighestRolePriority(communityId, user.id);
  return { userId: user.id, member, permissions, priority };
}

async function canModerate(actorTelegramId: string, communityId: string, targetUserId: string, permission: any) {
  const actor = await loadActor(actorTelegramId, communityId);
  if (!actor || !hasPermission(actor, permission)) return null;
  const target = await members.find(communityId, targetUserId);
  if (!target || actor.priority <= await authorization.getActorHighestRolePriority(communityId, target.userId)) return null;
  return { actor, target };
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
  const actor = await loadActor(String(ctx.from.id), communityId);
  if (!actor || !hasPermission(actor, PERMISSIONS.VIEW_MEMBERS)) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  const result = await members.list(communityId, 1);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`👥 Участники\n\n${community.name}\n\nВыберите участника:`, { reply_markup: membersKeyboard(communityId, result.members, 1, result.hasNext) });
});

bot.callbackQuery(/^members:page:(.+):([0-9]+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const page = Number(ctx.match[2]);
  const actor = await loadActor(String(ctx.from.id), communityId);
  if (!actor || !hasPermission(actor, PERMISSIONS.VIEW_MEMBERS) || !Number.isInteger(page) || page < 1) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  const community = await communities.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community) return void await ctx.answerCallbackQuery({ text: "⛔ Нет доступа", show_alert: true });
  const result = await members.list(communityId, page);
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`👥 Участники\n\n${community.name}\n\nВыберите участника:`, { reply_markup: membersKeyboard(communityId, result.members, page, result.hasNext) });
});

bot.callbackQuery(/^member:open:(.+):(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const memberId = ctx.match[2];
  const actor = await loadActor(String(ctx.from.id), communityId);
  if (!actor || !hasPermission(actor, PERMISSIONS.VIEW_MEMBERS)) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  const member = await members.find(communityId, memberId);
  if (!member) return void await ctx.answerCallbackQuery({ text: "Участник не найден", show_alert: true });
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(formatMemberProfile(member), { reply_markup: memberActionsKeyboard(communityId, memberId) });
});

bot.callbackQuery(/^moderation:open:(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const actor = await loadActor(String(ctx.from.id), communityId);
  if (!actor || !hasPermission(actor, PERMISSIONS.MANAGE_MEMBERS)) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  const community = await communities.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community) return void await ctx.answerCallbackQuery({ text: "⛔ Нет доступа", show_alert: true });
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(`🛡 Модерация\n\n${community.name}\n\nВыберите участника для управления или откройте журнал действий.`, { reply_markup: moderationMenuKeyboard(communityId) });
});

for (const [callback, permission, title] of [
  ["warn", PERMISSIONS.WARN_MEMBERS, "⚠️ Предупредить"],
  ["mute", PERMISSIONS.MUTE_MEMBERS, "🔇 Ограничить на 1 час"],
  ["ban", PERMISSIONS.BAN_MEMBERS, "🚫 Заблокировать"],
  ["unban", PERMISSIONS.BAN_MEMBERS, "↩️ Разблокировать"]
] as const) {
  bot.callbackQuery(new RegExp(`^member:${callback}:(.+):(.+)$`), async (ctx) => {
    const communityId = ctx.match[1];
    const memberId = ctx.match[2];
    const checked = await canModerate(String(ctx.from.id), communityId, memberId, permission);
    if (!checked) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
    await ctx.answerCallbackQuery();
    await ctx.editMessageText(`${title}?\n\nПользователь: ${checked.target.username ? `@${checked.target.username}` : checked.target.displayName}\n\nДействие будет записано в журнал.`, { reply_markup: moderationConfirmKeyboard(callback, communityId, memberId) });
  });
}

bot.callbackQuery(/^moderation:execute:(warn|mute|ban|unban):(.+):(.+)$/, async (ctx) => {
  const action = ctx.match[1];
  const communityId = ctx.match[2];
  const memberId = ctx.match[3];
  const permission = action === "warn" ? PERMISSIONS.WARN_MEMBERS : action === "mute" ? PERMISSIONS.MUTE_MEMBERS : PERMISSIONS.BAN_MEMBERS;
  const checked = await canModerate(String(ctx.from.id), communityId, memberId, permission);
  if (!checked) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  const community = await communities.getForTelegramUser(String(ctx.from.id), communityId);
  if (!community) return void await ctx.answerCallbackQuery({ text: "⛔ Сообщество недоступно", show_alert: true });
  const telegramUserId = Number(checked.target.telegramUserId);
  if (!Number.isSafeInteger(telegramUserId)) return void await ctx.answerCallbackQuery({ text: "Не удалось определить Telegram ID", show_alert: true });

  if (action === "warn") {
    await moderation.warn({ communityId, memberId: checked.target.id, actorUserId: checked.actor.userId });
  } else if (action === "mute") {
    await ctx.api.restrictChatMember(community.telegramChatId, telegramUserId, { can_send_messages: false, can_send_audios: false, can_send_documents: false, can_send_photos: false, can_send_videos: false, can_send_video_notes: false, can_send_voice_notes: false, can_send_polls: false, can_send_other_messages: false, can_add_web_page_previews: false }, { until_date: Math.floor(Date.now() / 1000) + 3600 });
    await moderation.logAction({ communityId, memberId: checked.target.id, actorUserId: checked.actor.userId, action: "MUTE", metadata: { durationSeconds: 3600 } });
  } else if (action === "ban") {
    await ctx.api.banChatMember(community.telegramChatId, telegramUserId);
    await moderation.logAction({ communityId, memberId: checked.target.id, actorUserId: checked.actor.userId, action: "BAN" });
  } else {
    await ctx.api.unbanChatMember(community.telegramChatId, telegramUserId, { only_if_banned: true });
    await moderation.logAction({ communityId, memberId: checked.target.id, actorUserId: checked.actor.userId, action: "UNBAN" });
  }

  await audit.write({ communityId, actorUserId: checked.actor.userId, targetUserId: checked.target.userId, action: `MODERATION_${action.toUpperCase()}`, metadata: action === "mute" ? { durationSeconds: 3600 } : undefined });
  await ctx.answerCallbackQuery({ text: "Готово" });
  await ctx.editMessageText(`✅ ${action === "warn" ? "Предупреждение выдано" : action === "mute" ? "Пользователь ограничен на 1 час" : action === "ban" ? "Пользователь заблокирован" : "Пользователь разблокирован"}.`, { reply_markup: moderationResultKeyboard(communityId, memberId) });
});

bot.callbackQuery(/^moderation:logs:(.+)$/, async (ctx) => {
  const communityId = ctx.match[1];
  const actor = await loadActor(String(ctx.from.id), communityId);
  if (!actor || !hasPermission(actor, PERMISSIONS.VIEW_LOGS)) return void await ctx.answerCallbackQuery({ text: accessDeniedText, show_alert: true });
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("📜 Журнал модерации\n\nДля v1.0 подробная фильтрация будет добавлена в Dashboard.", { reply_markup: moderationMenuKeyboard(communityId) });
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
