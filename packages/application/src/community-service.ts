import { NotFoundError } from "@community-os/domain";

export interface CommunityRepository {
  findById(communityId: string): Promise<{ id: string; telegramChatId: string; title: string; type: string; isActive: boolean } | null>;
  findByTelegramChatId(telegramChatId: string): Promise<{ id: string; telegramChatId: string; title: string; type: string; isActive: boolean } | null>;
  upsert(input: { telegramChatId: string; title: string; type: string }): Promise<{ id: string; telegramChatId: string; title: string; type: string; isActive: boolean }>;
}

export class CommunityService {
  constructor(private readonly communities: CommunityRepository) {}

  async getCommunity(communityId: string) {
    const community = await this.communities.findById(communityId);
    if (!community) throw new NotFoundError("Community");
    return community;
  }

  async registerTelegramCommunity(input: { telegramChatId: string; title: string; type: string }) {
    return this.communities.upsert(input);
  }
}
