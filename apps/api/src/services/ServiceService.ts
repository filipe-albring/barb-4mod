import { and, count, eq, like } from 'drizzle-orm';
import { db } from '../db/client.js';
import { services } from '../db/schema.js';
import type { CreateServiceInput, UpdateServiceInput } from '@barbearia/contracts';
import { ServiceEntity } from '../domain/entities/ServiceEntity.js';
import { NotFoundError } from '../domain/exceptions/AppError.js';
import { normalizeLegacyEncoding } from '../domain/text/normalizeLegacyEncoding.js';
import type { PaginatedResult, PaginationFilter } from '../domain/repositories/IRepository.js';

export class ServiceService {
    private normalize(service: typeof services.$inferSelect): typeof services.$inferSelect {
        return {
            ...service,
            name: normalizeLegacyEncoding(service.name),
            description: normalizeLegacyEncoding(service.description),
        };
    }

    async findAll(filter: PaginationFilter, onlyActive = false): Promise<PaginatedResult<typeof services.$inferSelect>> {
        const page = Math.max(1, filter.page);
        const limit = Math.max(1, Math.min(100, filter.limit));
        const offset = (page - 1) * limit;

        const searchCondition = filter.search
            ? like(services.name, `%${filter.search}%`)
            : undefined;
        const whereCondition = onlyActive
            ? searchCondition ? and(eq(services.active, true), searchCondition) : eq(services.active, true)
            : searchCondition;

        const [totalResult] = await db
            .select({ total: count() })
            .from(services)
            .where(whereCondition);

        const total = totalResult?.total ?? 0;
        const totalPages = Math.ceil(total / limit) || 1;

        const data = await db
            .select()
            .from(services)
            .where(whereCondition)
            .limit(limit)
            .offset(offset);

        return { data: data.map((service) => this.normalize(service)), page, limit, total, totalPages };
    }

    async findById(id: string): Promise<typeof services.$inferSelect> {
        const [service] = await db.select().from(services).where(eq(services.id, id)).limit(1);
        if (!service) throw new NotFoundError('Serviço');
        return this.normalize(service);
    }

    async create(input: CreateServiceInput): Promise<typeof services.$inferSelect> {
        const domain = new ServiceEntity(input.name, input.price, input.durationMinutes, input.description, input.active);
        const id = domain.id;

        await db.insert(services).values({
            id,
            name: domain.name,
            description: domain.description,
            price: domain.price.toFixed(2),
            durationMinutes: domain.durationMinutes,
            active: domain.active,
        });

        return this.findById(id);
    }

    async update(id: string, input: UpdateServiceInput): Promise<typeof services.$inferSelect> {
        await this.findById(id);
        const domain = new ServiceEntity(input.name, input.price, input.durationMinutes, input.description, input.active, id);

        await db.update(services)
            .set({
                name: domain.name,
                description: domain.description,
                price: domain.price.toFixed(2),
                durationMinutes: domain.durationMinutes,
                active: domain.active,
            })
            .where(eq(services.id, id));

        return this.findById(id);
    }

    async delete(id: string): Promise<void> {
        await this.findById(id);
        await db.delete(services).where(eq(services.id, id));
    }
}
