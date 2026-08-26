# System Architecture

The Task and Project Management system is designed as a typical 3-tier monolithic web application, favoring maintainability, speed of development, and strict type safety across boundaries.

## High Level Architecture

```mermaid
graph TD
    Client[Next.js Client] --> API[NestJS Backend (REST API)]
    API --> DB[(PostgreSQL)]
    API --> FS[(Local File System)]
    
    subgraph Frontend
    Client
    end
    
    subgraph Backend Services
    API
    end
    
    subgraph Infrastructure
    DB
    FS
    end
```

## Frontend (Next.js)

The frontend leverages **Next.js 16 (App Router)** for its file-based routing and optimized rendering capabilities. It heavily relies on client-side state for interactive boards (Kanban) and complex forms.

- **Routing:** App Router (`/app`) for layout nesting.
- **State Management:**
  - **Zustand:** Global transient state (e.g., authentication tokens, user profile).
  - **TanStack Query (React Query):** Server state caching, optimistic updates, and background data fetching.
- **Styling:** Tailwind CSS combined with `radix-ui` primitives for accessible UI components.
- **Forms:** React Hook Form and Zod for strict client-side validation.

## Backend (NestJS)

The backend is built with **NestJS**, enforcing a modular, heavily structured, and dependency-injection driven architecture. 

- **Modules:** The application is split into discrete domain modules (`Users`, `Auth`, `Projects`, `Tasks`, `Comments`, `Attachments`, `Notifications`, `AuditLogs`, `Reports`).
- **Data Access:** **Prisma ORM** provides fully type-safe database access, accelerating query building and schema migrations.
- **Security Boundaries:**
  - **AuthGuard:** Validates JWT access tokens.
  - **PermissionsGuard:** Validates custom endpoint-level permissions based on Role-Based Access Control (RBAC).
- **Interceptors:**
  - `TransformInterceptor`: Enforces a uniform JSON envelope (`{ data: ..., meta: ... }`).
  - `AuditInterceptor`: Hooks into mutable requests (`POST`, `PUT`, `DELETE`, `PATCH`) to automatically record audit logs in the database.

## Deployment Strategy

The application is containerized using **Docker**.
- The frontend builds into a Next.js `standalone` mode container, avoiding unnecessary dependencies.
- The backend builds into an Alpine node container. On container startup, it automatically executes Prisma migrations (`npx prisma migrate deploy`) to ensure the connected database matches the application schema.
- PostgreSQL runs as a standalone service managed by Docker Compose.
