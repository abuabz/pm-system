import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLogEventPayload } from '../../audit-logs/audit-logs.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private eventEmitter: EventEmitter2) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;

    // We only automatically audit mutable operations
    if (method === 'GET' || method === 'OPTIONS' || method === 'HEAD') {
      return next.handle();
    }

    return next.handle().pipe(
      tap((resData) => {
        // Extract basic info
        const user = req.user;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const userAgent = req.headers['user-agent'];

        // Try to infer entity type from URL (e.g. /api/v1/projects -> Project)
        const urlSegments = req.originalUrl
          .split('?')[0]
          .split('/')
          .filter(Boolean);
        // Assuming typical structure: /api/v1/:resource
        const resourceSegment =
          urlSegments.length > 2 ? urlSegments[2] : 'Unknown';

        // Plural to singular (naive, but enough for logging purposes)
        const entityType =
          resourceSegment.charAt(0).toUpperCase() +
          resourceSegment.slice(1).replace(/s$/, '');

        // Determine Action
        let action = 'UPDATE';
        if (method === 'POST') action = 'CREATE';
        if (method === 'DELETE') action = 'DELETE';

        // Extract entity ID if available (from params or response)
        const entityId = req.params.id || resData?.id || 'UNKNOWN';

        const payload: AuditLogEventPayload = {
          userId: user?.id,
          action,
          entityType,
          entityId,
          changes: {
            requestBody: req.body,
            // We omit response body to save space unless it's critical, but we can store it
          },
          ipAddress,
          userAgent,
        };

        this.eventEmitter.emit('audit.log', payload);
      }),
    );
  }
}
