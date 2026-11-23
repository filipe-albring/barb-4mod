import { Person } from './Person.js';
import type { UserRole } from '@barbearia/contracts';
import { PasswordCredential } from '../account.js';
import { ValidationError } from '../exceptions/AppError.js';

export class User extends Person {
    readonly #email: string;
    #passwordHash: string;
    #role: UserRole;

    constructor(
        name: string,
        email: string,
        cpf: string,
        passwordHash: string,
        role: UserRole = 'CUSTOMER',
        id?: string,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        super(name, cpf, id, createdAt, updatedAt);
        if (!email || !email.includes('@')) {
            throw new ValidationError('E-mail informado é inválido.');
        }
        this.#email = email.toLowerCase().trim();
        this.#passwordHash = passwordHash;
        this.#role = role;
    }

    get email(): string {
        return this.#email;
    }

    get passwordHash(): string {
        return this.#passwordHash;
    }

    get role(): UserRole {
        return this.#role;
    }

    async updatePassword(newPlainPassword: string): Promise<void> {
        const credential = PasswordCredential.fromPlainText(newPlainPassword);
        this.#passwordHash = await credential.hashForStorage();
        this.touch();
    }
}
