import type { FastifyInstance } from 'fastify';
import { DashboardQuerySchema } from '@barbearia/contracts';
import { pool } from '../db/client.js';
import { requireRoles } from '../auth/security.js';
import type { RowDataPacket } from 'mysql2';

interface DailyMetricRow extends RowDataPacket {
    day: string;
    appointments: number;
    revenue: number;
}

interface ServiceMetricRow extends RowDataPacket {
    service: string;
    appointments: number;
    revenue: number;
}

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
        const params: (number | string)[] = [query.period];

        let extraFilter = '';
        if (request.user.role === 'EMPLOYEE') {
            extraFilter = ' AND a.barber_id = ?';
            params.push(request.user.sub);
        } else if (request.user.role === 'ADMIN' && query.staffId) {
            extraFilter = ' AND a.barber_id = ?';
            params.push(query.staffId);
        }

        const [dailyRows] = await pool.query<DailyMetricRow[]>(
            `SELECT
                DATE_FORMAT(a.starts_at, '%Y-%m-%d') AS day,
                COUNT(DISTINCT a.id) AS appointments,
                COALESCE(SUM(aps.unit_price), 0) AS revenue
            FROM appointments a
            LEFT JOIN appointment_services aps ON aps.appointment_id = a.id
            WHERE a.starts_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
              AND a.status IN ('SCHEDULED', 'COMPLETED')
              ${extraFilter}
            GROUP BY DATE_FORMAT(a.starts_at, '%Y-%m-%d')
            ORDER BY day ASC`,
            params,
        );

        const [serviceRows] = await pool.query<ServiceMetricRow[]>(
            `SELECT
                s.name AS service,
                COUNT(DISTINCT a.id) AS appointments,
                COALESCE(SUM(aps.unit_price), 0) AS revenue
            FROM appointments a
            INNER JOIN appointment_services aps ON aps.appointment_id = a.id
            INNER JOIN services s ON s.id = aps.service_id
            WHERE a.starts_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
              AND a.status IN ('SCHEDULED', 'COMPLETED')
              ${extraFilter}
            GROUP BY s.id, s.name
            ORDER BY appointments DESC, revenue DESC
            LIMIT 8`,
            params,
        );

        const daily = (dailyRows || []).map((row) => ({
            day: String(row.day),
            appointments: Number(row.appointments),
            revenue: Number(row.revenue),
        }));

        const services = (serviceRows || []).map((row) => ({
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
                bestDay: daily.reduce<{ day: string; appointments: number; revenue: number } | null>(
                    (best, item) => !best || item.appointments > best.appointments ? item : best,
                    null,
                )?.day ?? null,
                topService: services[0]?.service ?? null,
            },
            daily,
            services,
        };
    });
}
