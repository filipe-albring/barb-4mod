import type { FastifyInstance } from 'fastify';
import { CreateBarberSchema, PaginationQuerySchema, UpdateBarberSchema } from '@barbearia/contracts';
import { z } from 'zod';
import { authenticate, requireRoles } from '../auth/security.js';
import { BarberService } from '../services/BarberService.js';

export async function registerBarberRoutes(app: FastifyInstance): Promise<void> {
    const service = new BarberService();

    app.get('/barbers', {
        preHandler: authenticate,
        schema: {
            tags: ['Barbeiros'],
            summary: 'Lista barbeiros de forma paginada',
            security: [{ bearerAuth: [] }],
            querystring: PaginationQuerySchema,
        },
    }, async (request) => {
        const query = PaginationQuerySchema.parse(request.query);
        return service.findAll(query, request.user.role !== 'ADMIN');
    });

    app.get('/barbers/:id', {
        preHandler: authenticate,
        schema: {
            tags: ['Barbeiros'],
            summary: 'Busca um barbeiro por ID',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
        },
    }, async (request) => {
        const { id } = request.params as { id: string };
        return service.findById(id);
    });

    app.post('/barbers', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Barbeiros'],
            summary: 'Cadastra um novo barbeiro',
            security: [{ bearerAuth: [] }],
            body: CreateBarberSchema,
        },
    }, async (request, reply) => {
        const input = CreateBarberSchema.parse(request.body);
        const created = await service.create(input);
        return reply.code(201).send(created);
    });

    app.put('/barbers/:id', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Barbeiros'],
            summary: 'Atualiza um barbeiro existente',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
            body: UpdateBarberSchema,
        },
    }, async (request) => {
        const { id } = request.params as { id: string };
        const input = UpdateBarberSchema.parse(request.body);
        return service.update(id, input);
    });

    app.delete('/barbers/:id', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Barbeiros'],
            summary: 'Exclui um barbeiro',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        await service.delete(id);
        return reply.code(204).send();
    });
}
