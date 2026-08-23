import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(() => 'mock-jwt-token'),
  };

  const mockPrismaService = {
    userSession: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    passwordResetToken: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
    $transaction: jest.fn(async (cb) => {
      if (Array.isArray(cb)) {
        for (const p of cb) await p;
      } else {
        await cb(mockPrismaService);
      }
    }),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('should return success message even if email not found (anti-enumeration)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      const res = await service.forgotPassword({ email: 'nonexistent@example.com' });
      expect(res.message).toContain('If an account with that email exists');
      expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should generate token and send email if user exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'user-1', email: 'test@example.com', accountStatus: 'ACTIVE' });
      mockPrismaService.passwordResetToken.create.mockResolvedValue({ id: 'token-1' });

      const res = await service.forgotPassword({ email: 'test@example.com' });
      expect(res.message).toContain('If an account with that email exists');
      expect(mockPrismaService.passwordResetToken.create).toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if token is invalid format', async () => {
      await expect(service.resetPassword({ token: 'invalid', newPassword: 'new' })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if token is not found or expired', async () => {
      mockPrismaService.passwordResetToken.findMany.mockResolvedValue([]);
      await expect(service.resetPassword({ token: 'user-1.rawtoken', newPassword: 'new' })).rejects.toThrow(BadRequestException);
    });
  });
});
