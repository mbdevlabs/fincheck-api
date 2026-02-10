import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TransactionsRepository } from 'src/shared/database/repositories/transactions.repositories';
import { createMockRepository } from 'src/test-utils/mock-repository';
import { ValidateTransactionOwnershipService } from './validade-transaction-ownership.service';

describe('ValidateTransactionOwnershipService', () => {
  let sut: ValidateTransactionOwnershipService;
  let transactionsRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    transactionsRepo = createMockRepository();

    const module = await Test.createTestingModule({
      providers: [
        ValidateTransactionOwnershipService,
        { provide: TransactionsRepository, useValue: transactionsRepo },
      ],
    }).compile();

    sut = module.get(ValidateTransactionOwnershipService);
  });

  it('should not throw when user owns the transaction', async () => {
    transactionsRepo.findFirst.mockResolvedValue({ id: 'tx-1' });

    await expect(sut.validate('user-1', 'tx-1')).resolves.toBeUndefined();
  });

  it('should throw NotFoundException when user does not own the transaction', async () => {
    transactionsRepo.findFirst.mockResolvedValue(null);

    await expect(sut.validate('user-1', 'tx-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
