import { and, count, eq, like, or } from 'drizzle-orm';
import { db } from '../db/client.js';
import { products } from '../db/schema.js';
import type { CreateProductInput, UpdateProductInput } from '@barbearia/contracts';
import { Product } from '../domain/entities/Product.js';
import { NotFoundError } from '../domain/exceptions/AppError.js';
import { normalizeLegacyEncoding } from '../domain/text/normalizeLegacyEncoding.js';
import type { PaginatedResult, PaginationFilter } from '../domain/repositories/IRepository.js';

export class ProductService {
    private normalize(product: typeof products.$inferSelect): typeof products.$inferSelect {
        return {
            ...product,
            name: normalizeLegacyEncoding(product.name),
            description: normalizeLegacyEncoding(product.description),
            category: normalizeLegacyEncoding(product.category),
        };
    }

    async findAll(filter: PaginationFilter, onlyActive = false): Promise<PaginatedResult<typeof products.$inferSelect>> {
        const page = Math.max(1, filter.page);
        const limit = Math.max(1, Math.min(100, filter.limit));
        const offset = (page - 1) * limit;

        const searchCondition = filter.search
            ? or(
                like(products.name, `%${filter.search}%`),
                like(products.category, `%${filter.search}%`),
            )
            : undefined;
        const whereCondition = onlyActive
            ? searchCondition ? and(eq(products.active, true), searchCondition) : eq(products.active, true)
            : searchCondition;

        const [totalResult] = await db
            .select({ total: count() })
            .from(products)
            .where(whereCondition);

        const total = totalResult?.total ?? 0;
        const totalPages = Math.ceil(total / limit) || 1;

        const data = await db
            .select()
            .from(products)
            .where(whereCondition)
            .limit(limit)
            .offset(offset);

        return { data: data.map((product) => this.normalize(product)), page, limit, total, totalPages };
    }

    async findById(id: string): Promise<typeof products.$inferSelect> {
        const [product] = await db.select().from(products).where(eq(products.id, id)).limit(1);
        if (!product) throw new NotFoundError('Produto');
        return this.normalize(product);
    }

    async create(input: CreateProductInput): Promise<typeof products.$inferSelect> {
        const domain = new Product(input.name, input.category, input.price, input.stock, input.description, input.active);
        const id = domain.id;

        await db.insert(products).values({
            id,
            name: domain.name,
            description: domain.description,
            category: domain.category,
            price: domain.price.toFixed(2),
            stock: domain.stock,
            active: domain.active,
        });

        return this.findById(id);
    }

    async update(id: string, input: UpdateProductInput): Promise<typeof products.$inferSelect> {
        await this.findById(id);
        const domain = new Product(input.name, input.category, input.price, input.stock, input.description, input.active, id);

        await db.update(products)
            .set({
                name: domain.name,
                description: domain.description,
                category: domain.category,
                price: domain.price.toFixed(2),
                stock: domain.stock,
                active: domain.active,
            })
            .where(eq(products.id, id));

        return this.findById(id);
    }

    async delete(id: string): Promise<void> {
        await this.findById(id);
        await db.delete(products).where(eq(products.id, id));
    }
}
