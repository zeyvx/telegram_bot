import { describe, expect, it } from "vitest";
import { SessionService, type SessionRepository } from "./session-service.js";

function repository(): SessionRepository & { tokenHash?: string } {
  let record: { userId: string; tokenHash: string; expiresAt: Date } | undefined;
  return {
    async create(input) {
      record = input;
      return { id: "session-1", expiresAt: input.expiresAt };
    },
    async revokeByTokenHash(tokenHash) {
      if (record?.tokenHash === tokenHash) record = undefined;
    },
    async findActiveByTokenHash(tokenHash) {
      if (!record || record.tokenHash !== tokenHash) return null;
      return { userId: record.userId, expiresAt: record.expiresAt };
    }
  };
}

describe("SessionService", () => {
  it("creates an opaque token and authenticates it by hash", async () => {
    const repo = repository();
    const service = new SessionService(repo);
    const created = await service.create("user-1");
    expect(created.token).toHaveLength(43);
    expect(await service.authenticate(created.token)).toMatchObject({ userId: "user-1" });
  });

  it("rejects an unknown token", async () => {
    const service = new SessionService(repository());
    expect(await service.authenticate("unknown")).toBeNull();
  });
});
