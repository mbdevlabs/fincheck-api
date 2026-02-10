import { Test } from '@nestjs/testing';
import { CategoriesRepository } from 'src/shared/database/repositories/categories.repositories';
import { createMockRepository } from 'src/test-utils/mock-repository';
import { makeCategory } from 'src/test-utils/factories';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let sut: CategoriesService;
  let categoriesRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    categoriesRepo = createMockRepository();

    const module = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: CategoriesRepository, useValue: categoriesRepo },
      ],
    }).compile();

    sut = module.get(CategoriesService);
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
});
