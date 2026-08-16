import type { FastifyRequest } from "fastify";

export interface RequestAuth {
  userId: string;
}

declare module "fastify" {
  interface FastifyRequest {
    auth?: RequestAuth;
  }
}

export function getAuthenticatedUserId(request: FastifyRequest): string {
  const userId = request.auth?.userId;
  if (!userId) throw new Error("UNAUTHENTICATED");
  return userId;
}
