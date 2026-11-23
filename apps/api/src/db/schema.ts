import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar, primaryKey } from 'drizzle-orm/mysql-core';
import { randomUUID } from 'node:crypto';

// These names must match the columns created by infra/mysql/init.sql.  The
// TypeScript property names remain descriptive while the database keeps the
// stable `role` and `status` column names.
export const userRoleEnum = mysqlEnum('role', ['CUSTOMER', 'EMPLOYEE', 'ADMIN']);
export const appointmentStatusEnum = mysqlEnum('status', ['SCHEDULED', 'COMPLETED', 'CANCELLED']);
export const paymentMethodEnum = mysqlEnum('payment_method', ['PIX', 'CASH', 'CARD']);
export const productReservationStatusEnum = mysqlEnum('status', ['RESERVED']);

export const users = mysqlTable('users', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 254 }).notNull(),
    cpf: varchar('cpf', { length: 11 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum.notNull().default('CUSTOMER'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => [
    uniqueIndex('users_email_unique').on(table.email),
    uniqueIndex('users_cpf_unique').on(table.cpf),
]);

export const refreshSessions = mysqlTable('refresh_sessions', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    userId: varchar('user_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    revokedAt: timestamp('revoked_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
    uniqueIndex('refresh_sessions_token_hash_unique').on(table.tokenHash),
]);

export const barbers = mysqlTable('barbers', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    name: varchar('name', { length: 100 }).notNull(),
    cpf: varchar('cpf', { length: 11 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    specialty: varchar('specialty', { length: 100 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow().onUpdateNow(),
}, (table) => [
    uniqueIndex('barbers_cpf_unique').on(table.cpf),
]);

export const services = mysqlTable('services', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 255 }).notNull().default(''),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    durationMinutes: int('duration_minutes').notNull().default(30),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const appointments = mysqlTable('appointments', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    customerId: varchar('customer_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'restrict' }),
    barberId: varchar('barber_id', { length: 36 }).notNull().references(() => barbers.id, { onDelete: 'restrict' }),
    startsAt: timestamp('starts_at').notNull(),
    status: appointmentStatusEnum.notNull().default('SCHEDULED'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const appointmentServices = mysqlTable('appointment_services', {
    appointmentId: varchar('appointment_id', { length: 36 }).notNull().references(() => appointments.id, { onDelete: 'cascade' }),
    serviceId: varchar('service_id', { length: 36 }).notNull().references(() => services.id, { onDelete: 'restrict' }),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
}, (table) => [
    primaryKey({ columns: [table.appointmentId, table.serviceId] }),
]);

export const products = mysqlTable('products', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    name: varchar('name', { length: 100 }).notNull(),
    description: varchar('description', { length: 255 }).notNull().default(''),
    category: varchar('category', { length: 60 }).notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    stock: int('stock').notNull().default(0),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const productReservations = mysqlTable('product_reservations', {
    id: varchar('id', { length: 36 }).primaryKey().$defaultFn(() => randomUUID()),
    customerId: varchar('customer_id', { length: 36 }).notNull().references(() => users.id, { onDelete: 'restrict' }),
    paymentMethod: paymentMethodEnum.notNull(),
    status: productReservationStatusEnum.notNull().default('RESERVED'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const productReservationItems = mysqlTable('product_reservation_items', {
    reservationId: varchar('reservation_id', { length: 36 }).notNull().references(() => productReservations.id, { onDelete: 'cascade' }),
    productId: varchar('product_id', { length: 36 }).notNull().references(() => products.id, { onDelete: 'restrict' }),
    quantity: int('quantity').notNull(),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
}, (table) => [
    primaryKey({ columns: [table.reservationId, table.productId] }),
]);
