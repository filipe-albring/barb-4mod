import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../db/client.js';
import { appointments, appointmentServices, barbers, services, users } from '../db/schema.js';
import type { AppointmentResponse, CreateAppointmentInput, UpdateAppointmentInput } from '@barbearia/contracts';
import { Appointment } from '../domain/entities/Appointment.js';
import { NotFoundError, ValidationError } from '../domain/exceptions/AppError.js';
import type { PaginatedResult, PaginationFilter } from '../domain/repositories/IRepository.js';

export class AppointmentService {
    async findAll(filter: PaginationFilter, customerId?: string): Promise<PaginatedResult<AppointmentResponse>> {
        const page = Math.max(1, filter.page);
        const limit = Math.max(1, Math.min(100, filter.limit));
        const offset = (page - 1) * limit;

        const whereCondition = customerId ? eq(appointments.customerId, customerId) : undefined;

        const [totalResult] = await db
            .select({ total: count() })
            .from(appointments)
            .where(whereCondition);

        const total = totalResult?.total ?? 0;
        const totalPages = Math.ceil(total / limit) || 1;

        const apptRows = await db
            .select({
                id: appointments.id,
                customerId: appointments.customerId,
                customerName: users.name,
                barberId: appointments.barberId,
                barberName: barbers.name,
                startsAt: appointments.startsAt,
                status: appointments.status,
                createdAt: appointments.createdAt,
            })
            .from(appointments)
            .innerJoin(users, eq(appointments.customerId, users.id))
            .innerJoin(barbers, eq(appointments.barberId, barbers.id))
            .where(whereCondition)
            .orderBy(desc(appointments.startsAt))
            .limit(limit)
            .offset(offset);

        if (apptRows.length === 0) {
            return { data: [], page, limit, total, totalPages };
        }

        const apptIds = apptRows.map((r) => r.id);
        const serviceRows = await db
            .select({
                appointmentId: appointmentServices.appointmentId,
                serviceId: appointmentServices.serviceId,
                name: services.name,
                unitPrice: appointmentServices.unitPrice,
            })
            .from(appointmentServices)
            .innerJoin(services, eq(appointmentServices.serviceId, services.id))
            .where(inArray(appointmentServices.appointmentId, apptIds));

        const data: AppointmentResponse[] = apptRows.map((appt) => {
            const apptSvcs = serviceRows
                .filter((s) => s.appointmentId === appt.id)
                .map((s) => ({
                    serviceId: s.serviceId,
                    name: s.name,
                    unitPrice: Number(s.unitPrice),
                }));
            const totalPrice = apptSvcs.reduce((acc, curr) => acc + curr.unitPrice, 0);

            return {
                id: appt.id,
                customerId: appt.customerId,
                customerName: appt.customerName,
                barberId: appt.barberId,
                barberName: appt.barberName,
                startsAt: appt.startsAt.toISOString(),
                status: appt.status,
                totalPrice,
                services: apptSvcs,
                createdAt: appt.createdAt.toISOString(),
            };
        });

        return { data, page, limit, total, totalPages };
    }

    async findById(id: string): Promise<AppointmentResponse> {
        const [appt] = await db
            .select({
                id: appointments.id,
                customerId: appointments.customerId,
                customerName: users.name,
                barberId: appointments.barberId,
                barberName: barbers.name,
                startsAt: appointments.startsAt,
                status: appointments.status,
                createdAt: appointments.createdAt,
            })
            .from(appointments)
            .innerJoin(users, eq(appointments.customerId, users.id))
            .innerJoin(barbers, eq(appointments.barberId, barbers.id))
            .where(eq(appointments.id, id))
            .limit(1);

        if (!appt) throw new NotFoundError('Agendamento');

        const serviceRows = await db
            .select({
                serviceId: appointmentServices.serviceId,
                name: services.name,
                unitPrice: appointmentServices.unitPrice,
            })
            .from(appointmentServices)
            .innerJoin(services, eq(appointmentServices.serviceId, services.id))
            .where(eq(appointmentServices.appointmentId, id));

        const apptSvcs = serviceRows.map((s) => ({
            serviceId: s.serviceId,
            name: s.name,
            unitPrice: Number(s.unitPrice),
        }));
        const totalPrice = apptSvcs.reduce((acc, curr) => acc + curr.unitPrice, 0);

        return {
            id: appt.id,
            customerId: appt.customerId,
            customerName: appt.customerName,
            barberId: appt.barberId,
            barberName: appt.barberName,
            startsAt: appt.startsAt.toISOString(),
            status: appt.status,
            totalPrice,
            services: apptSvcs,
            createdAt: appt.createdAt.toISOString(),
        };
    }

    async create(input: CreateAppointmentInput): Promise<AppointmentResponse> {
        // Valida se cliente existe
        const [customer] = await db.select().from(users).where(eq(users.id, input.customerId)).limit(1);
        if (!customer) throw new NotFoundError('Cliente associado ao agendamento');

        // Valida se barbeiro existe
        const [barber] = await db.select().from(barbers).where(eq(barbers.id, input.barberId)).limit(1);
        if (!barber) throw new NotFoundError('Barbeiro associado ao agendamento');

        // Busca serviços
        const selectedServices = await db.select().from(services).where(inArray(services.id, input.serviceIds));
        if (selectedServices.length === 0) {
            throw new ValidationError('Ao menos um serviço válido deve ser selecionado.');
        }

        const domain = new Appointment(
            input.customerId,
            input.barberId,
            new Date(input.startsAt),
            'SCHEDULED',
            selectedServices.map((s) => ({ serviceId: s.id, name: s.name, unitPrice: Number(s.price) })),
        );

        const appointmentId = domain.id;

        await db.insert(appointments).values({
            id: appointmentId,
            customerId: domain.customerId,
            barberId: domain.barberId,
            startsAt: domain.startsAt,
            status: domain.status,
        });

        for (const svc of selectedServices) {
            await db.insert(appointmentServices).values({
                appointmentId,
                serviceId: svc.id,
                unitPrice: svc.price,
            });
        }

        return this.findById(appointmentId);
    }

    async update(id: string, input: UpdateAppointmentInput): Promise<AppointmentResponse> {
        await this.findById(id);

        const [barber] = await db.select().from(barbers).where(eq(barbers.id, input.barberId)).limit(1);
        if (!barber) throw new NotFoundError('Barbeiro');

        const selectedServices = await db.select().from(services).where(inArray(services.id, input.serviceIds));
        if (selectedServices.length === 0) {
            throw new ValidationError('Ao menos um serviço válido deve ser selecionado.');
        }

        await db.update(appointments)
            .set({
                barberId: input.barberId,
                startsAt: new Date(input.startsAt),
                status: input.status,
            })
            .where(eq(appointments.id, id));

        // Atualiza os serviços associados
        await db.delete(appointmentServices).where(eq(appointmentServices.appointmentId, id));
        for (const svc of selectedServices) {
            await db.insert(appointmentServices).values({
                appointmentId: id,
                serviceId: svc.id,
                unitPrice: svc.price,
            });
        }

        return this.findById(id);
    }

    async delete(id: string): Promise<void> {
        await this.findById(id);
        await db.delete(appointments).where(eq(appointments.id, id));
    }
}
