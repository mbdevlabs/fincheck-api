import { randomUUID } from 'node:crypto';

export function makeUser(
  overrides: Partial<{
    id: string;
    name: string;
    email: string;
    password: string;
  }> = {},
) {
  return {
    id: overrides.id ?? randomUUID(),
    name: overrides.name ?? 'John Doe',
    email: overrides.email ?? 'john@example.com',
    password: overrides.password ?? '$2a$12$hashedpassword',
  };
}

export function makeBankAccount(
  overrides: Partial<{
    id: string;
    userId: string;
    name: string;
    initialBalance: number;
    type: string;
    color: string;
  }> = {},
) {
  return {
    id: overrides.id ?? randomUUID(),
    userId: overrides.userId ?? randomUUID(),
    name: overrides.name ?? 'Nubank',
    initialBalance: overrides.initialBalance ?? 1000,
    type: overrides.type ?? 'CHECKING',
    color: overrides.color ?? '#7950F2',
  };
}

export function makeCategory(
  overrides: Partial<{
    id: string;
    userId: string;
    name: string;
    icon: string;
    type: string;
  }> = {},
) {
  return {
    id: overrides.id ?? randomUUID(),
    userId: overrides.userId ?? randomUUID(),
    name: overrides.name ?? 'Salário',
    icon: overrides.icon ?? 'salary',
    type: overrides.type ?? 'INCOME',
  };
}

export function makeTransaction(
  overrides: Partial<{
    id: string;
    userId: string;
    bankAccountId: string;
    categoryId: string | null;
    name: string;
    value: number;
    date: Date;
    type: string;
  }> = {},
) {
  return {
    id: overrides.id ?? randomUUID(),
    userId: overrides.userId ?? randomUUID(),
    bankAccountId: overrides.bankAccountId ?? randomUUID(),
    categoryId: overrides.categoryId ?? randomUUID(),
    name: overrides.name ?? 'Salary',
    value: overrides.value ?? 5000,
    date: overrides.date ?? new Date('2024-01-15'),
    type: overrides.type ?? 'INCOME',
  };
}
