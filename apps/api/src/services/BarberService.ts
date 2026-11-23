import { and, count, eq, like, or } from 'drizzle-orm';
import { db } from '../db/client.js';
import { barbers } from '../db/schema.js';
import type { CreateBarberInput, UpdateBarberInput } from '@barbearia/contracts';
import { Barber } from '../domain/entities/Barber.js';
import { ConflictError, NotFoundError } from '../domain/exceptions/AppError.js';
import { normalizeLegacyEncoding } from '../domain/text/normalizeLegacyEncoding.js';
import type { PaginatedResult, PaginationFilter } from '../domain/repositories/IRepository.js';

export class BarberService {
    private normalize(barber: typeof barbers.$inferSelect): typeof barbers.$inferSelect {
        return {
            ...barber,
            name: normalizeLegacyEncoding(barber.name),
            specialty: normalizeLegacyEncoding(barber.specialty),
        };
    }

    async findAll(filter: PaginationFilter, onlyActive = false): Promise<PaginatedResult<typeof barbers.$inferSelect>> {
        const page = Math.max(1, filter.page);
        const limit = Math.max(1, Math.min(100, filter.limit));
        const offset = (page - 1) * limit;

        const searchCondition = filter.search
            ? or(
                like(barbers.name, `%${filter.search}%`),
                like(barbers.specialty, `%${filter.search}%`),
            )
            : undefined;
        const whereCondition = onlyActive
            ? searchCondition ? and(eq(barbers.active, true), searchCondition) : eq(barbers.active, true)
            : searchCondition;

        const [totalResult] = await db
            .select({ total: count() })
            .from(barbers)
            .where(whereCondition);

        const total = totalResult?.total ?? 0;
        const totalPages = Math.ceil(total / limit) || 1;

        const data = await db
            .select()
            .from(barbers)
            .where(whereCondition)
            .limit(limit)
            .offset(offset);

        return { data: data.map((barber) => this.normalize(barber)), page, limit, total, totalPages };
    }

    async findById(id: string): Promise<typeof barbers.$inferSelect> {
        const [barber] = await db.select().from(barbers).where(eq(barbers.id, id)).limit(1);
        if (!barber) throw new NotFoundError('Barbeiro');
        return this.normalize(barber);
    }

    async create(input: CreateBarberInput): Promise<typeof barbers.$inferSelect> {
        const domainBarber = new Barber(input.name, input.cpf, input.phone, input.specialty, input.active);

        const [cpfExistente] = await db.select().from(barbers).where(eq(barbers.cpf, domainBarber.cpf)).limit(1);
        if (cpfExistente) {
            throw new ConflictError('Já existe um profissional cadastrado com este CPF.');
        }

        const id = domainBarber.id;
        await db.insert(barbers).values({
            id,
            name: domainBarber.name,
            cpf: domainBarber.cpf,
            phone: domainBarber.phone,
            specialty: domainBarber.specialty,
            active: domainBarber.active,
        });

        return this.findById(id);
    }

    async update(id: string, input: UpdateBarberInput): Promise<typeof barbers.$inferSelect> {
        await this.findById(id);

        const domainBarber = new Barber(input.name, input.cpf, input.phone, input.specialty, input.active, id);

        const [cpfExistente] = await db.select().from(barbers).where(eq(barbers.cpf, domainBarber.cpf)).limit(1);
        if (cpfExistente && cpfExistente.id !== id) {
            throw new ConflictError('Já existe outro profissional cadastrado com este CPF.');
        }

        await db.update(barbers)
            .set({
                name: domainBarber.name,
                cpf: domainBarber.cpf,
                phone: domainBarber.phone,
                specialty: domainBarber.specialty,
                active: domainBarber.active,
            })
            .where(eq(barbers.id, id));

        return this.findById(id);
    }

    async delete(id: string): Promise<void> {
        await this.findById(id);
        await db.delete(barbers).where(eq(barbers.id, id));
    }
}
