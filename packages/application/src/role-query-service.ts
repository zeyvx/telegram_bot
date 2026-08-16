import { NotFoundError } from "@community-os/domain";

export interface RoleQueryRepository {
  list(communityId: string, input: { offset: number; limit: number }): Promise<{
    items: Array<{ id: string; name: string; description: string | null; priority: number; isSystem: boolean }>;
    total: number;
  }>;
}

export class RoleQueryService {
  constructor(private readonly roles: RoleQueryRepository) {}

  async listRoles(communityId: string, page: number, limit: number) {
    if (page < 1 || limit < 1 || limit > 100) {
      throw new NotFoundError("Role query");
    }

    const result = await this.roles.list(communityId, {
      offset: (page - 1) * limit,
      limit
    });

    return {
      data: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit)
      }
    };
  }
}
