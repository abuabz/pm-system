# Limitations

## 1. No High Availability for File Storage
As documented in the assumptions, attachments are saved locally to the container's disk space (`./uploads`). If the backend container is destroyed or horizontally scaled without shared block storage (like EFS) or S3, files will be lost or inconsistently available across load balancers.

## 2. Refresh Token Fingerprinting
While refresh tokens are securely rotated, hashed, and tied to user sessions (IP/User-Agent), they are not strictly bound to client device fingerprints. A compromised HTTP-Only cookie, while difficult to extract via XSS, could technically be replayed from the same IP network before expiration if intercepted via CSRF (though CORS and SameSite policies mitigate this heavily).

## 3. Memory & Performance at Extreme Scale
- **Audit Logs:** Audit logs are currently inserted synchronously within interceptors and event emitters. In a high-throughput environment, these should be dispatched to an asynchronous message queue (e.g., RabbitMQ, Kafka) to prevent database locking or latency on standard requests.
- **Pagination Cursors:** Pagination currently utilizes standard SQL `OFFSET` and `LIMIT`. For datasets exceeding hundreds of thousands of rows, this degrades in performance. Cursor-based pagination should be implemented for high-volume endpoints (e.g., fetching large task boards or audit logs).

## 4. Email Mocking
The password reset and notification email systems are purely mocked. Production deployment requires swapping out the `MailService` internal logger with `nodemailer` or a dedicated provider SDK.
