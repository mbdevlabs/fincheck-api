import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from 'src/generated/prisma/client';
import { createAuthenticatedUser } from './test-helpers';

describe('BankAccounts (e2e)', () => {
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

  const bankAccountDto = {
    name: 'Nubank',
    initialBalance: 1000,
    type: 'CHECKING',
    color: '#7950F2',
  };

  describe('POST /bank-accounts', () => {
    it('should create a bank account', async () => {
      const { accessToken } = await createAuthenticatedUser(app);

      const response = await request(app.getHttpServer())
        .post('/bank-accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(bankAccountDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Nubank');
    });

    it('should return 400 with invalid data', async () => {
      const { accessToken } = await createAuthenticatedUser(app);

      await request(app.getHttpServer())
        .post('/bank-accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: '' })
        .expect(400);
    });
  });

  describe('GET /bank-accounts', () => {
    it('should return bank accounts with currentBalance', async () => {
      const { accessToken } = await createAuthenticatedUser(app);

      await request(app.getHttpServer())
        .post('/bank-accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(bankAccountDto);

      const response = await request(app.getHttpServer())
        .get('/bank-accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].currentBalance).toBe(1000);
    });
  });

  describe('PUT /bank-accounts/:id', () => {
    it('should update a bank account', async () => {
      const { accessToken } = await createAuthenticatedUser(app);

      const created = await request(app.getHttpServer())
        .post('/bank-accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(bankAccountDto);

      const response = await request(app.getHttpServer())
        .put(`/bank-accounts/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ ...bankAccountDto, name: 'Updated' })
        .expect(200);

      expect(response.body.name).toBe('Updated');
    });

    it('should return 404 when accessing another user account', async () => {
      const user1 = await createAuthenticatedUser(app, {
        email: 'user1@example.com',
      });
      const user2 = await createAuthenticatedUser(app, {
        email: 'user2@example.com',
      });

      const created = await request(app.getHttpServer())
        .post('/bank-accounts')
        .set('Authorization', `Bearer ${user1.accessToken}`)
        .send(bankAccountDto);

      await request(app.getHttpServer())
        .put(`/bank-accounts/${created.body.id}`)
        .set('Authorization', `Bearer ${user2.accessToken}`)
        .send({ ...bankAccountDto, name: 'Hacked' })
        .expect(404);
    });
  });

  describe('DELETE /bank-accounts/:id', () => {
    it('should delete a bank account', async () => {
      const { accessToken } = await createAuthenticatedUser(app);

      const created = await request(app.getHttpServer())
        .post('/bank-accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(bankAccountDto);

      await request(app.getHttpServer())
        .delete(`/bank-accounts/${created.body.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);

      const response = await request(app.getHttpServer())
        .get('/bank-accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });
});
