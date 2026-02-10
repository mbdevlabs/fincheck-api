import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UsersRepository } from 'src/shared/database/repositories/users.repositories';
import { createMockRepository } from 'src/test-utils/mock-repository';
import { makeUser } from 'src/test-utils/factories';
import { AuthService } from './auth.service';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import { compare, hash } from 'bcryptjs';

const mockedCompare = compare as jest.MockedFunction<typeof compare>;
const mockedHash = hash as jest.MockedFunction<typeof hash>;

describe('AuthService', () => {
  let sut: AuthService;
  let usersRepo: ReturnType<typeof createMockRepository>;
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    usersRepo = createMockRepository();
    jwtService = { signAsync: jest.fn().mockResolvedValue('fake-token') };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersRepository, useValue: usersRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    sut = module.get(AuthService);
  });

  describe('signin', () => {
    it('should throw UnauthorizedException when user is not found', async () => {
      usersRepo.findUnique.mockResolvedValue(null);

      await expect(
        sut.signin({ email: 'wrong@email.com', password: '12345678' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      usersRepo.findUnique.mockResolvedValue(makeUser());
      mockedCompare.mockResolvedValue(false as never);

      await expect(
        sut.signin({ email: 'john@example.com', password: 'wrongpass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return an access token on valid credentials', async () => {
      const user = makeUser();
      usersRepo.findUnique.mockResolvedValue(user);
      mockedCompare.mockResolvedValue(true as never);

      const result = await sut.signin({
        email: user.email,
        password: '12345678',
      });

      expect(result).toEqual({ accessToken: 'fake-token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: user.id });
    });
  });

  describe('signup', () => {
    it('should throw ConflictException when email is already in use', async () => {
      usersRepo.findUnique.mockResolvedValue({ id: 'existing-id' });

      await expect(
        sut.signup({
          name: 'John',
          email: 'taken@email.com',
          password: '12345678',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash the password with 12 rounds', async () => {
      usersRepo.findUnique.mockResolvedValue(null);
      mockedHash.mockResolvedValue('hashed-password' as never);
      usersRepo.create.mockResolvedValue(makeUser());

      await sut.signup({
        name: 'John',
        email: 'john@example.com',
        password: '12345678',
      });

      expect(mockedHash).toHaveBeenCalledWith('12345678', 12);
    });

    it('should create user with 12 default categories', async () => {
      usersRepo.findUnique.mockResolvedValue(null);
      mockedHash.mockResolvedValue('hashed-password' as never);
      usersRepo.create.mockResolvedValue(makeUser());

      await sut.signup({
        name: 'John',
        email: 'john@example.com',
        password: '12345678',
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const createCall = usersRepo.create.mock.calls[0][0] as {
        data: { categories: { createMany: { data: unknown[] } } };
      };
      expect(createCall.data.categories.createMany.data).toHaveLength(12);
    });

    it('should return an access token after signup (auto-login)', async () => {
      usersRepo.findUnique.mockResolvedValue(null);
      mockedHash.mockResolvedValue('hashed-password' as never);
      const user = makeUser();
      usersRepo.create.mockResolvedValue(user);

      const result = await sut.signup({
        name: 'John',
        email: 'john@example.com',
        password: '12345678',
      });

      expect(result).toEqual({ accessToken: 'fake-token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: user.id });
    });
  });
});
