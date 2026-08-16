import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "./permissions.js";
import { authorizeRoleAssignment, canManageTargetRole } from "./authorization.js";

const base = {
  communityId: "community-a",
  actorUserId: "user-a",
  actorHighestRolePriority: 700,
  actorPermissions: new Set([PERMISSIONS.ASSIGN_ROLES])
};

describe("authorization", () => {
  it("rejects cross-community targets", () => {
    expect(canManageTargetRole(base, { communityId: "community-b", priority: 100 })).toBe(false);
  });

  it("rejects an equal or higher role", () => {
    expect(canManageTargetRole(base, { communityId: "community-a", priority: 700 })).toBe(false);
    expect(canManageTargetRole(base, { communityId: "community-a", priority: 900 })).toBe(false);
  });

  it("requires the explicit permission", () => {
    expect(authorizeRoleAssignment(base, PERMISSIONS.MANAGE_ROLES, { communityId: "community-a", priority: 300 })).toBe(false);
  });

  it("allows a permitted actor to assign a lower role in the same community", () => {
    expect(authorizeRoleAssignment(base, PERMISSIONS.ASSIGN_ROLES, { communityId: "community-a", priority: 300 })).toBe(true);
  });
});
