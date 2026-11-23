import { randomUUID } from 'node:crypto';

export abstract class BaseEntity {
    readonly #id: string;
    readonly #createdAt: Date;
    #updatedAt: Date;

    constructor(id?: string, createdAt?: Date, updatedAt?: Date) {
        this.#id = id ?? randomUUID();
        this.#createdAt = createdAt ?? new Date();
        this.#updatedAt = updatedAt ?? new Date();
    }

    get id(): string {
        return this.#id;
    }

    get createdAt(): Date {
        return this.#createdAt;
    }

    get updatedAt(): Date {
        return this.#updatedAt;
    }

    protected touch(): void {
        this.#updatedAt = new Date();
    }

    equals(other: BaseEntity | null | undefined): boolean {
        if (!other) return false;
        if (this === other) return true;
        return this.#id === other.id;
    }
}
