import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import { createAuthenticatedUser } from './test-helpers';

describe('Transactions (e2e)', () => {
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

  async function setupUserWithBankAccountAndCategory(app: INestApplication) {
    const { accessToken } = await createAuthenticatedUser(app);

    const bankAccount = await request(app.getHttpServer())
      .post('/bank-accounts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Nubank',
        initialBalance: 1000,
        type: 'CHECKING',
        color: '#7950F2',
      });

    const categories = await request(app.getHttpServer())
      .get('/categories')
      .set('Authorization', `Bearer ${accessToken}`);

    const incomeCategory = categories.body.find(
      (c: { type: string }) => c.type === 'INCOME',
    );
    const outcomeCategory = categories.body.find(
      (c: { type: string }) => c.type === 'OUTCOME',
    );

    return {
      accessToken,
      bankAccountId: bankAccount.body.id as string,
      incomeCategoryId: incomeCategory.id as string,
      outcomeCategoryId: outcomeCategory.id as string,
    };
  }

  describe('POST /transactions', () => {
    it('should create a transaction', async () => {
      const { accessToken, bankAccountId, incomeCategoryId } =
        await setupUserWithBankAccountAndCategory(app);

      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bankAccountId,
          categoryId: incomeCategoryId,
          name: 'Salary',
          value: 5000,
          date: '2024-01-15T00:00:00.000Z',
          type: 'INCOME',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Salary');
    });
  });

  describe('GET /transactions', () => {
    it('should return transactions filtered by month and year', async () => {
      const { accessToken, bankAccountId, incomeCategoryId } =
        await setupUserWithBankAccountAndCategory(app);

      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bankAccountId,
          categoryId: incomeCategoryId,
          name: 'January Salary',
          value: 5000,
          date: '2024-01-15T00:00:00.000Z',
          type: 'INCOME',
        });

      const response = await request(app.getHttpServer())
        .get('/transactions?month=0&year=2024')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('January Salary');
    });

    it('should filter by type', async () => {
      const {
        accessToken,
        bankAccountId,
        incomeCategoryId,
        outcomeCategoryId,
      } = await setupUserWithBankAccountAndCategory(app);

      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bankAccountId,
          categoryId: incomeCategoryId,
          name: 'Salary',
          value: 5000,
          date: '2024-01-15T00:00:00.000Z',
          type: 'INCOME',
        });

      await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bankAccountId,
          categoryId: outcomeCategoryId,
          name: 'Rent',
          value: 2000,
          date: '2024-01-10T00:00:00.000Z',
          type: 'OUTCOME',
        });

      const response = await request(app.getHttpServer())
        .get('/transactions?month=0&year=2024&type=INCOME')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Salary');
    });
  });

  describe('PUT /transactions/:id', () => {
    it('should update a transaction', async () => {
      const { accessToken, bankAccountId, incomeCategoryId } =
        await setupUserWithBankAccountAndCategory(app);

      const created = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bankAccountId,
          categoryId: incomeCategoryId,
          name: 'Salary',
          value: 5000,
          date: '2024-01-15T00:00:00.000Z',
          type: 'INCOME',
        });

      const response = await request(app.getHttpServer())
        .put(`/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bankAccountId,
          categoryId: incomeCategoryId,
          name: 'Updated Salary',
          value: 6000,
          date: '2024-01-15T00:00:00.000Z',
          type: 'INCOME',
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Salary');
      expect(response.body.value).toBe(6000);
    });
  });

  describe('DELETE /transactions/:id', () => {
    it('should delete a transaction', async () => {
      const { accessToken, bankAccountId, incomeCategoryId } =
        await setupUserWithBankAccountAndCategory(app);

      const created = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          bankAccountId,
          categoryId: incomeCategoryId,
          name: 'Salary',
          value: 5000,
          date: '2024-01-15T00:00:00.000Z',
          type: 'INCOME',
        });

      await request(app.getHttpServer())
        .delete(`/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get('/transactions?month=0&year=2024')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('Ownership validation', () => {
    it('should return 404 when deleting another users transaction', async () => {
      const user1 = await setupUserWithBankAccountAndCategory(app);

      const created = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send({
          bankAccountId: user1.bankAccountId,
          categoryId: user1.incomeCategoryId,
          name: 'Salary',
          value: 5000,
          date: '2024-01-15T00:00:00.000Z',
          type: 'INCOME',
        });

      const user2 = await createAuthenticatedUser(app, {
        email: 'user2@example.com',
      });

      await request(app.getHttpServer())
        .delete(`/transactions/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .expect(404);
    });
  });
});
