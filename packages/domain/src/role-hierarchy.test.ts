import { describe, expect, it } from "vitest";
import { canAssignRole, canManageRole } from "./role-hierarchy.js";

describe("role hierarchy", () => {
  it("allows a higher role to manage a lower role", () => {
    expect(canManageRole(900, 700)).toBe(true);
  });

  it("does not allow equal roles to manage each other", () => {
    expect(canManageRole(700, 700)).toBe(false);
  });

  it("does not allow a lower role to manage a higher role", () => {
    expect(canManageRole(700, 900)).toBe(false);
  });

  it("requires both permission and hierarchy for assignment", () => {
    expect(canAssignRole(700, 300, true)).toBe(true);
    expect(canAssignRole(700, 300, false)).toBe(false);
    expect(canAssignRole(300, 700, true)).toBe(false);
  });
});
