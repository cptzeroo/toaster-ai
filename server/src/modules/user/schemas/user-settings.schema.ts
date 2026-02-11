import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserSettingsDocument = HydratedDocument<UserSettings>;

@Schema({ timestamps: true, collection: 'userSettings' })
export class UserSettings {
  @Prop({ type: Types.ObjectId, required: true, unique: true, index: true })
  userId: Types.ObjectId;

  @Prop({ default: 'gemini-2.0-flash' })
  defaultModel: string;

  @Prop({ default: 'dark' })
  theme: string;
}

export const UserSettingsSchema = SchemaFactory.createForClass(UserSettings);
