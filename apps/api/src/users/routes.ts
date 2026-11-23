import type { FastifyInstance } from 'fastify';
import { UpdateUserSchema } from '@barbearia/contracts';
import { authenticate, requireRoles } from '../auth/security.js';
import { UserService } from '../services/UserService.js';
import { AppointmentService } from '../services/AppointmentService.js';

export async function registerUserRoutes(app: FastifyInstance): Promise<void> {
    const userService = new UserService();
    const appointmentService = new AppointmentService();

    app.get('/users/me', {
        preHandler: authenticate,
        schema: {
            tags: ['Usuários'],
            summary: 'Retorna o perfil do próprio usuário autenticado',
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        return userService.getProfile(request.user.sub);
    });

    app.put('/users/me', {
        preHandler: authenticate,
        schema: {
            tags: ['Usuários'],
            summary: 'Edição do próprio usuário (todos os campos obrigatórios, bloqueio de alteração de e-mail)',
            security: [{ bearerAuth: [] }],
            body: UpdateUserSchema,
        },
    }, async (request) => {
        const input = UpdateUserSchema.parse(request.body);
        return userService.updateProfile(request.user.sub, input);
    });

    app.get('/users/me/appointments', {
        preHandler: requireRoles('CUSTOMER'),
        schema: {
            tags: ['Usuários'],
            summary: 'Lista apenas os agendamentos do cliente autenticado',
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => {
        const result = await appointmentService.findAll({ page: 1, limit: 50 }, request.user.sub);
        return result.data;
    });
}
