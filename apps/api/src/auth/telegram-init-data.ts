import { createHmac, timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";

export type TelegramIdentity = {
  telegramUserId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

function hexEqual(left: string, right: string) {
  const a = Buffer.from(left, "hex");
  const b = Buffer.from(right, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function validateTelegramInitData(initData: string, botToken: string, maxAgeSeconds = 3600): TelegramIdentity {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) throw new Error("TELEGRAM_AUTH_HASH_MISSING");

  const authDate = Number(params.get("auth_date"));
  const now = Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(authDate) || now - authDate > maxAgeSeconds || authDate > now + 30) {
    throw new Error("TELEGRAM_AUTH_EXPIRED");
  }

  params.delete("hash");
  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  if (!hexEqual(calculatedHash, receivedHash)) throw new Error("TELEGRAM_AUTH_INVALID");

  const rawUser = params.get("user");
  if (!rawUser) throw new Error("TELEGRAM_USER_MISSING");
  const user = JSON.parse(rawUser) as { id?: number; username?: string; first_name?: string; last_name?: string };
  if (!user.id) throw new Error("TELEGRAM_USER_INVALID");

  return { telegramUserId: String(user.id), username: user.username, firstName: user.first_name, lastName: user.last_name };
}

export function getTelegramIdentity(request: FastifyRequest, botToken: string): TelegramIdentity {
  const header = request.headers["x-telegram-init-data"];
  if (typeof header !== "string" || !header) throw new Error("TELEGRAM_AUTH_REQUIRED");
  return validateTelegramInitData(header, botToken);
}
