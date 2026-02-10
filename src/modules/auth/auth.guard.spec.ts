import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from './auth.guard';

jest.mock('src/shared/config/env', () => ({
  env: { jwtSecret: 'test-secret' },
}));

describe('AuthGuard', () => {
  let sut: AuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(() => {
    jwtService = { verifyAsync: jest.fn() };
    reflector = { getAllAndOverride: jest.fn() };
    sut = new AuthGuard(
      jwtService as unknown as JwtService,
      reflector as unknown as Reflector,
    );
  });

  function makeContext(authorization?: string): ExecutionContext {
    const request: Record<string, unknown> = {
      headers: { authorization },
    };
    return {
      switchToHttp: () => ({ getRequest: () => request }),
      getClass: () => ({}),
      getHandler: () => ({}),
    } as unknown as ExecutionContext;
  }

  it('should allow access to @IsPublic() routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const result = await sut.canActivate(makeContext());
    expect(result).toBe(true);
  });

  it('should throw UnauthorizedException when no token is provided', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    await expect(sut.canActivate(makeContext())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedException when token is invalid', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockRejectedValue(new Error('invalid'));

    await expect(
      sut.canActivate(makeContext('Bearer invalid-token')),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should set userId on request and return true on valid token', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user-123' });

    const context = makeContext('Bearer valid-token');
    const result = await sut.canActivate(context);

    expect(result).toBe(true);

    const request: Record<string, unknown> = context
      .switchToHttp()
      .getRequest();
    expect(request['userId']).toBe('user-123');
  });
});
