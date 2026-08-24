import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { MailService } from '../mail/mail.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: MailService,
    private eventEmitter: EventEmitter2,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (
      user &&
      user.accountStatus === 'ACTIVE' &&
      (await bcrypt.compare(pass, user.passwordHash))
    ) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, ip: string, userAgent: string) {
    const payload = { email: user.email, sub: user.id };

    // Generate tokens
    const accessToken = this.jwtService.sign(payload);
    const randomHex = crypto.randomBytes(40).toString('hex');
    const refreshToken = `${user.id}.${randomHex}`;
    const refreshHash = await bcrypt.hash(randomHex, 10);

    // Calculate expiration for refresh token (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in db
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: refreshHash,
        ipAddress: ip,
        userAgent,
        expiresAt,
      },
    });

    this.eventEmitter.emit('audit.log', {
      userId: user.id,
      action: 'LOGIN',
      entityType: 'UserSession',
      entityId: user.id,
    });

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash: registerDto.password, // UsersService will hash it
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...result } = user;
    return result;
  }

  async refreshTokens(refreshToken: string, ip: string, userAgent: string) {
    const parts = refreshToken.split('.');
    if (parts.length !== 2) {
      throw new UnauthorizedException('Invalid refresh token format');
    }
    const [userId, randomHex] = parts;

    // Find all active sessions for this user
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    // Find the session that matches the old refresh token
    let targetSessionId: string | null = null;
    for (const session of sessions) {
      if (await bcrypt.compare(randomHex, session.refreshToken)) {
        targetSessionId = session.id;
        break;
      }
    }

    if (!targetSessionId) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Generate new tokens
    const user = await this.usersService.findById(userId);
    if (!user || user.accountStatus !== 'ACTIVE') {
      throw new UnauthorizedException('User inactive or deleted');
    }

    const payload = { email: user.email, sub: user.id };
    const newAccessToken = this.jwtService.sign(payload);
    const newRandomHex = crypto.randomBytes(40).toString('hex');
    const newRefreshToken = `${user.id}.${newRandomHex}`;
    const newRefreshHash = await bcrypt.hash(newRandomHex, 10);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Rotate the token (update the existing session)
    await this.prisma.userSession.update({
      where: { id: targetSessionId },
      data: {
        refreshToken: newRefreshHash,
        ipAddress: ip,
        userAgent,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const parts = refreshToken.split('.');
    if (parts.length !== 2) return { success: true };
    const [userId, randomHex] = parts;

    const sessions = await this.prisma.userSession.findMany({
      where: { userId },
    });

    for (const session of sessions) {
      if (await bcrypt.compare(randomHex, session.refreshToken)) {
        await this.prisma.userSession.delete({
          where: { id: session.id },
        });

        this.eventEmitter.emit('audit.log', {
          userId: session.userId,
          action: 'LOGOUT',
          entityType: 'UserSession',
          entityId: session.userId,
        });

        break;
      }
    }
    return { success: true };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    // Anti-enumeration: always return success
    if (!user || user.accountStatus !== 'ACTIVE') {
      return {
        message:
          'If an account with that email exists, a reset link has been sent.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
      },
    });

    // We pass `${user.id}.${rawToken}` so we know who to look up
    const emailToken = `${user.id}.${rawToken}`;
    await this.mailService.sendPasswordResetEmail(user.email, emailToken);

    return {
      message:
        'If an account with that email exists, a reset link has been sent.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const parts = resetPasswordDto.token.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid token format');
    }
    const [userId, rawToken] = parts;

    // Find active tokens for this user
    const tokens = await this.prisma.passwordResetToken.findMany({
      where: {
        userId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    let targetTokenId: string | null = null;
    for (const token of tokens) {
      if (await bcrypt.compare(rawToken, token.token)) {
        targetTokenId = token.id;
        break;
      }
    }

    if (!targetTokenId) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Token is valid. Hash new password.
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(resetPasswordDto.newPassword, salt);

    // Run updates in a transaction
    await this.prisma.$transaction([
      // 1. Mark token as used
      this.prisma.passwordResetToken.update({
        where: { id: targetTokenId },
        data: { usedAt: new Date() },
      }),
      // 2. Update user password
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      // 3. Invalidate all active sessions
      this.prisma.userSession.deleteMany({
        where: { userId },
      }),
    ]);

    return { message: 'Password has been reset successfully. Please log in.' };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new BadRequestException('Incorrect current password');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(changePasswordDto.newPassword, salt);

    await this.prisma.$transaction([
      // Update password
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      // Invalidate other sessions to secure account
      this.prisma.userSession.deleteMany({
        where: { userId },
      }),
    ]);

    return {
      message:
        'Password changed successfully. All sessions have been logged out.',
    };
  }
}
