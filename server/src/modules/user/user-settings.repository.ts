import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  UserSettings,
  UserSettingsDocument,
} from './schemas/user-settings.schema';

@Injectable()
export class UserSettingsRepository {
  constructor(
    @InjectModel(UserSettings.name)
    private settingsModel: Model<UserSettingsDocument>,
  ) {}

  /**
   * Get user settings, creating with defaults if none exist yet.
   */
  async findByUser(userId: string): Promise<UserSettingsDocument> {
    let settings = await this.settingsModel
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();

    if (!settings) {
      settings = await this.settingsModel.create({
        userId: new Types.ObjectId(userId),
      });
    }

    return settings;
  }

  async update(
    userId: string,
    data: Partial<Pick<UserSettings, 'defaultModel' | 'theme'>>,
  ): Promise<UserSettingsDocument> {
    const settings = await this.settingsModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $set: data },
        { new: true, upsert: true },
      )
      .exec();

    return settings!;
  }
}
