import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ERROR_MESSAGES } from '@/common/constants/error-messages';

export interface JwtPayload {
  sub: string;
  username: string;
  exp?: number;
  iat?: number;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    username: string;
    name?: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const user = await this.userService.create(registerDto);

    const payload: JwtPayload = {
      sub: (user as any)._id.toString(),
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: (user as any)._id.toString(),
        username: user.username,
        name: user.name,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    this.logger.log(`Login attempt for username: ${loginDto.username}`);
    const user = await this.userService.findByUsername(loginDto.username);

    if (!user) {
      this.logger.warn(`Login failed - user not found: ${loginDto.username}`);
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await this.userService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      this.logger.warn(`Login failed - invalid password for: ${loginDto.username}`);
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      this.logger.warn(`Login failed - account disabled: ${loginDto.username}`);
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH.ACCOUNT_DISABLED);
    }

    const payload: JwtPayload = {
      sub: user._id.toString(),
      username: user.username,
    };

    // Sign token first, then set tokenValidFrom to match the token's iat
    const accessToken = this.jwtService.sign(payload);
    const decoded = this.jwtService.decode(accessToken) as JwtPayload;
    const tokenIssuedAt = new Date((decoded.iat || 0) * 1000);

    // Set tokenValidFrom to the token's iat so this token (and any newer) is valid
    await this.userService.setTokenValidFrom(user._id.toString(), tokenIssuedAt);

    this.logger.log(
      `Login successful for: ${loginDto.username} ` +
      `(tokenIat: ${tokenIssuedAt.toISOString()})`,
    );

    return {
      access_token: accessToken,
      user: {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
      },
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    this.logger.log(`Logout - invalidating tokens for userId: ${userId}`);
    await this.userService.invalidateTokens(userId);
    return { message: 'Logged out successfully' };
  }

  async isTokenValid(payload: JwtPayload): Promise<boolean> {
    const user = await this.userService.findById(payload.sub);

    if (!user) {
      this.logger.warn(`Token validation failed - user not found: ${payload.sub}`);
      return false;
    }

    if (!user.isActive) {
      this.logger.warn(`Token validation failed - account disabled: ${payload.username}`);
      return false;
    }

    // Check if token was issued before tokenValidFrom (meaning it's been invalidated)
    if (payload.iat && user.tokenValidFrom) {
      const tokenIssuedAt = new Date(payload.iat * 1000);
      if (tokenIssuedAt < user.tokenValidFrom) {
        this.logger.warn(
          `Token validation failed - token invalidated for: ${payload.username} ` +
          `(issued: ${tokenIssuedAt.toISOString()}, validFrom: ${user.tokenValidFrom.toISOString()})`,
        );
        return false;
      }
    }

    return true;
  }

  async validateToken(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    // Check if token was issued before tokenValidFrom
    if (payload.iat && user.tokenValidFrom) {
      const tokenIssuedAt = new Date(payload.iat * 1000);
      if (tokenIssuedAt < user.tokenValidFrom) {
        throw new UnauthorizedException(ERROR_MESSAGES.AUTH.TOKEN_INVALIDATED);
      }
    }

    return user;
  }
}
