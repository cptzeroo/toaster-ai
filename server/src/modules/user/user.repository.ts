import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserRepository {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(data: Partial<User>): Promise<UserDocument> {
    const user = new this.userModel(data);
    return user.save();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ username: username.toLowerCase() })
      .select('+password')
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async existsByUsername(username: string): Promise<boolean> {
    const user = await this.userModel
      .findOne({ username: username.toLowerCase() })
      .exec();
    return !!user;
  }

  async updateTokenValidFrom(userId: string, date: Date): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      tokenValidFrom: date,
    });
  }
}
