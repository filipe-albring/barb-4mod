import { eq } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { db } from '../db/client.js';
import { appointments, users } from '../db/schema.js';
import { authenticate, requireRoles } from '../auth/security.js';

export async function registerUserRoutes(app: FastifyInstance): Promise<void> {
    app.get('/users/me', {
        preHandler: authenticate,
        schema: { tags: ['Usuários'], summary: 'Retorna somente o perfil do usuário autenticado', security: [{ bearerAuth: [] }] },
    }, async (request, reply) => {
        const [user] = await db.select({
            id: users.id,
            name: users.name,
            email: users.email,
            cpf: users.cpf,
            role: users.role,
            createdAt: users.createdAt,
        }).from(users).where(eq(users.id, request.user.sub)).limit(1);

        if (!user) return reply.code(404).send({ message: 'Usuário não encontrado.' });
        return user;
    });

    app.get('/users/me/appointments', {
        preHandler: requireRoles('CUSTOMER'),
        schema: { tags: ['Usuários'], summary: 'Lista apenas os agendamentos do cliente autenticado', security: [{ bearerAuth: [] }] },
    }, async (request) => {
        return db.select({
            id: appointments.id,
            startsAt: appointments.startsAt,
            status: appointments.status,
        }).from(appointments).where(eq(appointments.customerId, request.user.sub))
            .orderBy(appointments.startsAt);
    });
}
