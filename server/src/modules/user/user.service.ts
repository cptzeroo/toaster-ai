import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument } from './schemas/user.schema';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(createUserDto: CreateUserDto) {
    const exists = await this.userRepository.existsByUsername(
      createUserDto.username,
    );

    if (exists) {
      throw new ConflictException(ERROR_MESSAGES.USER.USERNAME_EXISTS);
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const savedUser = await this.userRepository.create({
      ...createUserDto,
      username: createUserDto.username.toLowerCase(),
      password: hashedPassword,
    });

    const { password: _, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword;
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userRepository.findByUsername(username);
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userRepository.findById(id);
  }

  async validatePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async setTokenValidFrom(userId: string, date: Date): Promise<void> {
    await this.userRepository.updateTokenValidFrom(userId, date);
  }

  async invalidateTokens(userId: string): Promise<void> {
    await this.userRepository.updateTokenValidFrom(userId, new Date());
  }
}
