import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import {
  UserSettings,
  UserSettingsSchema,
} from './schemas/user-settings.schema';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { UserSettingsRepository } from './user-settings.repository';
import { UserSettingsService } from './user-settings.service';
import { UserSettingsController } from './user-settings.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserSettings.name, schema: UserSettingsSchema },
    ]),
  ],
  controllers: [UserSettingsController],
  providers: [
    UserRepository,
    UserService,
    UserSettingsRepository,
    UserSettingsService,
  ],
  exports: [UserService, UserSettingsService],
})
export class UserModule {}
