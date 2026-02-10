import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export async function createAuthenticatedUser(
  app: INestApplication,
  overrides: { name?: string; email?: string; password?: string } = {},
) {
  const body = {
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? `test-${Date.now()}@example.com`,
    password: overrides.password ?? '12345678',
  };

  const response = await request(app.getHttpServer())
    .post('/auth/signup')
    .send(body)
    .expect(201);

  return {
    accessToken: response.body.accessToken as string,
    email: body.email,
    password: body.password,
  };
}
