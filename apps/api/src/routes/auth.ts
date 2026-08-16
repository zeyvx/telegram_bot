import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { validateTelegramInitData, type SessionService, type UserService } from "@community-os/application";

const bodySchema = z.object({ initData: z.string().min(1).max(8192) });

export interface TelegramAuthDependencies {
  users: UserService;
  sessions: SessionService;
}

export async function authRoutes(app: FastifyInstance, deps: TelegramAuthDependencies) {
  app.post("/api/v1/auth/telegram", async (request, reply) => {
    const { initData } = bodySchema.parse(request.body);
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      request.log.error("BOT_TOKEN is not configured");
      return reply.code(503).send({ error: { code: "AUTH_UNAVAILABLE", message: "Authentication is unavailable" } });
    }

    const telegram = validateTelegramInitData(initData, botToken);
    const user = await deps.users.syncTelegramUser({
      telegramId: String(telegram.user.id),
      username: telegram.user.username,
      firstName: telegram.user.first_name,
      lastName: telegram.user.last_name,
      languageCode: telegram.user.language_code
    });
    const session = await deps.sessions.create(user.id);

    return {
      authenticated: true,
      token: session.token,
      expiresAt: session.expiresAt,
      user: { id: user.id, telegramId: user.telegramId }
    };
  });
}
