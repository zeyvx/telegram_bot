import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "./permissions.js";
import { canAssignRole, canCreateRole, canDeleteRole, canEditRole, canRemoveRole } from "./role-management.js";

const subject = {
  communityId: "community-1",
  actorUserId: "actor-1",
  actorHighestRolePriority: 700,
  actorPermissions: new Set([
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.REMOVE_ROLES
  ])
};

describe("role management authorization", () => {
  it("does not allow managing an equal or higher role", () => {
    expect(canCreateRole(subject, PERMISSIONS.MANAGE_ROLES, 700)).toBe(false);
    expect(canCreateRole(subject, PERMISSIONS.MANAGE_ROLES, 900)).toBe(false);
    expect(canEditRole(subject, PERMISSIONS.MANAGE_ROLES, { communityId: "community-1", priority: 700 })).toBe(false);
  });

  it("allows managing a lower role in the same community", () => {
    expect(canCreateRole(subject, PERMISSIONS.MANAGE_ROLES, 600)).toBe(true);
    expect(canEditRole(subject, PERMISSIONS.MANAGE_ROLES, { communityId: "community-1", priority: 600 }, 500)).toBe(true);
    expect(canDeleteRole(subject, PERMISSIONS.MANAGE_ROLES, { communityId: "community-1", priority: 600, managed: false })).toBe(true);
  });

  it("blocks cross-community role management", () => {
    const role = { communityId: "community-2", priority: 100 };
    expect(canEditRole(subject, PERMISSIONS.MANAGE_ROLES, role)).toBe(false);
    expect(canDeleteRole(subject, PERMISSIONS.MANAGE_ROLES, { ...role, managed: false })).toBe(false);
  });

  it("blocks assignment of managed or non-assignable roles", () => {
    expect(canAssignRole(subject, { communityId: "community-1", priority: 600, assignable: false })).toBe(false);
    expect(canAssignRole(subject, { communityId: "community-1", priority: 700, assignable: true })).toBe(false);
    expect(canAssignRole(subject, { communityId: "community-1", priority: 600, assignable: true })).toBe(true);
  });

  it("requires the matching permission for removal", () => {
    expect(canRemoveRole(subject, { communityId: "community-1", priority: 600 })).toBe(true);
    expect(canRemoveRole({ ...subject, actorPermissions: new Set() }, { communityId: "community-1", priority: 600 })).toBe(false);
  });
});
