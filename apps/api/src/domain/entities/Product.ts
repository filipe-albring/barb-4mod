import { BaseEntity } from './BaseEntity.js';
import { ValidationError } from '../exceptions/AppError.js';

export class Product extends BaseEntity {
    #name: string;
    #description: string;
    #category: string;
    #price: number;
    #stock: number;
    #active: boolean;

    constructor(
        name: string,
        category: string,
        price: number,
        stock = 0,
        description = '',
        active = true,
        id?: string,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        super(id, createdAt, updatedAt);
        if (!name || name.trim().length < 2) {
            throw new ValidationError('Nome do produto deve possuir ao menos 2 caracteres.');
        }
        if (!category || category.trim().length < 2) {
            throw new ValidationError('Categoria do produto é obrigatória.');
        }
        if (price < 0) {
            throw new ValidationError('Preço do produto não pode ser negativo.');
        }
        if (stock < 0) {
            throw new ValidationError('Estoque do produto não pode ser negativo.');
        }
        this.#name = name.trim();
        this.#category = category.trim();
        this.#price = price;
        this.#stock = stock;
        this.#description = description.trim();
        this.#active = active;
    }

    get name(): string {
        return this.#name;
    }

    set name(value: string) {
        if (!value || value.trim().length < 2) throw new ValidationError('Nome inválido.');
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

    get category(): string {
        return this.#category;
    }

    set category(value: string) {
        if (!value || value.trim().length < 2) throw new ValidationError('Categoria inválida.');
        this.#category = value.trim();
        this.touch();
    }

    get price(): number {
        return this.#price;
    }

    set price(value: number) {
        if (value < 0) throw new ValidationError('Preço não pode ser negativo.');
        this.#price = value;
        this.touch();
    }

    get stock(): number {
        return this.#stock;
    }

    get active(): boolean {
        return this.#active;
    }

    set active(value: boolean) {
        this.#active = value;
        this.touch();
    }

    decreaseStock(quantity: number): void {
        if (quantity <= 0) throw new ValidationError('Quantidade a decrementar deve ser positiva.');
        if (this.#stock < quantity) throw new ValidationError(`Estoque insuficiente para o produto ${this.#name}.`);
        this.#stock -= quantity;
        this.touch();
    }

    increaseStock(quantity: number): void {
        if (quantity <= 0) throw new ValidationError('Quantidade a incrementar deve ser positiva.');
        this.#stock += quantity;
        this.touch();
    }
}
