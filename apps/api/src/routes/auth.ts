import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { validateTelegramInitData } from "@community-os/application";

const bodySchema = z.object({ initData: z.string().min(1).max(8192) });

export async function authRoutes(app: FastifyInstance) {
  app.post("/api/v1/auth/telegram", async (request, reply) => {
    const { initData } = bodySchema.parse(request.body);
    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      request.log.error("BOT_TOKEN is not configured");
      return reply.code(503).send({ error: { code: "AUTH_UNAVAILABLE", message: "Authentication is unavailable" } });
    }

    const telegram = validateTelegramInitData(initData, botToken);

    // Session issuance is intentionally a separate concern. No client-provided
    // community or role information is accepted by this endpoint.
    return {
      authenticated: true,
      telegramUser: telegram.user,
      authDate: telegram.authDate
    };
  });
}
