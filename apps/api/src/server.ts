import { loadConfig } from "@community-os/config";
import { createDatabase } from "@community-os/database";
import { buildApp } from "./app.js";

const config = loadConfig();
const { db, client } = createDatabase(config.DATABASE_URL);
const app = buildApp({ db, botToken: config.TELEGRAM_BOT_TOKEN });

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.error(error, "failed to start API");
  await client.end({ timeout: 5 }).catch(() => undefined);
  process.exit(1);
}

const shutdown = async () => {
  await app.close();
  await client.end({ timeout: 5 });
};
process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
