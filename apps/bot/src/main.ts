import { Bot, webhookCallback } from "grammy";
import { loadConfig } from "@community-os/config";
import Fastify from "fastify";

const config = loadConfig();
const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

bot.command("start", async (ctx) => {
  await ctx.reply(
    "Community OS подключён. Для управления сообществом используйте Dashboard."
  );
});

bot.on("my_chat_member", async (ctx) => {
  const chat = ctx.chat;
  ctx.log.info?.({ chatId: chat.id }, "bot membership status changed");
});

const app = Fastify({ logger: true });
app.post("/telegram/webhook", async (request, reply) => {
  const secret = request.headers["x-telegram-bot-api-secret-token"];
  if (secret !== config.TELEGRAM_WEBHOOK_SECRET) {
    return reply.code(401).send({ error: "Unauthorized" });
  }

  return webhookCallback(bot, "fastify")(request, reply);
});

await app.listen({ host: config.API_HOST, port: config.API_PORT + 1 });
