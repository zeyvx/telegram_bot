import { roles } from "../schema.js";
import { ROLE_PRIORITIES } from "@community-os/domain";

const DEFAULT_ROLES = [
  { name: "Owner", priority: ROLE_PRIORITIES.OWNER, managed: true, assignable: false, icon: "👑" },
  { name: "Administrator", priority: ROLE_PRIORITIES.ADMINISTRATOR, managed: true, assignable: false, icon: "🛡" },
  { name: "Moderator", priority: ROLE_PRIORITIES.MODERATOR, managed: false, assignable: true, icon: "🔨" },
  { name: "Helper", priority: ROLE_PRIORITIES.HELPER, managed: false, assignable: true, icon: "🤝" },
  { name: "VIP", priority: ROLE_PRIORITIES.VIP, managed: false, assignable: true, icon: "💎" },
  { name: "Veteran", priority: ROLE_PRIORITIES.VETERAN, managed: false, assignable: true, icon: "🏆" },
  { name: "Member", priority: ROLE_PRIORITIES.MEMBER, managed: true, assignable: false, icon: "👤" }
] as const;

export async function seedDefaultRoles(db: any, communityId: string) {
  for (const role of DEFAULT_ROLES) {
    await db.insert(roles).values({ communityId, ...role }).onConflictDoNothing();
  }
}
