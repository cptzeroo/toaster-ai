import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ trim: true })
  name: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date, default: Date.now })
  tokenValidFrom: Date;

  /** Super admin has access to all features and admin endpoints */
  @Prop({ default: false })
  isSuperAdmin: boolean;

  /** When true, login does not invalidate previous tokens (multi-device support) */
  @Prop({ default: false })
  allowMultiSession: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
