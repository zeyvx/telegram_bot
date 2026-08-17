import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";

describe("API hardening", () => {
  it("exposes liveness and versioned health endpoints", async () => {
    const app = buildApp();

    const health = await app.inject({ method: "GET", url: "/health" });
    expect(health.statusCode).toBe(200);
    expect(health.json()).toEqual({ status: "ok" });

    const versioned = await app.inject({ method: "GET", url: "/api/v1/health" });
    expect(versioned.statusCode).toBe(200);
    expect(versioned.json()).toEqual({ status: "ok", version: "v1" });

    await app.close();
  });

  it("returns a stable error envelope for invalid route parameters", async () => {
    const app = buildApp();
    const response = await app.inject({
      method: "GET",
      url: "/api/v1/communities/not-a-uuid/roles"
    });

    expect(response.statusCode).toBe(400);
    expect(response.json().error.code).toBe("REQUEST_ERROR");
    expect(typeof response.json().error.requestId).toBe("string");

    await app.close();
  });
});
