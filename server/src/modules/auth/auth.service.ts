import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

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
    const user = await this.userService.findByUsername(loginDto.username);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.userService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const payload: JwtPayload = {
      sub: user._id.toString(),
      username: user.username,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
      },
    };
  }

  async logout(userId: string): Promise<{ message: string }> {
    // Update tokenValidFrom to invalidate all existing tokens
    await this.userService.invalidateTokens(userId);
    return { message: 'Logged out successfully' };
  }

  async isTokenValid(payload: JwtPayload): Promise<boolean> {
    const user = await this.userService.findById(payload.sub);

    if (!user || !user.isActive) {
      return false;
    }

    // Check if token was issued before tokenValidFrom (meaning it's been invalidated)
    if (payload.iat && user.tokenValidFrom) {
      const tokenIssuedAt = new Date(payload.iat * 1000);
      if (tokenIssuedAt < user.tokenValidFrom) {
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
        throw new UnauthorizedException('Token has been invalidated');
      }
    }

    return user;
  }
}
