import { BadRequestException } from '@nestjs/common';
import { OptionalParseEnumPipe } from './OptionalParseEnumPipe';

enum TestEnum {
  A = 'A',
  B = 'B',
}

describe('OptionalParseEnumPipe', () => {
  let sut: OptionalParseEnumPipe<typeof TestEnum>;
  const metadata = { type: 'query' as const, data: 'type' };

  beforeEach(() => {
    sut = new OptionalParseEnumPipe(TestEnum);
  });

  it('should return undefined when value is undefined', async () => {
    const result = await sut.transform(undefined, metadata);
    expect(result).toBeUndefined();
  });

  it('should return undefined when value is empty string', async () => {
    const result = await sut.transform('', metadata);
    expect(result).toBeUndefined();
  });

  it('should pass through a valid enum value', async () => {
    const result = await sut.transform('A', metadata);
    expect(result).toBe('A');
  });

  it('should throw on an invalid enum value', async () => {
    await expect(sut.transform('INVALID', metadata)).rejects.toThrow(
      BadRequestException,
    );
  });
});
