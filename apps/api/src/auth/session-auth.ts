import type { FastifyReply, FastifyRequest } from "fastify";
import type { SessionService } from "@community-os/application";

export function registerSessionAuth(app: { addHook: (name: "preHandler", hook: (request: FastifyRequest, reply: FastifyReply) => Promise<void>) => void }, sessions: SessionService) {
  app.addHook("preHandler", async (request, reply) => {
    if (request.url === "/health" || request.url === "/api/v1/health" || request.url === "/api/v1/auth/telegram") return;

    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      await reply.code(401).send({ error: { code: "UNAUTHENTICATED", message: "Authentication required" } });
      return;
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token || token.length > 256) {
      await reply.code(401).send({ error: { code: "UNAUTHENTICATED", message: "Authentication required" } });
      return;
    }

    const session = await sessions.authenticate(token);
    if (!session || session.expiresAt.getTime() <= Date.now()) {
      await reply.code(401).send({ error: { code: "UNAUTHENTICATED", message: "Authentication required" } });
      return;
    }

    request.auth = { userId: session.userId };
  });
}
