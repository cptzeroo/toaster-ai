import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<Omit<User, 'password'> & { _id: any }> {
    const existingUser = await this.userModel
      .findOne({ username: createUserDto.username.toLowerCase() })
      .exec();

    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = new this.userModel({
      ...createUserDto,
      username: createUserDto.username.toLowerCase(),
      password: hashedPassword,
    });

    const savedUser = await user.save();

    // Return user without password (using Omit type to exclude password)
    const { password: _, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword as Omit<User, 'password'> & { _id: any };
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

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async invalidateTokens(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      tokenValidFrom: new Date(),
    });
  }
}
