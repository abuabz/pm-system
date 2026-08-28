# Full Stack Task & Project Management System

## Overview
This is a comprehensive Full Stack Task and Project Management System built with a monolithic architecture to help teams orchestrate their work. It provides robust capabilities for managing users, projects, dynamic Kanban-style tasks, file attachments, and hierarchical role-based permissions.

## Architecture
The system is divided into two primary tiers:
- **Frontend**: Next.js 16 (App Router), leveraging TanStack Query and Zustand for heavily optimized data fetching and state caching. Styled with Tailwind CSS.
- **Backend**: NestJS, offering a strongly-typed RESTful API backed by PostgreSQL. Uses Prisma ORM for database migrations and queries.

For detailed architecture diagrams, see [Architecture Documentation](./docs/architecture.md).

## Prerequisites
- **Node.js**: v18+ (v20+ recommended)
- **npm** or **yarn**
- **Docker & Docker Compose** (for running the database or the entire stack)

## Installation

Clone the repository and install dependencies for both the frontend and backend environments.

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

## Environment Setup

You must configure environment variables for both services. Example files are provided in each directory.

### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env` and update the values:
```env
DATABASE_URL="postgresql://pm_user:pm_password@localhost:5433/pm_database?schema=public"
PORT=3001
JWT_SECRET="your_super_secret_jwt_key_here"
```

### Frontend (`frontend/.env.local`)
Copy `frontend/.env.example` to `frontend/.env.local` and update the values:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

## Database Setup & Migrations

If you are running the backend locally (not fully via Docker), start the PostgreSQL database first using Docker Compose:

```bash
# Start PostgreSQL database (binds to port 5433)
docker-compose up -d postgres
```

Once the database is running, apply the database schema via Prisma:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
```

## Running the Application Locally

### Running the Backend
```bash
cd backend
npm run start:dev
```

### Running the Frontend
```bash
cd frontend
npm run dev
```

The frontend will be accessible at `http://localhost:3000`.

## Docker (Production Environment)

To run the entire system (Frontend, Backend, and Database) in isolated containers, simply use Docker Compose from the root directory. This will automatically execute database migrations on startup.

```bash
docker-compose up --build -d
```
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001/api/v1`

## Testing

The system employs strict unit and e2e testing strategies using Jest.

### Backend Tests
```bash
cd backend
npm run test          # Run unit tests
npm run test:e2e      # Run integration/E2E tests
npm run test:cov      # Generate coverage report
```

### Frontend Tests
```bash
cd frontend
npm run test          # Run component and flow tests
```

## Swagger API Documentation

The backend includes auto-generated OpenAPI documentation. 
Once the backend is running, navigate to:  
👉 **`http://localhost:3001/api/v1/docs`**

For more information, see the [API Design Documentation](./docs/api.md).

## Postman

A complete Postman collection is provided in the repository root: `pm-system.postman_collection.json`.

1. Import the file into Postman.
2. The collection includes environment variables (`{{baseUrl}}` and `{{bearerToken}}`).
3. View the collection's root description for detailed instructions on the **Authentication Flow** (Register -> Login -> Set Token).

## Assumptions & Limitations

Please read the following documents to understand the context behind architectural decisions and current boundaries of the system:
- [Assumptions](./docs/assumptions.md)
- [Limitations](./docs/limitations.md)
- [Database Schema](./docs/database.md)

## AI Policy & Development Context

In accordance with the SNEC technical assessment guidelines, AI tools were utilized strictly as a development assistant.
- **AI Utilization:** AI was heavily leveraged to generate boilerplate code (e.g., standard Prisma schemas, basic DTOs, Jest test scaffolds) and assist with repetitive front-end component implementations using Tailwind CSS.
- **Human Orchestration:** The core business logic, architectural boundaries (NestJS Modular architecture), database indexing strategies, JWT token rotation mechanisms, and strict Role-Based Access Control logic were intentionally designed, orchestrated, and strictly reviewed by the candidate.
- **Understanding & Accountability:** The candidate retains full comprehension of the entire lifecycle of a request from the Next.js `App Router` through to the PostgreSQL transactional layer, and can confidently explain, refactor, or debug any abstraction in this repository (Interceptors, Guards, Prisma Migrations, TanStack Query states).
