import { createHmac, timingSafeEqual } from "node:crypto";

export interface TelegramWebAppUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramInitData {
  user: TelegramWebAppUser;
  authDate: number;
  queryId?: string;
}

function hexHmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

export function validateTelegramInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 300,
  nowSeconds = Math.floor(Date.now() / 1000)
): TelegramInitData {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  const authDateRaw = params.get("auth_date");
  const userRaw = params.get("user");

  if (!hash || !authDateRaw || !userRaw) throw new Error("INVALID_TELEGRAM_INIT_DATA");

  const authDate = Number(authDateRaw);
  if (!Number.isInteger(authDate) || authDate <= 0 || nowSeconds - authDate > maxAgeSeconds || authDate > nowSeconds + 30) {
    throw new Error("EXPIRED_TELEGRAM_INIT_DATA");
  }

  const dataCheckString = [...params.entries()]
    .filter(([key]) => key !== "hash")
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = hexHmac("WebAppData", botToken);
  const expected = hexHmac(secretKey, dataCheckString);
  const received = Buffer.from(hash, "hex");

  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new Error("INVALID_TELEGRAM_SIGNATURE");
  }

  let user: TelegramWebAppUser;
  try {
    user = JSON.parse(userRaw) as TelegramWebAppUser;
  } catch {
    throw new Error("INVALID_TELEGRAM_USER");
  }

  if (!Number.isSafeInteger(user.id) || user.id <= 0) throw new Error("INVALID_TELEGRAM_USER");

  return {
    user,
    authDate,
    queryId: params.get("query_id") ?? undefined
  };
}
