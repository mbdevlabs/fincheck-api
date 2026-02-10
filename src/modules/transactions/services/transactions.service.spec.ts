import { Test } from '@nestjs/testing';
import { TransactionsRepository } from 'src/shared/database/repositories/transactions.repositories';
import { createMockRepository } from 'src/test-utils/mock-repository';
import { makeTransaction } from 'src/test-utils/factories';
import { ValidateBankAccountOwnershipService } from '../../bank-accounts/services/validade-bank-account-ownership.service';
import { ValidateCategoryOwnershipService } from '../../categories/services/validade-category-ownership.service';
import { TransactionType } from '../entities/Transaction';
import { TransactionsService } from './transactions.service';
import { ValidateTransactionOwnershipService } from './validade-transaction-ownership.service';

describe('TransactionsService', () => {
  let sut: TransactionsService;
  let transactionsRepo: ReturnType<typeof createMockRepository>;
  let validateBankAccount: { validate: jest.Mock };
  let validateCategory: { validate: jest.Mock };
  let validateTransaction: { validate: jest.Mock };

  beforeEach(async () => {
    transactionsRepo = createMockRepository();
    validateBankAccount = { validate: jest.fn().mockResolvedValue(undefined) };
    validateCategory = { validate: jest.fn().mockResolvedValue(undefined) };
    validateTransaction = { validate: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: TransactionsRepository, useValue: transactionsRepo },
        {
          provide: ValidateBankAccountOwnershipService,
          useValue: validateBankAccount,
        },
        {
          provide: ValidateCategoryOwnershipService,
          useValue: validateCategory,
        },
        {
          provide: ValidateTransactionOwnershipService,
          useValue: validateTransaction,
        },
      ],
    }).compile();

    sut = module.get(TransactionsService);
  });

  describe('create', () => {
    it('should validate bankAccount and category ownership, then create', async () => {
      const dto = {
        bankAccountId: 'ba-1',
        categoryId: 'cat-1',
        name: 'Salary',
        value: 5000,
        date: '2024-01-15',
        type: TransactionType.INCOME,
      };
      const created = makeTransaction();
      transactionsRepo.create.mockResolvedValue(created);

      const result = await sut.create('user-1', dto);

      expect(validateBankAccount.validate).toHaveBeenCalledWith(
        'user-1',
        'ba-1',
      );
      expect(validateCategory.validate).toHaveBeenCalledWith('user-1', 'cat-1');
      expect(result).toEqual(created);
    });
  });

  describe('findAllByUserId', () => {
    it('should filter by month/year with UTC date range', async () => {
      transactionsRepo.findMany.mockResolvedValue([]);

      await sut.findAllByUserId('user-1', { month: 0, year: 2024 });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const call = transactionsRepo.findMany.mock.calls[0][0] as {
        where: {
          date: { gte: Date; lt: Date };
          bankAccountId?: string;
          type?: string;
        };
      };
      expect(call.where.date.gte).toEqual(new Date(Date.UTC(2024, 0)));
      expect(call.where.date.lt).toEqual(new Date(Date.UTC(2024, 1)));
    });

    it('should pass optional bankAccountId and type filters', async () => {
      transactionsRepo.findMany.mockResolvedValue([]);

      await sut.findAllByUserId('user-1', {
        month: 5,
        year: 2024,
        bankAccountId: 'ba-1',
        type: TransactionType.INCOME,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const call = transactionsRepo.findMany.mock.calls[0][0] as {
        where: { bankAccountId?: string; type?: string };
      };
      expect(call.where.bankAccountId).toBe('ba-1');
      expect(call.where.type).toBe('INCOME');
    });

    it('should not include bankAccountId/type when not provided', async () => {
      transactionsRepo.findMany.mockResolvedValue([]);

      await sut.findAllByUserId('user-1', { month: 0, year: 2024 });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const call = transactionsRepo.findMany.mock.calls[0][0] as {
        where: { bankAccountId?: string; type?: string };
      };
      expect(call.where.bankAccountId).toBeUndefined();
      expect(call.where.type).toBeUndefined();
    });
  });

  describe('update', () => {
    it('should validate all entities ownership before updating', async () => {
      transactionsRepo.update.mockResolvedValue(makeTransaction());

      const dto = {
        bankAccountId: 'ba-1',
        categoryId: 'cat-1',
        name: 'Updated',
        value: 100,
        date: '2024-02-01',
        type: TransactionType.OUTCOME,
      };

      await sut.update('user-1', 'tx-1', dto);

      expect(validateTransaction.validate).toHaveBeenCalledWith(
        'user-1',
        'tx-1',
      );
      expect(validateBankAccount.validate).toHaveBeenCalledWith(
        'user-1',
        'ba-1',
      );
      expect(validateCategory.validate).toHaveBeenCalledWith('user-1', 'cat-1');
    });
  });

  describe('remove', () => {
    it('should validate transaction ownership before deleting', async () => {
      transactionsRepo.delete.mockResolvedValue(undefined);

      await sut.remove('user-1', 'tx-1');

      expect(validateTransaction.validate).toHaveBeenCalledWith(
        'user-1',
        'tx-1',
      );
      expect(transactionsRepo.delete).toHaveBeenCalledWith({
        where: { id: 'tx-1' },
      });
    });

    it('should return null after deletion', async () => {
      transactionsRepo.delete.mockResolvedValue(undefined);

      const result = await sut.remove('user-1', 'tx-1');

      expect(result).toBeNull();
    });
  });
});
