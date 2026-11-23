import type { FastifyInstance } from 'fastify';
import { CreateProductSchema, PaginationQuerySchema, UpdateProductSchema } from '@barbearia/contracts';
import { z } from 'zod';
import { authenticate, requireRoles } from '../auth/security.js';
import { ProductService } from '../services/ProductService.js';

export async function registerProductRoutes(app: FastifyInstance): Promise<void> {
    const service = new ProductService();

    app.get('/products', {
        preHandler: authenticate,
        schema: {
            tags: ['Produtos'],
            summary: 'Lista produtos de forma paginada',
            security: [{ bearerAuth: [] }],
            querystring: PaginationQuerySchema,
        },
    }, async (request) => {
        const query = PaginationQuerySchema.parse(request.query);
        return service.findAll(query, request.user.role !== 'ADMIN');
    });

    app.get('/products/:id', {
        preHandler: authenticate,
        schema: {
            tags: ['Produtos'],
            summary: 'Busca um produto por ID',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
        },
    }, async (request) => {
        const { id } = request.params as { id: string };
        return service.findById(id);
    });

    app.post('/products', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Produtos'],
            summary: 'Cadastra um novo produto da barbearia',
            security: [{ bearerAuth: [] }],
            body: CreateProductSchema,
        },
    }, async (request, reply) => {
        const input = CreateProductSchema.parse(request.body);
        const created = await service.create(input);
        return reply.code(201).send(created);
    });

    app.put('/products/:id', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Produtos'],
            summary: 'Atualiza um produto',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
            body: UpdateProductSchema,
        },
    }, async (request) => {
        const { id } = request.params as { id: string };
        const input = UpdateProductSchema.parse(request.body);
        return service.update(id, input);
    });

    app.delete('/products/:id', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Produtos'],
            summary: 'Exclui um produto',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        await service.delete(id);
        return reply.code(204).send();
    });
}
