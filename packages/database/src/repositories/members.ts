import { and, eq } from "drizzle-orm";
import { communityMembers } from "../schema.js";

export function createMemberRepository(db: any) {
  return {
    async find(communityId: string, userId: string) {
      const rows = await db.select().from(communityMembers).where(
        and(eq(communityMembers.communityId, communityId), eq(communityMembers.userId, userId))
      ).limit(1);
      return rows[0] ?? null;
    },

    async upsert(input: { communityId: string; userId: string }) {
      const rows = await db.insert(communityMembers).values({
        communityId: input.communityId,
        userId: input.userId,
        isActive: true
      }).onConflictDoUpdate({
        target: [communityMembers.communityId, communityMembers.userId],
        set: { isActive: true }
      }).returning();
      return rows[0];
    }
  };
}
