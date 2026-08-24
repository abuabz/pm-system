import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogsService } from './audit-logs.service';
import { PrismaService } from '../database/prisma.service';

describe('AuditLogsService', () => {
  let service: AuditLogsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogsService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuditLogsService>(AuditLogsService);
  });

  describe('sanitizeData', () => {
    it('should recursively strip sensitive keys', () => {
      const input = {
        name: 'Test Task',
        password: 'supersecretpassword123!',
        nested: {
          refreshToken: 'token...',
          accessToken: 'token...',
          safe: 'data',
        },
        arr: [{ passwordHash: 'hash...' }],
      };

      const result = service.sanitizeData(input);

      expect(result.password).toBe('[REDACTED]');
      expect(result.name).toBe('Test Task');
      expect(result.nested.refreshToken).toBe('[REDACTED]');
      expect(result.nested.accessToken).toBe('[REDACTED]');
      expect(result.nested.safe).toBe('data');
      expect(result.arr[0].passwordHash).toBe('[REDACTED]');
    });
  });
});
