import { count, eq } from "drizzle-orm";
import { roles } from "../schema.js";

export function createRoleQueryRepository(db: any) {
  return {
    async list(communityId: string, input: { offset: number; limit: number }) {
      const [items, totalRows] = await Promise.all([
        db.select({
          id: roles.id,
          name: roles.name,
          description: roles.description,
          priority: roles.priority,
          isSystem: roles.isSystem
        }).from(roles).where(eq(roles.communityId, communityId))
          .orderBy(roles.priority).limit(input.limit).offset(input.offset),
        db.select({ value: count() }).from(roles).where(eq(roles.communityId, communityId))
      ]);

      return { items, total: Number(totalRows[0]?.value ?? 0) };
    }
  };
}
