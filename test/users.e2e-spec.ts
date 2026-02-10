import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import { createAuthenticatedUser } from './test-helpers';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL,
    });
    prisma = new PrismaClient({ adapter });
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('DELETE FROM "transactions"');
    await prisma.$executeRawUnsafe('DELETE FROM "bank_accounts"');
    await prisma.$executeRawUnsafe('DELETE FROM "categories"');
    await prisma.$executeRawUnsafe('DELETE FROM "users"');
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should return name and email without password', async () => {
      const { accessToken } = await createAuthenticatedUser(app, {
        name: 'John Doe',
        email: 'john@example.com',
      });

      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });
  });
});
