import '@fastify/jwt';
import type { AccountRole } from '../domain/account.js';

declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: { sub: string; email: string; role: AccountRole };
        user: { sub: string; email: string; role: AccountRole };
    }
}
