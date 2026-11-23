import { Person } from './Person.js';
import { ValidationError } from '../exceptions/AppError.js';

export class Barber extends Person {
    #phone: string;
    #specialty: string;
    #active: boolean;

    constructor(
        name: string,
        cpf: string,
        phone: string,
        specialty: string,
        active = true,
        id?: string,
        createdAt?: Date,
        updatedAt?: Date,
    ) {
        super(name, cpf, id, createdAt, updatedAt);
        if (!phone || phone.trim().length < 8) {
            throw new ValidationError('Telefone para contato é obrigatório.');
        }
        if (!specialty || specialty.trim().length < 2) {
            throw new ValidationError('Especialidade do barbeiro é obrigatória.');
        }
        this.#phone = phone.trim();
        this.#specialty = specialty.trim();
        this.#active = active;
    }

    get phone(): string {
        return this.#phone;
    }

    set phone(value: string) {
        if (!value || value.trim().length < 8) {
            throw new ValidationError('Telefone deve conter no mínimo 8 dígitos.');
        }
        this.#phone = value.trim();
        this.touch();
    }

    get specialty(): string {
        return this.#specialty;
    }

    set specialty(value: string) {
        if (!value || value.trim().length < 2) {
            throw new ValidationError('Especialidade inválida.');
        }
        this.#specialty = value.trim();
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
