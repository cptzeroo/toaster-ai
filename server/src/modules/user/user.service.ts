import { Injectable, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UserDocument } from './schemas/user.schema';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  /** Generate a random opaque directory name (16-char hex). */
  private generateDataDir(): string {
    return crypto.randomBytes(8).toString('hex');
  }

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
      dataDir: this.generateDataDir(),
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

  /**
   * Get the opaque data directory name for a user.
   */
  async getDataDir(userId: string): Promise<string> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    if (!user.dataDir) {
      throw new Error(`User ${userId} has no dataDir assigned`);
    }
    return user.dataDir;
  }

  /**
   * Find user by their opaque data directory name.
   * Used during startup to map disk folders back to users.
   */
  async findByDataDir(dataDir: string): Promise<UserDocument | null> {
    return this.userRepository.findByDataDir(dataDir);
  }
}
