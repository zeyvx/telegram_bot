import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { communityRoutes } from "./routes/communities.js";
import { memberRoutes } from "./routes/members.js";
import { roleRoutes } from "./routes/roles.js";

type Dependencies = { db: any; botToken: string };

export function buildApp(deps?: Dependencies) {
  const app = Fastify({ logger: true, requestIdHeader: "x-request-id", trustProxy: true });
  void app.register(helmet);
  void app.register(rateLimit, { max: 120, timeWindow: "1 minute" });

  if (deps) {
    void app.register(communityRoutes, deps);
    void app.register(memberRoutes, deps);
    void app.register(roleRoutes, deps);
  }

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/api/v1/health", async () => ({ status: "ok", version: "v1" }));

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "request failed");
    const statusCode = error.message.startsWith("TELEGRAM_AUTH_") || error.message.startsWith("TELEGRAM_USER_") ? 401 : (error.statusCode ?? 500);
    return reply.status(statusCode).send({
      error: {
        code: statusCode === 401 ? "UNAUTHORIZED" : statusCode < 500 ? "REQUEST_ERROR" : "INTERNAL_ERROR",
        message: statusCode < 500 ? error.message : "Internal server error",
        requestId: request.id
      }
    });
  });
  return app;
}
