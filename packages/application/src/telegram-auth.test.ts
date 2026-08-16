import { describe, expect, it } from "vitest";
import { createHmac } from "node:crypto";
import { validateTelegramInitData } from "./telegram-auth.js";

function makeInitData(botToken: string, user: object, authDate: number) {
  const params = new URLSearchParams({
    auth_date: String(authDate),
    user: JSON.stringify(user)
  });
  const check = [...params.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secret).update(check).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

describe("Telegram Mini App authentication", () => {
  const token = "123456:test-token";
  const now = 1_000_000;
  const user = { id: 42, first_name: "Test", username: "tester" };

  it("accepts valid signed init data", () => {
    const result = validateTelegramInitData(makeInitData(token, user, now - 10), token, 300, now);
    expect(result.user.id).toBe(42);
  });

  it("rejects a modified payload", () => {
    const data = makeInitData(token, user, now - 10).replace("Test", "Attacker");
    expect(() => validateTelegramInitData(data, token, 300, now)).toThrow("INVALID_TELEGRAM_SIGNATURE");
  });

  it("rejects stale authentication data", () => {
    expect(() => validateTelegramInitData(makeInitData(token, user, now - 301), token, 300, now)).toThrow("EXPIRED_TELEGRAM_INIT_DATA");
  });
});
