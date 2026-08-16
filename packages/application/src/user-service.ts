export interface UserRepository {
  upsertTelegramUser(input: { telegramId: string; username?: string; firstName: string; lastName?: string; languageCode?: string }): Promise<{ id: string; telegramId: string }>;
}

export class UserService {
  constructor(private readonly users: UserRepository) {}

  async syncTelegramUser(input: { telegramId: string; username?: string; firstName: string; lastName?: string; languageCode?: string }) {
    return this.users.upsertTelegramUser(input);
  }
}
