import { BaseEntity } from './BaseEntity.js';
import { Cpf } from '../account.js';
import { ValidationError } from '../exceptions/AppError.js';

export abstract class Person extends BaseEntity {
    #name: string;
    readonly #cpf: Cpf;

    constructor(name: string, cpf: string | Cpf, id?: string, createdAt?: Date, updatedAt?: Date) {
        super(id, createdAt, updatedAt);
        if (!name || name.trim().length < 2) {
            throw new ValidationError('O nome deve possuir ao menos 2 caracteres.');
        }
        this.#name = name.trim();
        this.#cpf = typeof cpf === 'string' ? new Cpf(cpf) : cpf;
    }

    get name(): string {
        return this.#name;
    }

    set name(value: string) {
        if (!value || value.trim().length < 2) {
            throw new ValidationError('O nome atualizado deve possuir ao menos 2 caracteres.');
        }
        this.#name = value.trim();
        this.touch();
    }

    get cpf(): string {
        return this.#cpf.toDatabaseValue();
    }

    get cpfFormatted(): string {
        const raw = this.#cpf.toDatabaseValue();
        return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
    }
}
