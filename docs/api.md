# API Design

The backend exposes a RESTful API versioned at `/api/v1`. It utilizes strict validation and consistent response envelopes.

## Response Format

All successful responses are wrapped in a standard JSON envelope using the `TransformInterceptor`.

### Success Envelope
```json
{
  "data": {
    "id": "123",
    "name": "Project Alpha"
  },
  "meta": {
    "timestamp": "2026-08-26T12:00:00Z"
  }
}
```

### Paginated Success Envelope
Endpoints returning arrays support pagination (`page`, `limit`) and return cursor/page metadata.
```json
{
  "data": [...],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15,
    "timestamp": "2026-08-26T12:00:00Z"
  }
}
```

### Error Responses
Errors are standardized using NestJS's built-in exception filters.
```json
{
  "statusCode": 400,
  "message": ["email must be a valid email"],
  "error": "Bad Request"
}
```

## Authentication

The API uses **JWT (JSON Web Tokens)** for stateless, short-lived authentication, paired with stateful, long-lived **Refresh Tokens**.

1. **Access Tokens**: Short-lived (e.g., 15 minutes). Sent in the `Authorization: Bearer <token>` header.
2. **Refresh Tokens**: Long-lived (e.g., 7 days). Stored in HTTP-Only, Secure cookies to prevent XSS attacks. They are also hashed and stored in the database (`UserSession` table) to support manual revocation (remote logouts).

## Validation

All incoming payloads are validated against Data Transfer Objects (DTOs) heavily annotated with `class-validator`. The `ValidationPipe` drops any undeclared properties to prevent mass assignment vulnerabilities.
