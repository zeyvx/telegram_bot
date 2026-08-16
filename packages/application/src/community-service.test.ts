import { describe, expect, it, vi } from "vitest";
import { CommunityService } from "./community-service.js";

describe("CommunityService", () => {
  it("rejects unknown communities", async () => {
    const repository = { findById: vi.fn().mockResolvedValue(null), findByTelegramChatId: vi.fn(), upsert: vi.fn() };
    await expect(new CommunityService(repository).getCommunity("missing")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("registers a Telegram community through the repository", async () => {
    const community = { id: "c1", telegramChatId: "-1001", title: "Test", type: "supergroup", isActive: true };
    const repository = { findById: vi.fn(), findByTelegramChatId: vi.fn(), upsert: vi.fn().mockResolvedValue(community) };
    await expect(new CommunityService(repository).registerTelegramCommunity({ telegramChatId: "-1001", title: "Test", type: "supergroup" })).resolves.toEqual(community);
  });
});
