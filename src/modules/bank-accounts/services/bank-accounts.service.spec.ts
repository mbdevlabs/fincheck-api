import { Test } from '@nestjs/testing';
import { BankAccountsRepository } from 'src/shared/database/repositories/bank-accounts.repositories';
import { createMockRepository } from 'src/test-utils/mock-repository';
import { makeBankAccount } from 'src/test-utils/factories';
import { BankAccountType } from '../entities/BankAccount';
import { BankAccountsService } from './bank-accounts.service';
import { ValidateBankAccountOwnershipService } from './validade-bank-account-ownership.service';

describe('BankAccountsService', () => {
  let sut: BankAccountsService;
  let bankAccountsRepo: ReturnType<typeof createMockRepository>;
  let validateOwnership: { validate: jest.Mock };

  beforeEach(async () => {
    bankAccountsRepo = createMockRepository();
    validateOwnership = { validate: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        BankAccountsService,
        { provide: BankAccountsRepository, useValue: bankAccountsRepo },
        {
          provide: ValidateBankAccountOwnershipService,
          useValue: validateOwnership,
        },
      ],
    }).compile();

    sut = module.get(BankAccountsService);
  });

  describe('create', () => {
    it('should create a bank account', async () => {
      const dto = {
        name: 'Nubank',
        initialBalance: 1000,
        type: BankAccountType.CHECKING,
        color: '#7950F2',
      };
      const created = makeBankAccount({ ...dto, userId: 'user-1' });
      bankAccountsRepo.create.mockResolvedValue(created);

      const result = await sut.create('user-1', dto);

      expect(result).toEqual(created);
      expect(bankAccountsRepo.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', ...dto },
      });
    });
  });

  describe('findAllByUserId', () => {
    it('should return accounts with currentBalance when no transactions', async () => {
      const account = makeBankAccount({
        userId: 'user-1',
        initialBalance: 500,
      });
      bankAccountsRepo.findMany.mockResolvedValue([
        { ...account, transactions: [] },
      ]);

      const result = await sut.findAllByUserId('user-1');

      expect(result[0].currentBalance).toBe(500);
    });

    it('should add INCOME and subtract OUTCOME from initialBalance', async () => {
      const account = makeBankAccount({
        userId: 'user-1',
        initialBalance: 1000,
      });
      bankAccountsRepo.findMany.mockResolvedValue([
        {
          ...account,
          transactions: [
            { id: '1', type: 'INCOME', value: 500 },
            { id: '2', type: 'OUTCOME', value: 200 },
            { id: '3', type: 'INCOME', value: 300 },
          ],
        },
      ]);

      const result = await sut.findAllByUserId('user-1');

      // 1000 + 500 - 200 + 300 = 1600
      expect(result[0].currentBalance).toBe(1600);
    });

    it('should not include transactions in the returned data', async () => {
      const account = makeBankAccount({ userId: 'user-1' });
      bankAccountsRepo.findMany.mockResolvedValue([
        {
          ...account,
          transactions: [{ id: '1', type: 'INCOME', value: 100 }],
        },
      ]);

      const result = await sut.findAllByUserId('user-1');

      expect(result[0]).not.toHaveProperty('transactions');
    });
  });

  describe('update', () => {
    it('should validate ownership before updating', async () => {
      bankAccountsRepo.update.mockResolvedValue(makeBankAccount());

      const dto = {
        name: 'Updated',
        initialBalance: 2000,
        type: BankAccountType.INVESTMENT,
        color: '#FF0000',
      };

      await sut.update('user-1', 'account-1', dto);

      expect(validateOwnership.validate).toHaveBeenCalledWith(
        'user-1',
        'account-1',
      );
      expect(bankAccountsRepo.update).toHaveBeenCalledWith({
        where: { id: 'account-1' },
        data: dto,
      });
    });
  });

  describe('remove', () => {
    it('should validate ownership before deleting', async () => {
      bankAccountsRepo.delete.mockResolvedValue(undefined);

      await sut.remove('user-1', 'account-1');

      expect(validateOwnership.validate).toHaveBeenCalledWith(
        'user-1',
        'account-1',
      );
      expect(bankAccountsRepo.delete).toHaveBeenCalledWith({
        where: { id: 'account-1' },
      });
    });

    it('should return null after deletion', async () => {
      bankAccountsRepo.delete.mockResolvedValue(undefined);

      const result = await sut.remove('user-1', 'account-1');

      expect(result).toBeNull();
    });
  });
});
