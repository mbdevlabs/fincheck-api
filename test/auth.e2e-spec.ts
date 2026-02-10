import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';

describe('Auth (e2e)', () => {
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

  describe('POST /auth/signup', () => {
    it('should create a user and return access token', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          name: 'John',
          email: 'john@example.com',
          password: '12345678',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(typeof response.body.accessToken).toBe('string');
    });

    it('should create 12 default categories for the user', async () => {
      const signupResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          name: 'John',
          email: 'john@example.com',
          password: '12345678',
        })
        .expect(201);

      const categoriesResponse = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${signupResponse.body.accessToken}`)
        .expect(200);

      expect(categoriesResponse.body).toHaveLength(12);
    });

    it('should return 409 when email is already in use', async () => {
      const body = {
        name: 'John',
        email: 'john@example.com',
        password: '12345678',
      };

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(body)
        .expect(201);

      await request(app.getHttpServer())
        .post('/auth/signup')
        .send(body)
        .expect(409);
    });

    it('should return 400 on invalid body', async () => {
      await request(app.getHttpServer())
        .post('/auth/signup')
        .send({ name: '', email: 'invalid', password: '123' })
        .expect(400);
    });
  });

  describe('POST /auth/signin', () => {
    it('should return access token with valid credentials', async () => {
      await request(app.getHttpServer()).post('/auth/signup').send({
        name: 'John',
        email: 'john@example.com',
        password: '12345678',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: 'john@example.com', password: '12345678' })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 401 with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/signin')
        .send({ email: 'wrong@example.com', password: '12345678' })
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    it('should return 401 when accessing protected route without token', async () => {
      await request(app.getHttpServer()).get('/users/me').expect(401);
    });
  });
});
