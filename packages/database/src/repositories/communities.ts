import { eq } from "drizzle-orm";
import { communities } from "../schema.js";

export function createCommunityRepository(db: any) {
  return {
    async findById(communityId: string) {
      const rows = await db.select().from(communities).where(eq(communities.id, communityId)).limit(1);
      return rows[0] ?? null;
    },

    async findByTelegramChatId(telegramChatId: string) {
      const rows = await db.select().from(communities).where(eq(communities.telegramChatId, telegramChatId)).limit(1);
      return rows[0] ?? null;
    },

    async upsert(input: { telegramChatId: string; title: string; type: string }) {
      const rows = await db.insert(communities).values({
        telegramChatId: input.telegramChatId,
        title: input.title,
        type: input.type
      }).onConflictDoUpdate({
        target: communities.telegramChatId,
        set: { title: input.title, type: input.type, isActive: true, updatedAt: new Date() }
      }).returning();

      return rows[0];
    }
  };
}
