import type { FastifyInstance } from 'fastify';
import { CreateProductReservationSchema } from '@barbearia/contracts';
import { requireRoles } from '../auth/security.js';
import { ProductReservationService } from '../services/ProductReservationService.js';

export async function registerProductReservationRoutes(app: FastifyInstance): Promise<void> {
    const service = new ProductReservationService();

    app.post('/product-reservations', {
        preHandler: requireRoles('CUSTOMER'),
        schema: {
            tags: ['Reservas de Produtos'],
            summary: 'Reserva produtos para retirada e pagamento presencial',
            security: [{ bearerAuth: [] }],
            body: CreateProductReservationSchema,
        },
    }, async (request, reply) => {
        const input = CreateProductReservationSchema.parse(request.body);
        const reservation = await service.create(request.user.sub, input);
        return reply.code(201).send(reservation);
    });

    app.get('/product-reservations/me', {
        preHandler: requireRoles('CUSTOMER'),
        schema: {
            tags: ['Reservas de Produtos'],
            summary: 'Lista as reservas de retirada do cliente autenticado',
            security: [{ bearerAuth: [] }],
        },
    }, async (request) => service.findAll(request.user.sub));

    app.get('/product-reservations', {
        preHandler: requireRoles('ADMIN'),
        schema: {
            tags: ['Reservas de Produtos'],
            summary: 'Lista reservas de produtos para preparação pela barbearia',
            security: [{ bearerAuth: [] }],
        },
    }, async () => service.findAll());
}
