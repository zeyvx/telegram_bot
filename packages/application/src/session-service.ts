import { randomBytes, createHash } from "node:crypto";

export interface SessionRepository {
  create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<{ id: string; expiresAt: Date }>;
  revokeByTokenHash(tokenHash: string): Promise<void>;
  findActiveByTokenHash(tokenHash: string): Promise<{ userId: string; expiresAt: Date } | null>;
}

export class SessionService {
  constructor(private readonly sessions: SessionRepository) {}

  async create(userId: string, ttlSeconds = 86400) {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const session = await this.sessions.create({ userId, tokenHash, expiresAt });
    return { token, ...session };
  }

  async authenticate(token: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    return this.sessions.findActiveByTokenHash(tokenHash);
  }

  async revoke(token: string) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await this.sessions.revokeByTokenHash(tokenHash);
  }
}
