import { eq } from "drizzle-orm";
import { users } from "../schema.js";

export function createUserRepository(db: any) {
  return {
    async upsertTelegramUser(input: { telegramId: string; username?: string; firstName: string; lastName?: string; languageCode?: string }) {
      const rows = await db.insert(users).values({
        telegramUserId: input.telegramId,
        username: input.username ?? null,
        firstName: input.firstName,
        lastName: input.lastName ?? null
      }).onConflictDoUpdate({
        target: users.telegramUserId,
        set: {
          username: input.username ?? null,
          firstName: input.firstName,
          lastName: input.lastName ?? null,
          updatedAt: new Date()
        }
      }).returning({ id: users.id, telegramId: users.telegramUserId });
      return rows[0];
    },

    async findByTelegramId(telegramId: string) {
      const rows = await db.select({ id: users.id, telegramId: users.telegramUserId })
        .from(users).where(eq(users.telegramUserId, telegramId)).limit(1);
      return rows[0] ?? null;
    }
  };
}
