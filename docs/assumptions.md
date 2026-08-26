# Assumptions

During the development of this project, several architectural and design assumptions were made to prioritize core functionality and maintainability.

## 1. Local Storage for Attachments
- **Assumption:** The application is assumed to be deployed on a single node or a stateful container environment.
- **Reasoning:** File uploads (Attachments) are stored on the local file system using the NestJS `DiskStorage` configuration. In a globally distributed production environment, a cloud provider like AWS S3 or Google Cloud Storage should be used via an abstraction layer. A `StorageService` interface was built to make this swap trivial in the future.

## 2. Mock Email Service
- **Assumption:** Emails are not sent to real SMTP servers during this phase.
- **Reasoning:** A `MailService` was implemented that logs emails (e.g., password resets, notifications) to the console instead of relying on external services like SendGrid or AWS SES, ensuring reviewers can test the system locally without configuring external credentials.

## 3. Global vs Local Roles
- **Assumption:** The system requires a strict global RBAC combined with localized Project-Level access control.
- **Reasoning:** A user's global `Role` determines their capability to perform administrative tasks (like viewing audit logs or managing users), while their `ProjectMember` role determines their capability inside a specific project boundary (e.g., creating tasks).

## 4. Polling vs WebSockets
- **Assumption:** Real-time data sync is not strictly required for this iteration.
- **Reasoning:** Features like notifications, dashboard updates, and comment feeds are fetched via REST endpoints and refreshed periodically by the client via TanStack Query window-focus events, avoiding the operational overhead of managing WebSocket connections (Socket.io) in v1.
