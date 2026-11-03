import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import { Account, type AccountRole } from '../domain/account.js';

export const authenticate: preHandlerHookHandler = async (request: FastifyRequest): Promise<void> => {
    await request.jwtVerify();
};

export function requireRoles(...roles: AccountRole[]): preHandlerHookHandler {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
        await request.jwtVerify();
        const account = new Account(request.user.role);

        if (!account.canAccess(roles)) {
            await reply.code(403).send({ message: 'Seu perfil não tem permissão para acessar este recurso.' });
        }
    };
}
