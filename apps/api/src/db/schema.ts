import { boolean, char, check, decimal, index, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid, varchar, primaryKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const userRole = pgEnum('user_role', ['CUSTOMER', 'EMPLOYEE', 'ADMIN']);
export const appointmentStatus = pgEnum('appointment_status', ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'NO_SHOW']);

export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 120 }).notNull(),
    email: varchar('email', { length: 254 }).notNull(),
    cpf: char('cpf', { length: 11 }).notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull().default('CUSTOMER'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('users_email_unique').on(table.email), uniqueIndex('users_cpf_unique').on(table.cpf)]);

export const refreshSessions = pgTable('refresh_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: char('token_hash', { length: 64 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex('refresh_sessions_token_hash_unique').on(table.tokenHash), index('refresh_sessions_user_id_idx').on(table.userId)]);

export const services = pgTable('services', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 100 }).notNull(),
    price: decimal('price', { precision: 10, scale: 2 }).notNull(),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [check('services_price_nonnegative', sql`${table.price} >= 0`)]);

export const appointments = pgTable('appointments', {
    id: uuid('id').defaultRandom().primaryKey(),
    customerId: uuid('customer_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    employeeId: uuid('employee_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    status: appointmentStatus('status').notNull().default('SCHEDULED'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index('appointments_starts_at_idx').on(table.startsAt), index('appointments_employee_date_idx').on(table.employeeId, table.startsAt)]);

export const appointmentServices = pgTable('appointment_services', {
    appointmentId: uuid('appointment_id').notNull().references(() => appointments.id, { onDelete: 'cascade' }),
    serviceId: uuid('service_id').notNull().references(() => services.id, { onDelete: 'restrict' }),
    unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
}, (table) => [
    primaryKey({ columns: [table.appointmentId, table.serviceId] }),
    check('appointment_services_unit_price_nonnegative', sql`${table.unitPrice} >= 0`),
]);
