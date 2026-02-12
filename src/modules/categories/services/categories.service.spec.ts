import { Test } from '@nestjs/testing';
import { CategoriesRepository } from 'src/shared/database/repositories/categories.repositories';
import { createMockRepository } from 'src/test-utils/mock-repository';
import { makeCategory } from 'src/test-utils/factories';
import { TransactionType } from 'src/modules/transactions/entities/Transaction';
import { CategoriesService } from './categories.service';
import { ValidateCategoryOwnershipService } from './validade-category-ownership.service';

describe('CategoriesService', () => {
  let sut: CategoriesService;
  let categoriesRepo: ReturnType<typeof createMockRepository>;
  let validateOwnership: { validate: jest.Mock };

  beforeEach(async () => {
    categoriesRepo = createMockRepository();
    validateOwnership = { validate: jest.fn().mockResolvedValue(undefined) };

    const module = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoriesRepository, useValue: categoriesRepo },
        {
          provide: ValidateCategoryOwnershipService,
          useValue: validateOwnership,
        },
      ],
    }).compile();

    sut = module.get(CategoriesService);
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto = {
        name: 'Salário',
        icon: 'salary',
        type: TransactionType.INCOME,
      };
      const created = makeCategory({ ...dto, userId: 'user-1' });
      categoriesRepo.create.mockResolvedValue(created);

      const result = await sut.create('user-1', dto);

      expect(result).toEqual(created);
      expect(categoriesRepo.create).toHaveBeenCalledWith({
        data: { userId: 'user-1', ...dto },
      });
    });
  });

  describe('findAllByUserId', () => {
    it('should return all categories for the given user', async () => {
      const categories = [
        makeCategory({ userId: 'user-1', name: 'Salário' }),
        makeCategory({ userId: 'user-1', name: 'Casa' }),
      ];
      categoriesRepo.findMany.mockResolvedValue(categories);

      const result = await sut.findAllByUserId('user-1');

      expect(result).toEqual(categories);
      expect(categoriesRepo.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('update', () => {
    it('should validate ownership before updating', async () => {
      categoriesRepo.update.mockResolvedValue(makeCategory());

      const dto = {
        name: 'Updated',
        icon: 'updated-icon',
        type: TransactionType.OUTCOME,
      };

      await sut.update('user-1', 'category-1', dto);

      expect(validateOwnership.validate).toHaveBeenCalledWith(
        'user-1',
        'category-1',
      );
      expect(categoriesRepo.update).toHaveBeenCalledWith({
        where: { id: 'category-1' },
        data: dto,
      });
    });
  });

  describe('remove', () => {
    it('should validate ownership before deleting', async () => {
      categoriesRepo.delete.mockResolvedValue(undefined);

      await sut.remove('user-1', 'category-1');

      expect(validateOwnership.validate).toHaveBeenCalledWith(
        'user-1',
        'category-1',
      );
      expect(categoriesRepo.delete).toHaveBeenCalledWith({
        where: { id: 'category-1' },
      });
    });

    it('should return null after deletion', async () => {
      categoriesRepo.delete.mockResolvedValue(undefined);

      const result = await sut.remove('user-1', 'category-1');

      expect(result).toBeNull();
    });
  });
});
