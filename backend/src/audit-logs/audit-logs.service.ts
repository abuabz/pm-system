import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';

export interface AuditLogEventPayload {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);
  // Sensitive keys that must never be logged
  private readonly SENSITIVE_KEYS = [
    'password',
    'passwordHash',
    'refreshToken',
    'accessToken',
    'secret',
  ];

  constructor(private prisma: PrismaService) {}

  @OnEvent('audit.log')
  async handleAuditLogEvent(payload: AuditLogEventPayload) {
    try {
      const sanitizedChanges = this.sanitizeData(payload.changes);

      await this.prisma.auditLog.create({
        data: {
          userId: payload.userId,
          action: payload.action,
          entityType: payload.entityType,
          entityId: payload.entityId,
          changes: sanitizedChanges || {},
          ipAddress: payload.ipAddress,
          userAgent: payload.userAgent,
        },
      });
    } catch (error) {
      // We don't want audit log failures to crash the application, just log them
      this.logger.error(
        `Failed to create audit log for action ${payload.action}`,
        error.stack,
      );
    }
  }

  /**
   * Recursively removes sensitive keys from an object
   */
  sanitizeData(data: any): any {
    if (!data) return data;

    // Handle Arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    // Handle Objects
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (
          this.SENSITIVE_KEYS.some((sensitiveKey) =>
            key.toLowerCase().includes(sensitiveKey.toLowerCase()),
          )
        ) {
          sanitized[key] = '[REDACTED]';
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      }
      return sanitized;
    }

    return data;
  }
}
