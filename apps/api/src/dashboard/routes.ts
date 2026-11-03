import { sql } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { DashboardQuerySchema } from '@barbearia/contracts';
import { db } from '../db/client.js';
import { requireRoles } from '../auth/security.js';

type DailyMetricRow = Record<string, unknown> & {
    day: string;
    appointments: number | string;
    revenue: number | string;
};

type ServiceMetricRow = Record<string, unknown> & {
    service: string;
    appointments: number | string;
    revenue: number | string;
};

export async function registerDashboardRoutes(app: FastifyInstance): Promise<void> {
    app.get('/dashboard/analytics', {
        preHandler: requireRoles('EMPLOYEE', 'ADMIN'),
        schema: {
            tags: ['Dashboard'],
            summary: 'Retorna métricas de agenda e serviços para o período',
            security: [{ bearerAuth: [] }],
            querystring: DashboardQuerySchema,
        },
    }, async (request) => {
        const query = DashboardQuerySchema.parse(request.query);
        const podeFiltrarEquipe = request.user.role === 'ADMIN' && query.staffId;
        const filtroEquipe = request.user.role === 'EMPLOYEE'
            ? sql`AND a.employee_id = ${request.user.sub}::uuid`
            : podeFiltrarEquipe
                ? sql`AND a.employee_id = ${query.staffId}::uuid`
                : sql``;

        const dailyResult = await db.execute<DailyMetricRow>(sql`
            SELECT
                to_char((a.starts_at AT TIME ZONE 'America/Sao_Paulo')::date, 'YYYY-MM-DD') AS day,
                COUNT(DISTINCT a.id)::int AS appointments,
                COALESCE(SUM(aps.unit_price), 0)::numeric AS revenue
            FROM appointments a
            LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
            WHERE a.starts_at >= (((now() AT TIME ZONE 'America/Sao_Paulo')::date - (${query.period} - 1))::timestamp AT TIME ZONE 'America/Sao_Paulo')
                AND a.starts_at < (((now() AT TIME ZONE 'America/Sao_Paulo')::date + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
                AND a.status IN ('SCHEDULED', 'COMPLETED')
                ${filtroEquipe}
            GROUP BY (a.starts_at AT TIME ZONE 'America/Sao_Paulo')::date
            ORDER BY (a.starts_at AT TIME ZONE 'America/Sao_Paulo')::date
        `);

        const serviceResult = await db.execute<ServiceMetricRow>(sql`
            SELECT
                s.name AS service,
                COUNT(DISTINCT a.id)::int AS appointments,
                COALESCE(SUM(aps.unit_price), 0)::numeric AS revenue
            FROM appointments a
            INNER JOIN appointment_services aps ON aps.appointment_id = a.id
            INNER JOIN services s ON s.id = aps.service_id
            WHERE a.starts_at >= (((now() AT TIME ZONE 'America/Sao_Paulo')::date - (${query.period} - 1))::timestamp AT TIME ZONE 'America/Sao_Paulo')
                AND a.starts_at < (((now() AT TIME ZONE 'America/Sao_Paulo')::date + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')
                AND a.status IN ('SCHEDULED', 'COMPLETED')
                ${filtroEquipe}
            GROUP BY s.id, s.name
            ORDER BY appointments DESC, revenue DESC
            LIMIT 8
        `);

        const daily = dailyResult.rows.map((row) => ({
            day: String(row.day),
            appointments: Number(row.appointments),
            revenue: Number(row.revenue),
        }));
        const services = serviceResult.rows.map((row) => ({
            service: String(row.service),
            appointments: Number(row.appointments),
            revenue: Number(row.revenue),
        }));

        return {
            period: query.period,
            generatedAt: new Date().toISOString(),
            summary: {
                appointments: daily.reduce((total, item) => total + item.appointments, 0),
                projectedRevenue: daily.reduce((total, item) => total + item.revenue, 0),
                bestDay: daily.reduce<DailyMetricRow | null>(
                    (best, item) => !best || item.appointments > Number(best.appointments) ? item : best,
                    null,
                )?.day ?? null,
                topService: services[0]?.service ?? null,
            },
            daily,
            services,
        };
    });
}
