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
import { registerBarberRoutes } from './routes/barbers.js';
import { registerServiceRoutes } from './routes/services.js';
import { registerAppointmentRoutes } from './routes/appointments.js';
import { registerProductRoutes } from './routes/products.js';
import { registerProductReservationRoutes } from './routes/product-reservations.js';
import { AppError } from './domain/exceptions/AppError.js';

export async function buildApp() {
    const app = Fastify({ logger: true }).withTypeProvider<ZodTypeProvider>();
    app.setValidatorCompiler(validatorCompiler);
    app.setSerializerCompiler(serializerCompiler);

    await app.register(cors, {
        origin: true,
        credentials: true,
    });
    await app.register(cookie);
    await app.register(jwt, { secret: process.env.JWT_ACCESS_SECRET ?? 'barbearia-prime-secret-key-min-32-characters-length' });
    await app.register(swagger, {
        openapi: {
            info: {
                title: 'Barbearia Prime API',
                version: '2.0.0',
                description: 'API RESTful completa com autenticação, gestão de barbeiros, serviços, agendamentos e produtos.',
            },
            components: {
                securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
            },
        },
        transform: jsonSchemaTransform,
    });
    await app.register(swaggerUi, { routePrefix: '/docs' });

    app.get('/health', { schema: { tags: ['Sistema'], summary: 'Verifica status da API' } }, async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

    // Registro das rotas
    await app.register(registerAuthRoutes);
    await app.register(registerUserRoutes);
    await app.register(registerBarberRoutes);
    await app.register(registerServiceRoutes);
    await app.register(registerAppointmentRoutes);
    await app.register(registerProductRoutes);
    await app.register(registerProductReservationRoutes);
    await app.register(registerDashboardRoutes);

    // Tratamento global de exceções
    app.setErrorHandler((error: FastifyError | AppError | Error, request, reply) => {
        request.log.error({ err: error }, 'Erro capturado no pipeline da requisição');

        if (error instanceof AppError) {
            return reply.code(error.statusCode).send({ message: error.message });
        }

        const fastifyErr = error as FastifyError;
        if (fastifyErr.validation) {
            return reply.code(400).send({
                message: 'Dados informados inválidos.',
                issues: fastifyErr.validation.map((issue) => ({ path: issue.instancePath, message: issue.message })),
            });
        }

        if (fastifyErr.statusCode === 401) {
            return reply.code(401).send({ message: 'Autenticação necessária ou sessão expirada.' });
        }

        if (fastifyErr.statusCode === 403) {
            return reply.code(403).send({ message: 'Acesso negado para o seu perfil.' });
        }

        const statusCode = fastifyErr.statusCode ?? 500;
        return reply.code(statusCode).send({
            message: statusCode < 500 ? fastifyErr.message : 'Ocorreu um erro interno. Tente novamente mais tarde.',
        });
    });

    return app;
}
