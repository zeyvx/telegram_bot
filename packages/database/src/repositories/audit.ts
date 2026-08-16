import { auditLogs } from "../schema.js";

export function createAuditLogRepository(db: any) {
  return {
    async write(input: {
      communityId: string;
      actorUserId: string;
      targetUserId?: string;
      action: string;
      metadata?: Record<string, unknown>;
    }): Promise<void> {
      await db.insert(auditLogs).values({
        communityId: input.communityId,
        actorUserId: input.actorUserId,
        targetUserId: input.targetUserId,
        action: input.action,
        metadata: input.metadata ?? null
      });
    }
  };
}
