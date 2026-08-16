import { loadConfig } from "@community-os/config";
import { buildApp } from "./app.js";

const config = loadConfig();
const app = buildApp();

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.error(error, "failed to start API");
  process.exit(1);
}
