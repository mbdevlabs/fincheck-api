import { Test } from '@nestjs/testing';
import { UsersRepository } from 'src/shared/database/repositories/users.repositories';
import { createMockRepository } from 'src/test-utils/mock-repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let sut: UsersService;
  let usersRepo: ReturnType<typeof createMockRepository>;

  beforeEach(async () => {
    usersRepo = createMockRepository();

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepo },
      ],
    }).compile();

    sut = module.get(UsersService);
  });

  describe('getUserById', () => {
    it('should return name and email for the given user', async () => {
      usersRepo.findUnique.mockResolvedValue({
        name: 'John',
        email: 'john@example.com',
      });

      const result = await sut.getUserById('user-1');

      expect(result).toEqual({ name: 'John', email: 'john@example.com' });
      expect(usersRepo.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { name: true, email: true },
      });
    });
  });
});
