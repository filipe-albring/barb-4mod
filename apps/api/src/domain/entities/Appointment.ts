import { BaseEntity } from './BaseEntity.js';
import type { AppointmentStatus } from '@barbearia/contracts';
import { ValidationError } from '../exceptions/AppError.js';

export interface AppointmentItem {
    serviceId: string;
    name: string;
    unitPrice: number;
}

export class Appointment extends BaseEntity {
    readonly #customerId: string;
    #barberId: string;
    #startsAt: Date;
    #status: AppointmentStatus;
    #services: AppointmentItem[];

    constructor(
        customerId: string,
        barberId: string,
        startsAt: Date,
        status: AppointmentStatus = 'SCHEDULED',
        services: AppointmentItem[] = [],
        id?: string,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        super(id, createdAt, updatedAt);
        if (!customerId) throw new ValidationError('Cliente é obrigatório para o agendamento.');
        if (!barberId) throw new ValidationError('Barbeiro é obrigatório para o agendamento.');
        this.#customerId = customerId;
        this.#barberId = barberId;
        this.#startsAt = startsAt;
        this.#status = status;
        this.#services = [...services];
    }

    get customerId(): string {
        return this.#customerId;
    }

    get barberId(): string {
        return this.#barberId;
    }

    set barberId(value: string) {
        if (!value) throw new ValidationError('Barbeiro não pode ser vazio.');
        this.#barberId = value;
        this.touch();
    }

    get startsAt(): Date {
        return this.#startsAt;
    }

    set startsAt(value: Date) {
        this.#startsAt = value;
        this.touch();
    }

    get status(): AppointmentStatus {
        return this.#status;
    }

    get services(): readonly AppointmentItem[] {
        return Object.freeze([...this.#services]);
    }

    setServices(items: AppointmentItem[]): void {
        if (!items || items.length === 0) {
            throw new ValidationError('O agendamento precisa conter ao menos um serviço.');
        }
        this.#services = [...items];
        this.touch();
    }

    calculateTotal(): number {
        return this.#services.reduce((total, item) => total + item.unitPrice, 0);
    }

    cancel(): void {
        if (this.#status === 'COMPLETED') {
            throw new ValidationError('Não é possível cancelar um atendimento já concluído.');
        }
        this.#status = 'CANCELLED';
        this.touch();
    }

    complete(): void {
        if (this.#status === 'CANCELLED') {
            throw new ValidationError('Não é possível concluir um atendimento cancelado.');
        }
        this.#status = 'COMPLETED';
        this.touch();
    }
}
