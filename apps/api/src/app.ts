import Fastify from "fastify";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { communityRoutes } from "./routes/communities.js";

export function buildApp() {
  const app = Fastify({
    logger: true,
    requestIdHeader: "x-request-id",
    trustProxy: true
  });

  void app.register(helmet);
  void app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute"
  });
  void app.register(communityRoutes);

  app.get("/health", async () => ({ status: "ok" }));
  app.get("/api/v1/health", async () => ({ status: "ok", version: "v1" }));

  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "request failed");
    return reply.status(error.statusCode ?? 500).send({
      error: {
        code: error.statusCode && error.statusCode < 500 ? "REQUEST_ERROR" : "INTERNAL_ERROR",
        message: error.statusCode && error.statusCode < 500 ? error.message : "Internal server error",
        requestId: request.id
      }
    });
  });

  return app;
}
