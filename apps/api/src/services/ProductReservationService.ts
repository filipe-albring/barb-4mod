import { desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import type { CreateProductReservationInput, ProductReservationResponse } from '@barbearia/contracts';
import { db } from '../db/client.js';
import { productReservationItems, productReservations, products } from '../db/schema.js';
import { NotFoundError, ValidationError } from '../domain/exceptions/AppError.js';

export class ProductReservationService {
    async findAll(customerId?: string): Promise<ProductReservationResponse[]> {
        const reservationRows = await db
            .select()
            .from(productReservations)
            .where(customerId ? eq(productReservations.customerId, customerId) : undefined)
            .orderBy(desc(productReservations.createdAt));

        if (reservationRows.length === 0) return [];

        const reservationIds = reservationRows.map((reservation) => reservation.id);
        const itemRows = await db
            .select({
                reservationId: productReservationItems.reservationId,
                productId: productReservationItems.productId,
                name: products.name,
                quantity: productReservationItems.quantity,
                unitPrice: productReservationItems.unitPrice,
            })
            .from(productReservationItems)
            .innerJoin(products, eq(productReservationItems.productId, products.id))
            .where(inArray(productReservationItems.reservationId, reservationIds));

        return reservationRows.map((reservation) => {
            const items = itemRows
                .filter((item) => item.reservationId === reservation.id)
                .map((item) => ({
                    productId: item.productId,
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                }));

            return {
                id: reservation.id,
                customerId: reservation.customerId,
                paymentMethod: reservation.paymentMethod,
                status: reservation.status,
                totalPrice: items.reduce((total, item) => total + item.quantity * item.unitPrice, 0),
                createdAt: reservation.createdAt.toISOString(),
                items,
            };
        });
    }

    async create(customerId: string, input: CreateProductReservationInput): Promise<ProductReservationResponse> {
        const reservationId = randomUUID();

        await db.transaction(async (tx) => {
            const reservedItems: Array<{ productId: string; quantity: number; stock: number; unitPrice: string }> = [];

            for (const item of input.items) {
                const [product] = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1).for('update');

                if (!product) throw new NotFoundError('Produto');
                if (!product.active) throw new ValidationError(`O produto ${product.name} não está disponível para reserva.`);
                if (product.stock < item.quantity) {
                    throw new ValidationError(`Estoque insuficiente para ${product.name}. Disponível: ${product.stock}.`);
                }

                reservedItems.push({
                    productId: product.id,
                    quantity: item.quantity,
                    stock: product.stock,
                    unitPrice: product.price,
                });
            }

            await tx.insert(productReservations).values({
                id: reservationId,
                customerId,
                paymentMethod: input.paymentMethod,
                status: 'RESERVED',
            });

            await tx.insert(productReservationItems).values(reservedItems.map((item) => ({
                reservationId,
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
            })));

            for (const item of reservedItems) {
                await tx.update(products).set({ stock: item.stock - item.quantity }).where(eq(products.id, item.productId));
            }
        });

        const reservation = (await this.findAll(customerId)).find((item) => item.id === reservationId);
        if (!reservation) {
            throw new NotFoundError('Reserva de produto');
        }
        return reservation;
    }
}
