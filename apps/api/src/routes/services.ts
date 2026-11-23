import type { FastifyInstance } from 'fastify';
import { CreateServiceSchema, PaginationQuerySchema, UpdateServiceSchema } from '@barbearia/contracts';
import { z } from 'zod';
import { authenticate, requireRoles } from '../auth/security.js';
import { ServiceService } from '../services/ServiceService.js';

export async function registerServiceRoutes(app: FastifyInstance): Promise<void> {
    const service = new ServiceService();

    app.get('/services', {
        preHandler: authenticate,
        schema: {
            tags: ['Serviços'],
            summary: 'Lista serviços com suporte a paginação',
            security: [{ bearerAuth: [] }],
            querystring: PaginationQuerySchema,
        },
    }, async (request) => {
        const query = PaginationQuerySchema.parse(request.query);
        return service.findAll(query, request.user.role !== 'ADMIN');
    });

    app.get('/services/:id', {
        preHandler: authenticate,
        schema: {
            tags: ['Serviços'],
            summary: 'Busca um serviço por ID',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
        },
    }, async (request) => {
        const { id } = request.params as { id: string };
        return service.findById(id);
    });

    app.post('/services', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Serviços'],
            summary: 'Cadastra um novo serviço',
            security: [{ bearerAuth: [] }],
            body: CreateServiceSchema,
        },
    }, async (request, reply) => {
        const input = CreateServiceSchema.parse(request.body);
        const created = await service.create(input);
        return reply.code(201).send(created);
    });

    app.put('/services/:id', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Serviços'],
            summary: 'Atualiza um serviço existente',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
            body: UpdateServiceSchema,
        },
    }, async (request) => {
        const { id } = request.params as { id: string };
        const input = UpdateServiceSchema.parse(request.body);
        return service.update(id, input);
    });

    app.delete('/services/:id', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Serviços'],
            summary: 'Exclui um serviço',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        await service.delete(id);
        return reply.code(204).send();
    });
}
