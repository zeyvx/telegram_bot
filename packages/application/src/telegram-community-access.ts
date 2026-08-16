import type { AuthContextLoader } from "./auth-context.js";

export interface TelegramMembershipRepository {
  isActiveMember(communityId: string, userId: string): Promise<boolean>;
  isTelegramAdmin(communityId: string, userId: string): Promise<boolean>;
}

export class TelegramCommunityAccessLoader implements AuthContextLoader {
  constructor(
    private readonly memberships: TelegramMembershipRepository,
    private readonly authorization: { getActorPermissions(communityId: string, userId: string): Promise<ReadonlySet<any>>; getActorHighestRolePriority(communityId: string, userId: string): Promise<number> }
  ) {}

  async load(input: { userId: string; communityId: string }) {
    if (!(await this.memberships.isActiveMember(input.communityId, input.userId))) return null;
    const [permissions, highestRolePriority, telegramAdmin] = await Promise.all([
      this.authorization.getActorPermissions(input.communityId, input.userId),
      this.authorization.getActorHighestRolePriority(input.communityId, input.userId),
      this.memberships.isTelegramAdmin(input.communityId, input.userId)
    ]);
    return { userId: input.userId, communityId: input.communityId, permissions, highestRolePriority, telegramAdmin };
  }
}
