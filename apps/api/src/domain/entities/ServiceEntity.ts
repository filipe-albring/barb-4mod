import { BaseEntity } from './BaseEntity.js';
import { ValidationError } from '../exceptions/AppError.js';

export class ServiceEntity extends BaseEntity {
    #name: string;
    #description: string;
    #price: number;
    #durationMinutes: number;
    #active: boolean;

    constructor(
        name: string,
        price: number,
        durationMinutes = 30,
        description = '',
        active = true,
        id?: string,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        super(id, createdAt, updatedAt);
        if (!name || name.trim().length < 2) {
            throw new ValidationError('Nome do serviço deve possuir ao menos 2 caracteres.');
        }
        if (price < 0) {
            throw new ValidationError('O valor do serviço não pode ser negativo.');
        }
        if (durationMinutes <= 0) {
            throw new ValidationError('A duração do serviço deve ser maior que zero.');
        }
        this.#name = name.trim();
        this.#price = price;
        this.#durationMinutes = durationMinutes;
        this.#description = description.trim();
        this.#active = active;
    }

    get name(): string {
        return this.#name;
    }

    set name(value: string) {
        if (!value || value.trim().length < 2) {
            throw new ValidationError('Nome do serviço inválido.');
        }
        this.#name = value.trim();
        this.touch();
    }

    get description(): string {
        return this.#description;
    }

    set description(value: string) {
        this.#description = value.trim();
        this.touch();
    }

    get price(): number {
        return this.#price;
    }

    set price(value: number) {
        if (value < 0) {
            throw new ValidationError('Preço do serviço não pode ser negativo.');
        }
        this.#price = value;
        this.touch();
    }

    get durationMinutes(): number {
        return this.#durationMinutes;
    }

    set durationMinutes(value: number) {
        if (value <= 0) {
            throw new ValidationError('Duração inválida.');
        }
        this.#durationMinutes = value;
        this.touch();
    }

    get active(): boolean {
        return this.#active;
    }

    set active(value: boolean) {
        this.#active = value;
        this.touch();
    }
}
