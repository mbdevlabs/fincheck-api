import { BadRequestException } from '@nestjs/common';
import { OptionalParseUUIDPipe } from './OptionalParseUUIDPipe';

describe('OptionalParseUUIDPipe', () => {
  let sut: OptionalParseUUIDPipe;
  const metadata = { type: 'query' as const, data: 'id' };

  beforeEach(() => {
    sut = new OptionalParseUUIDPipe();
  });

  it('should return undefined when value is undefined', async () => {
    const result = await sut.transform(undefined, metadata);
    expect(result).toBeUndefined();
  });

  it('should return undefined when value is empty string', async () => {
    const result = await sut.transform('', metadata);
    expect(result).toBeUndefined();
  });

  it('should pass through a valid UUID', async () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = await sut.transform(uuid, metadata);
    expect(result).toBe(uuid);
  });

  it('should throw on an invalid UUID', async () => {
    await expect(sut.transform('not-a-uuid', metadata)).rejects.toThrow(
      BadRequestException,
    );
  });
});
