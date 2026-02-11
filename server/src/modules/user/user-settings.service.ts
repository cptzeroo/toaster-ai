import { Injectable, Logger } from '@nestjs/common';
import { UserSettingsRepository } from './user-settings.repository';
import { UserSettingsDocument } from './schemas/user-settings.schema';

@Injectable()
export class UserSettingsService {
  private readonly logger = new Logger(UserSettingsService.name);

  constructor(
    private readonly settingsRepository: UserSettingsRepository,
  ) {}

  async getSettings(userId: string): Promise<UserSettingsDocument> {
    return this.settingsRepository.findByUser(userId);
  }

  async updateSettings(
    userId: string,
    data: { defaultModel?: string; theme?: string },
  ): Promise<UserSettingsDocument> {
    this.logger.log(
      `Updating settings for user ${userId}: ${JSON.stringify(data)}`,
    );
    return this.settingsRepository.update(userId, data);
  }
}
