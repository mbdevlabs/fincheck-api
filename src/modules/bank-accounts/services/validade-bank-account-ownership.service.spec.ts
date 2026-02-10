import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { BankAccountsRepository } from 'src/shared/database/repositories/bank-accounts.repositories';
import { createMockRepository } from 'src/test-utils/mock-repository';
import { ValidateBankAccountOwnershipService } from './validade-bank-account-ownership.service';

describe('ValidateBankAccountOwnershipService', () => {
  let sut: ValidateBankAccountOwnershipService;
  let bankAccountsRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    bankAccountsRepo = createMockRepository();

    const module = await Test.createTestingModule({
      providers: [
        ValidateBankAccountOwnershipService,
        { provide: BankAccountsRepository, useValue: bankAccountsRepo },
      ],
    }).compile();

    sut = module.get(ValidateBankAccountOwnershipService);
  });

  it('should not throw when user owns the bank account', async () => {
    bankAccountsRepo.findFirst.mockResolvedValue({ id: 'account-1' });

    await expect(sut.validate('user-1', 'account-1')).resolves.toBeUndefined();
  });

  it('should throw NotFoundException when user does not own the bank account', async () => {
    bankAccountsRepo.findFirst.mockResolvedValue(null);

    await expect(sut.validate('user-1', 'account-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
