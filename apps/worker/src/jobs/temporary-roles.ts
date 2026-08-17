import { and, isNotNull, lte, eq } from "drizzle-orm";
import { memberRoles, communityMembers, auditLogs } from "@community-os/database";

export async function expireTemporaryRoles(db: any, now = new Date()) {
  const expired = await db.select({
    memberId: memberRoles.memberId,
    roleId: memberRoles.roleId,
    communityId: communityMembers.communityId,
    userId: communityMembers.userId,
    expiresAt: memberRoles.expiresAt
  })
    .from(memberRoles)
    .innerJoin(communityMembers, eq(communityMembers.id, memberRoles.memberId))
    .where(and(isNotNull(memberRoles.expiresAt), lte(memberRoles.expiresAt, now)));

  if (!expired.length) return 0;

  await db.transaction(async (tx: any) => {
    for (const item of expired) {
      await tx.delete(memberRoles).where(and(
        eq(memberRoles.memberId, item.memberId),
        eq(memberRoles.roleId, item.roleId),
        lte(memberRoles.expiresAt, now)
      ));
      await tx.insert(auditLogs).values({
        communityId: item.communityId,
        actorUserId: null,
        targetUserId: item.userId,
        action: "ROLE_EXPIRED",
        metadata: { roleId: item.roleId, expiresAt: item.expiresAt?.toISOString() }
      });
    }
  });

  return expired.length;
}
