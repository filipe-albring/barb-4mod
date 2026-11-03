import Fastify from 'fastify';
import type { FastifyError } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { jsonSchemaTransform, serializerCompiler, validatorCompiler, ZodTypeProvider } from 'fastify-type-provider-zod';
import { registerAuthRoutes } from './auth/routes.js';
import { registerDashboardRoutes } from './dashboard/routes.js';
import { registerUserRoutes } from './users/routes.js';

export async function buildApp() {
    const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(cors, {
        origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
        credentials: true,
    });
    await app.register(cookie);
    await app.register(jwt, { secret: process.env.JWT_ACCESS_SECRET ?? '' });
    await app.register(swagger, {
        openapi: {
            info: { title: 'Barbearia Prime API', version: '1.0.0', description: 'API de autenticação e dashboard da barbearia.' },
            components: {
                securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
            },
        },
        transform: jsonSchemaTransform,
    });
    await app.register(swaggerUi, { routePrefix: '/docs' });

    app.get('/health', { schema: { tags: ['Sistema'], summary: 'Verifica se a API está disponível' } }, async () => ({ status: 'ok' }));
    await app.register(registerAuthRoutes);
    await app.register(registerUserRoutes);
    await app.register(registerDashboardRoutes);

    app.setErrorHandler((error: FastifyError, request, reply) => {
        request.log.error({ err: error }, 'Falha ao processar requisição');

        if (error.validation) {
            return reply.code(400).send({
                message: 'Revise os dados informados.',
                issues: error.validation.map((issue) => ({ path: issue.instancePath, message: issue.message })),
            });
        }

        if (error.statusCode === 401) {
            return reply.code(401).send({ message: 'Autenticação necessária ou sessão expirada.' });
        }

        return reply.code(error.statusCode ?? 500).send({
            message: error.statusCode && error.statusCode < 500 ? error.message : 'Ocorreu um erro interno. Tente novamente.',
        });
    });

    return app;
}
