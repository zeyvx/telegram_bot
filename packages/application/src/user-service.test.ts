import { describe, expect, it } from "vitest";
import { UserService, type UserRepository } from "./user-service.js";

describe("UserService", () => {
  it("syncs Telegram identity without trusting client-side user ids", async () => {
    let received: Parameters<UserRepository["upsertTelegramUser"]>[0] | undefined;
    const service = new UserService({
      async upsertTelegramUser(input) {
        received = input;
        return { id: "user-1", telegramId: input.telegramId };
      }
    });

    const user = await service.syncTelegramUser({
      telegramId: "123",
      firstName: "Test",
      username: "tester"
    });

    expect(user).toEqual({ id: "user-1", telegramId: "123" });
    expect(received?.telegramId).toBe("123");
  });
});
