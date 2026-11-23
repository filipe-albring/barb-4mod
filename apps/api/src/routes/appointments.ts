import type { FastifyInstance } from 'fastify';
import { CreateAppointmentSchema, PaginationQuerySchema, UpdateAppointmentSchema } from '@barbearia/contracts';
import { z } from 'zod';
import { authenticate, requireRoles } from '../auth/security.js';
import { AppointmentService } from '../services/AppointmentService.js';
import { ForbiddenError } from '../domain/exceptions/AppError.js';

export async function registerAppointmentRoutes(app: FastifyInstance): Promise<void> {
    const service = new AppointmentService();

    app.get('/appointments', {
        preHandler: requireRoles('CUSTOMER', 'ADMIN'),
        schema: {
            tags: ['Agendamentos'],
            summary: 'Lista agendamentos de forma paginada',
            security: [{ bearerAuth: [] }],
            querystring: PaginationQuerySchema,
        },
    }, async (request) => {
        const query = PaginationQuerySchema.parse(request.query);
        const customerId = request.user.role === 'CUSTOMER' ? request.user.sub : undefined;
        return service.findAll(query, customerId);
    });

    app.get('/appointments/:id', {
        preHandler: requireRoles('CUSTOMER', 'ADMIN'),
        schema: {
            tags: ['Agendamentos'],
            summary: 'Busca um agendamento por ID',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
        },
    }, async (request) => {
        const { id } = request.params as { id: string };
        const appointment = await service.findById(id);
        if (request.user.role === 'CUSTOMER' && appointment.customerId !== request.user.sub) {
            throw new ForbiddenError('Você só pode consultar os seus próprios agendamentos.');
        }
        return appointment;
    });

    app.post('/appointments', {
        preHandler: requireRoles('CUSTOMER'),
        schema: {
            tags: ['Agendamentos'],
            summary: 'Cria um novo agendamento com relacionamento entre cliente, barbeiro e serviços',
            security: [{ bearerAuth: [] }],
            body: CreateAppointmentSchema,
        },
    }, async (request, reply) => {
        const input = CreateAppointmentSchema.parse(request.body);
        // Se for cliente autenticado, vincula automaticamente ao próprio ID
        if (request.user.role === 'CUSTOMER') {
            input.customerId = request.user.sub;
        }
        const created = await service.create(input);
        return reply.code(201).send(created);
    });

    app.put('/appointments/:id', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Agendamentos'],
            summary: 'Atualiza um agendamento',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
            body: UpdateAppointmentSchema,
        },
    }, async (request) => {
        const { id } = request.params as { id: string };
        const input = UpdateAppointmentSchema.parse(request.body);
        return service.update(id, input);
    });

    app.delete('/appointments/:id', {
        preHandler: requireRoles('CUSTOMER', 'ADMIN'),
        schema: {
            tags: ['Agendamentos'],
            summary: 'Exclui ou cancela um agendamento',
            security: [{ bearerAuth: [] }],
            params: z.object({ id: z.string() }),
        },
    }, async (request, reply) => {
        const { id } = request.params as { id: string };
        if (request.user.role === 'CUSTOMER') {
            const appointment = await service.findById(id);
            if (appointment.customerId !== request.user.sub) {
                throw new ForbiddenError('Você só pode cancelar os seus próprios agendamentos.');
            }
        }
        await service.delete(id);
        return reply.code(204).send();
    });
}
