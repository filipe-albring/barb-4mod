import { eq, isNull, and, gt } from 'drizzle-orm';
import type { FastifyInstance, FastifyReply } from 'fastify';
import { LoginSchema, RegisterSchema, RegisterResponseSchema } from '@barbearia/contracts';
import { z } from 'zod';
import { db } from '../db/client.js';
import { refreshSessions, users } from '../db/schema.js';
import { Cpf, hashRefreshToken, newRefreshToken, PasswordCredential } from '../domain/account.js';
import { authenticate, requireRoles } from './security.js';
import { ConflictError, UnauthorizedError } from '../domain/exceptions/AppError.js';
import { randomUUID } from 'node:crypto';

const refreshLifetimeSeconds = 60 * 60 * 24 * 30;
const refreshCookieName = 'barbearia_refresh';
const ErrorResponseSchema = z.object({ message: z.string() });
const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/auth',
};

async function emitirSessao(app: FastifyInstance, reply: FastifyReply, user: typeof users.$inferSelect): Promise<void> {
    const rawRefreshToken = newRefreshToken();
    const expiresAt = new Date(Date.now() + refreshLifetimeSeconds * 1000);
    const sessionId = randomUUID();

    await db.insert(refreshSessions).values({
        id: sessionId,
        userId: user.id,
        tokenHash: hashRefreshToken(rawRefreshToken),
        expiresAt,
    });

    reply.setCookie(refreshCookieName, rawRefreshToken, {
        ...refreshCookieOptions,
        maxAge: refreshLifetimeSeconds,
    });

    const accessToken = app.jwt.sign({ sub: user.id, email: user.email, role: user.role }, { expiresIn: '15m' });
    reply.send({
        accessToken,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
    app.post('/auth/register', {
        schema: {
            tags: ['Autenticação'],
            summary: 'Cria uma conta de cliente',
            body: RegisterSchema,
            response: { 201: RegisterResponseSchema, 409: ErrorResponseSchema },
        },
    }, async (request, reply) => {
        const input = RegisterSchema.parse(request.body);
        const cpf = new Cpf(input.cpf);
        const credential = PasswordCredential.fromPlainText(input.password);
        const passwordHash = await credential.hashForStorage();
        const id = randomUUID();

        try {
            await db.insert(users).values({
                id,
                name: input.name,
                email: input.email,
                cpf: cpf.toDatabaseValue(),
                passwordHash,
                role: 'CUSTOMER',
            });

            return reply.code(201).send({
                id,
                name: input.name,
                email: input.email,
                role: 'CUSTOMER',
            });
        } catch (error: unknown) {
            const err = error as { code?: string; errno?: number };
            if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
                throw new ConflictError('Já existe uma conta com este e-mail ou CPF.');
            }
            throw error;
        }
    });

    app.post('/auth/register/employee', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Autenticação'],
            summary: 'Cadastra um funcionário (somente administrador)',
            security: [{ bearerAuth: [] }],
            body: RegisterSchema,
            response: { 201: RegisterResponseSchema, 409: ErrorResponseSchema },
        },
    }, async (request, reply) => {
        const input = RegisterSchema.parse(request.body);
        const passwordHash = await PasswordCredential.fromPlainText(input.password).hashForStorage();
        const id = randomUUID();

        try {
            await db.insert(users).values({
                id,
                name: input.name,
                email: input.email,
                cpf: new Cpf(input.cpf).toDatabaseValue(),
                passwordHash,
                role: 'EMPLOYEE',
            });

            return reply.code(201).send({
                id,
                name: input.name,
                email: input.email,
                role: 'EMPLOYEE',
            });
        } catch (error: unknown) {
            const err = error as { code?: string; errno?: number };
            if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
                throw new ConflictError('Já existe uma conta com este e-mail ou CPF.');
            }
            throw error;
        }
    });

    app.post('/auth/login', {
        schema: {
            tags: ['Autenticação'],
            summary: 'Autentica cliente ou funcionário',
            body: LoginSchema,
        },
    }, async (request, reply) => {
        const input = LoginSchema.parse(request.body);
        const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

        if (!user) {
            throw new UnauthorizedError('E-mail ou senha incorretos.');
        }

        const credential = PasswordCredential.fromPlainText(input.password);
        const matches = await credential.matches(user.passwordHash);
        if (!matches) {
            throw new UnauthorizedError('E-mail ou senha incorretos.');
        }

        await emitirSessao(app, reply, user);
    });

    app.post('/auth/refresh', {
        schema: { tags: ['Autenticação'], summary: 'Renova a sessão usando cookie httpOnly' },
    }, async (request, reply) => {
        const rawToken = request.cookies[refreshCookieName];
        if (!rawToken) throw new UnauthorizedError('Sessão expirada. Entre novamente.');

        const tokenHash = hashRefreshToken(rawToken);
        const [session] = await db.select().from(refreshSessions).where(and(
            eq(refreshSessions.tokenHash, tokenHash),
            isNull(refreshSessions.revokedAt),
            gt(refreshSessions.expiresAt, new Date()),
        )).limit(1);

        if (!session) {
            reply.clearCookie(refreshCookieName, refreshCookieOptions);
            throw new UnauthorizedError('Sessão expirada. Entre novamente.');
        }

        const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
        if (!user) throw new UnauthorizedError('Conta não encontrada.');

        const novoToken = newRefreshToken();
        const agora = new Date();
        const newSessionId = randomUUID();

        await db.update(refreshSessions)
            .set({ revokedAt: agora })
            .where(eq(refreshSessions.id, session.id));

        await db.insert(refreshSessions).values({
            id: newSessionId,
            userId: user.id,
            tokenHash: hashRefreshToken(novoToken),
            expiresAt: new Date(Date.now() + refreshLifetimeSeconds * 1000),
        });

        reply.setCookie(refreshCookieName, novoToken, { ...refreshCookieOptions, maxAge: refreshLifetimeSeconds });
        const accessToken = app.jwt.sign({ sub: user.id, email: user.email, role: user.role }, { expiresIn: '15m' });
        return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
    });

    app.post('/auth/logout', {
        preHandler: authenticate,
        schema: { tags: ['Autenticação'], security: [{ bearerAuth: [] }] },
    }, async (request, reply) => {
        const token = request.cookies[refreshCookieName];
        if (token) {
            await db.update(refreshSessions)
                .set({ revokedAt: new Date() })
                .where(and(eq(refreshSessions.tokenHash, hashRefreshToken(token)), isNull(refreshSessions.revokedAt)));
        }

        reply.clearCookie(refreshCookieName, refreshCookieOptions);
        return reply.code(204).send();
    });
}
