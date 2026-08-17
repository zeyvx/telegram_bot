import { and, desc, eq } from "drizzle-orm";
import { auditLogs, users } from "../schema.js";

export function createAuditLogRepository(db: any) {
  return {
    async write(input: {
      communityId: string;
      actorUserId?: string | null;
      targetUserId?: string | null;
      action: string;
      metadata?: Record<string, unknown>;
    }): Promise<void> {
      await db.insert(auditLogs).values({
        communityId: input.communityId,
        actorUserId: input.actorUserId ?? null,
        targetUserId: input.targetUserId ?? null,
        action: input.action,
        metadata: input.metadata ?? null
      });
    },

    async listForCommunity(communityId: string, page = 1, pageSize = 25) {
      const safePage = Math.max(1, page);
      const safeSize = Math.min(100, Math.max(1, pageSize));
      const rows = await db.select({
        id: auditLogs.id,
        action: auditLogs.action,
        metadata: auditLogs.metadata,
        createdAt: auditLogs.createdAt,
        actorUserId: auditLogs.actorUserId,
        targetUserId: auditLogs.targetUserId,
        actorUsername: users.username
      })
        .from(auditLogs)
        .leftJoin(users, eq(users.id, auditLogs.actorUserId))
        .where(eq(auditLogs.communityId, communityId))
        .orderBy(desc(auditLogs.createdAt))
        .limit(safeSize + 1)
        .offset((safePage - 1) * safeSize);

      return {
        entries: rows.slice(0, safeSize),
        hasNext: rows.length > safeSize
      };
    }
  };
}
