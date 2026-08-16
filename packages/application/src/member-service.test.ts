import { describe, expect, it, vi } from "vitest";
import { MemberService } from "./member-service.js";

describe("MemberService", () => {
  it("rejects an unknown community member", async () => {
    const repository = { find: vi.fn().mockResolvedValue(null), upsert: vi.fn() };
    await expect(new MemberService(repository).getMember("c1", "u1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("reactivates/creates a member through the repository", async () => {
    const member = { id: "m1", communityId: "c1", userId: "u1", level: 1, xp: 0, warnings: 0, isActive: true };
    const repository = { find: vi.fn(), upsert: vi.fn().mockResolvedValue(member) };
    await expect(new MemberService(repository).ensureMember("c1", "u1")).resolves.toEqual(member);
  });
});
