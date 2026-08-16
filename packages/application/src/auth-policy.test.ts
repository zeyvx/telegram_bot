import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "@community-os/domain";
import { authorize, canAccessCommunity } from "./auth-policy.js";
import type { AuthContext } from "./auth-context.js";

const context: AuthContext = {
  userId: "user-a",
  communityId: "community-a",
  permissions: new Set([PERMISSIONS.MANAGE_ROLES]),
  highestRolePriority: 900,
  telegramAdmin: true
};

describe("community authorization policy", () => {
  it("does not allow a user to cross tenant boundaries", () => {
    expect(canAccessCommunity(context, "community-b")).toBe(false);
    expect(authorize(context, "community-b", PERMISSIONS.MANAGE_ROLES)).toBe(false);
  });

  it("requires the requested permission", () => {
    expect(authorize(context, "community-a", PERMISSIONS.BAN_MEMBERS)).toBe(false);
  });

  it("allows the matching community and permission", () => {
    expect(authorize(context, "community-a", PERMISSIONS.MANAGE_ROLES)).toBe(true);
  });
});
