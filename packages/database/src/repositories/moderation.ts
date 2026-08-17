import { and, desc, eq, sql } from "drizzle-orm";
import { communityMembers, moderationActions, users, warnings } from "../schema.js";

export function createModerationRepository(db: any) {
  return {
    async warn(input: { communityId: string; memberId: string; actorUserId: string; reason?: string | null }) {
      const [warning] = await db.transaction(async (tx: any) => {
        const created = await tx.insert(warnings).values({
          communityId: input.communityId,
          memberId: input.memberId,
          actorUserId: input.actorUserId,
          reason: input.reason ?? null
        }).returning();
        await tx.update(communityMembers)
          .set({ warnings: sql`${communityMembers.warnings} + 1` })
          .where(and(eq(communityMembers.id, input.memberId), eq(communityMembers.communityId, input.communityId)));
        await tx.insert(moderationActions).values({
          communityId: input.communityId,
          targetMemberId: input.memberId,
          actorUserId: input.actorUserId,
          action: "WARN",
          metadata: { reason: input.reason ?? null }
        });
        return created;
      });
      return warning ?? null;
    },

    async logAction(input: { communityId: string; memberId?: string | null; actorUserId: string; action: string; metadata?: Record<string, unknown> }) {
      await db.insert(moderationActions).values({
        communityId: input.communityId,
        targetMemberId: input.memberId ?? null,
        actorUserId: input.actorUserId,
        action: input.action,
        metadata: input.metadata ?? null
      });
    },

    async listMemberActions(communityId: string, memberId: string, limit = 20) {
      return db.select({
        id: moderationActions.id,
        action: moderationActions.action,
        metadata: moderationActions.metadata,
        createdAt: moderationActions.createdAt,
        actorUsername: users.username
      }).from(moderationActions)
        .leftJoin(users, eq(users.id, moderationActions.actorUserId))
        .where(and(eq(moderationActions.communityId, communityId), eq(moderationActions.targetMemberId, memberId)))
        .orderBy(desc(moderationActions.createdAt))
        .limit(limit);
    }
  };
}
