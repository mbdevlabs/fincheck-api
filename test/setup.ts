import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

beforeEach(async () => {
  await prisma.$executeRawUnsafe('DELETE FROM "transactions"');
  await prisma.$executeRawUnsafe('DELETE FROM "bank_accounts"');
  await prisma.$executeRawUnsafe('DELETE FROM "categories"');
  await prisma.$executeRawUnsafe('DELETE FROM "users"');
});

afterAll(async () => {
  await prisma.$disconnect();
});
