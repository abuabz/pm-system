import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/database/prisma.service';
import * as bcrypt from 'bcrypt';
import * as cookieParser from 'cookie-parser';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    userSession: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/login (POST)', () => {
    it('should return 401 if invalid credentials', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(401);
        
      expect(response.body.message).toBe('Invalid credentials');
    });

    it('should return 200 and set refresh token cookie on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        passwordHash: hashedPassword,
        accountStatus: 'ACTIVE',
        role: { name: 'User', permissions: [] },
      });
      mockPrismaService.userSession.create.mockResolvedValue({});

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.user).toBeDefined();
      expect(response.headers['set-cookie'][0]).toContain('refresh_token');
    });
  });
});
