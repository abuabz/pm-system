# Full Stack Task & Project Management System

## Project Overview
This project is a Full Stack Task & Project Management System

## Technology Stack
**Frontend:**
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand
- React Hook Form & Zod
- Axios

**Backend:**
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication (planned)
- Swagger

**Infrastructure:**
- Docker & Docker Compose

## Folder Structure
```
task-project-management/
├── frontend/             # Next.js App
├── backend/              # NestJS App
├── docs/                 # Documentation (Architecture, ERD, etc.)
├── postman/              # Postman API Collections
├── docker-compose.yml    # Database setup
└── README.md             # Project documentation
```

## Prerequisites
- Node.js (v18+)
- npm or yarn
- Docker Desktop (for database)

## Installation

1. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

## Environment Variables

### Backend
Create a `.env` file in the `backend/` directory based on `.env.example`:
```env
DATABASE_URL="postgresql://pm_user:pm_password@localhost:5432/pm_database?schema=public"
PORT=3001
```

### Frontend
Create a `.env.local` file in the `frontend/` directory based on `.env.example`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

## Development Commands

### Start Database
```bash
docker compose up -d
```

### Run Backend
```bash
cd backend
npm run start:dev
```

### Run Frontend
```bash
cd frontend
npm run dev
```

## Database Commands (Prisma)
From the `backend/` directory:
- Generate client: `npx prisma generate`
- Push schema: `npx prisma db push`
- Open Studio: `npx prisma studio`

## API Documentation Location
When the backend is running, the Swagger API documentation is available at:
`http://localhost:3001/api/v1/docs`

## Testing Commands
From the `backend/` directory:
- Unit tests: `npm run test`
- e2e tests: `npm run test:e2e`
- Test coverage: `npm run test:cov`
