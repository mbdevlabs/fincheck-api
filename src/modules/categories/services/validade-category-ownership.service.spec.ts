import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CategoriesRepository } from 'src/shared/database/repositories/categories.repositories';
import { createMockRepository } from 'src/test-utils/mock-repository';
import { ValidateCategoryOwnershipService } from './validade-category-ownership.service';

describe('ValidateCategoryOwnershipService', () => {
  let sut: ValidateCategoryOwnershipService;
  let categoriesRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    categoriesRepo = createMockRepository();

    const module = await Test.createTestingModule({
      providers: [
        ValidateCategoryOwnershipService,
        { provide: CategoriesRepository, useValue: categoriesRepo },
      ],
    }).compile();

    sut = module.get(ValidateCategoryOwnershipService);
  });

  it('should not throw when user owns the category', async () => {
    categoriesRepo.findFirst.mockResolvedValue({ id: 'cat-1' });

    await expect(sut.validate('user-1', 'cat-1')).resolves.toBeUndefined();
  });

  it('should throw NotFoundException when user does not own the category', async () => {
    categoriesRepo.findFirst.mockResolvedValue(null);

    await expect(sut.validate('user-1', 'cat-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});
