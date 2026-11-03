import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { cpfValido } from '@barbearia/contracts';

export type AccountRole = 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';

export class Cpf {
    readonly #digits: string;

    constructor(value: string) {
        const digits = value.replace(/\D/g, '');
        if (!cpfValido(digits)) {
            throw new Error('CPF inválido.');
        }
        this.#digits = digits;
    }

    toDatabaseValue(): string {
        return this.#digits;
    }
}

function deriveKey(password: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key));
    });
}

export class PasswordCredential {
    readonly #secret: string;

    private constructor(secret: string) {
        this.#secret = secret;
    }

    static fromPlainText(secret: string): PasswordCredential {
        return new PasswordCredential(secret);
    }

    async hashForStorage(): Promise<string> {
        const salt = randomBytes(16).toString('hex');
        const key = await deriveKey(this.#secret, salt);
        return `scrypt$${salt}$${key.toString('hex')}`;
    }

    async matches(storedHash: string): Promise<boolean> {
        const [algorithm, salt, expectedHex] = storedHash.split('$');
        if (algorithm !== 'scrypt' || !salt || !expectedHex) return false;
        const actual = await deriveKey(this.#secret, salt);
        const expected = Buffer.from(expectedHex, 'hex');
        return actual.length === expected.length && timingSafeEqual(actual, expected);
    }
}

export class Account {
    readonly #role: AccountRole;

    constructor(role: AccountRole) {
        this.#role = role;
    }

    canAccess(allowedRoles: readonly AccountRole[]): boolean {
        return allowedRoles.includes(this.#role);
    }

    get role(): AccountRole {
        return this.#role;
    }
}

export function hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
}

export function newRefreshToken(): string {
    return randomBytes(48).toString('base64url');
}
