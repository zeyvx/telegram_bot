import { NotFoundError } from "@community-os/domain";

export interface MemberRepository {
  find(communityId: string, userId: string): Promise<{ id: string; communityId: string; userId: string; level: number; xp: number; warnings: number; isActive: boolean } | null>;
  upsert(input: { communityId: string; userId: string }): Promise<{ id: string; communityId: string; userId: string; level: number; xp: number; warnings: number; isActive: boolean }>;
}

export class MemberService {
  constructor(private readonly members: MemberRepository) {}

  async getMember(communityId: string, userId: string) {
    const member = await this.members.find(communityId, userId);
    if (!member) throw new NotFoundError("Community member");
    return member;
  }

  async ensureMember(communityId: string, userId: string) {
    return this.members.upsert({ communityId, userId });
  }
}
