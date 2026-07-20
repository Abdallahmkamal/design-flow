import { AppError } from './http.ts';

const lower = 'abcdefghijkmnopqrstuvwxyz';
const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const digits = '23456789';
const symbols = '!@#$%^&*()-_=+';
const allCharacters = `${lower}${upper}${digits}${symbols}`;

function randomIndex(maximum: number): number {
  const value = new Uint32Array(1);
  crypto.getRandomValues(value);
  return value[0] % maximum;
}

export function generateTemporaryPassword(length = 20): string {
  if (length < 12) {
    throw new AppError('DF_VALIDATION', 500);
  }

  const characters = [
    lower[randomIndex(lower.length)],
    upper[randomIndex(upper.length)],
    digits[randomIndex(digits.length)],
    symbols[randomIndex(symbols.length)],
  ];

  while (characters.length < length) {
    characters.push(allCharacters[randomIndex(allCharacters.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }

  return characters.join('');
}

export function validateNewPassword(password: unknown): string {
  if (
    typeof password !== 'string' ||
    password.length < 12 ||
    !/[a-z]/.test(password) ||
    !/[A-Z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    throw new AppError(
      'DF_VALIDATION',
      400,
      'The password does not meet the required policy.',
    );
  }

  return password;
}

export function requiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new AppError('DF_VALIDATION', 400, `${fieldName} is required.`);
  }

  return value.trim();
}

export function requiredUuid(value: unknown, fieldName: string): string {
  const candidate = requiredString(value, fieldName);

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      .test(
        candidate,
      )
  ) {
    throw new AppError('DF_VALIDATION', 400, `${fieldName} must be a UUID.`);
  }

  return candidate.toLowerCase();
}

export function optionalUuid(value: unknown, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return requiredUuid(value, fieldName);
}

export function requiredBoolean(value: unknown, fieldName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new AppError('DF_VALIDATION', 400, `${fieldName} must be a boolean.`);
  }

  return value;
}

export function jsonArray(value: unknown, fieldName: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new AppError('DF_VALIDATION', 400, `${fieldName} must be an array.`);
  }

  return value;
}

export async function secretsMatch(
  supplied: string | null,
  expected: string,
): Promise<boolean> {
  if (!supplied) {
    return false;
  }

  const encoder = new TextEncoder();
  const [suppliedHash, expectedHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(supplied)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const left = new Uint8Array(suppliedHash);
  const right = new Uint8Array(expectedHash);
  let difference = left.length ^ right.length;

  for (let index = 0; index < Math.min(left.length, right.length); index += 1) {
    difference |= left[index] ^ right[index];
  }

  return difference === 0;
}

export interface RateLimiter {
  consume(key: string): boolean;
}

export function createMemoryRateLimiter(
  maximumAttempts = 5,
  windowMilliseconds = 60_000,
): RateLimiter {
  const attempts = new Map<string, number[]>();

  return {
    consume(key) {
      const now = Date.now();
      const current = (attempts.get(key) ?? []).filter(
        (attempt) => now - attempt < windowMilliseconds,
      );

      if (current.length >= maximumAttempts) {
        attempts.set(key, current);
        return false;
      }

      current.push(now);
      attempts.set(key, current);
      return true;
    },
  };
}
