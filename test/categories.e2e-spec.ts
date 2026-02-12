import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import { createAuthenticatedUser } from './test-helpers';

describe('Categories (e2e)', () => {
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

  const categoryDto = {
    name: 'Freelance',
    icon: 'freelance',
    type: 'INCOME',
  };

  describe('POST /categories', () => {
    it('should create a category', async () => {
      const { accessToken } = await createAuthenticatedUser(app);

      const response = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(categoryDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Freelance');
      expect(response.body.icon).toBe('freelance');
      expect(response.body.type).toBe('INCOME');
    });

    it('should return 400 with invalid data', async () => {
      const { accessToken } = await createAuthenticatedUser(app);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' })
        .expect(400);
    });
  });

  describe('GET /categories', () => {
    it('should return 12 default categories after signup', async () => {
      const { accessToken } = await createAuthenticatedUser(app);

      const response = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(12);

      const incomeCategories = response.body.filter(
        (c: { type: string }) => c.type === 'INCOME',
      );
      const outcomeCategories = response.body.filter(
        (c: { type: string }) => c.type === 'OUTCOME',
      );
      expect(incomeCategories).toHaveLength(3);
      expect(outcomeCategories).toHaveLength(9);
    });

    it('should isolate categories between users', async () => {
      const user1 = await createAuthenticatedUser(app, {
        email: 'user1@example.com',
      });
      const user2 = await createAuthenticatedUser(app, {
        email: 'user2@example.com',
      });

      const response1 = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .expect(200);

      const response2 = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(200);

      const ids1 = response1.body.map((c: { id: string }) => c.id);
      const ids2 = response2.body.map((c: { id: string }) => c.id);

      const overlap = ids1.filter((id: string) => ids2.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should include manually created categories', async () => {
      const { accessToken } = await createAuthenticatedUser(app);

      await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(categoryDto);

      const response = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // 12 default + 1 created
      expect(response.body).toHaveLength(13);
    });
  });

  describe('PUT /categories/:id', () => {
    it('should update a category', async () => {
      const { accessToken } = await createAuthenticatedUser(app);

      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(categoryDto);

      const response = await request(app.getHttpServer())
        .put(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...categoryDto, name: 'Updated' })
        .expect(200);

      expect(response.body.name).toBe('Updated');
    });

    it('should return 404 when accessing another user category', async () => {
      const user1 = await createAuthenticatedUser(app, {
        email: 'user1@example.com',
      });
      const user2 = await createAuthenticatedUser(app, {
        email: 'user2@example.com',
      });

      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(categoryDto);

      await request(app.getHttpServer())
        .put(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ ...categoryDto, name: 'Hacked' })
        .expect(404);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete a category', async () => {
      const { accessToken } = await createAuthenticatedUser(app);

      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(categoryDto);

      await request(app.getHttpServer())
        .delete(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get('/categories')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Only the 12 default categories remain
      expect(response.body).toHaveLength(12);
    });

    it('should return 404 when deleting another user category', async () => {
      const user1 = await createAuthenticatedUser(app, {
        email: 'user1@example.com',
      });
      const user2 = await createAuthenticatedUser(app, {
        email: 'user2@example.com',
      });

      const created = await request(app.getHttpServer())
        .post('/categories')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(categoryDto);

      await request(app.getHttpServer())
        .delete(`/categories/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(404);
    });
  });
});
