import type { FastifyInstance } from 'fastify';
import { DashboardQuerySchema } from '@barbearia/contracts';
import { pool } from '../db/client.js';
import { requireRoles } from '../auth/security.js';
import type { RowDataPacket } from 'mysql2';
import { normalizeLegacyEncoding } from '../domain/text/normalizeLegacyEncoding.js';

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

interface ProductMetricRow extends RowDataPacket {
    product: string;
    quantity: number;
    revenue: number;
}

interface InventoryOverviewRow extends RowDataPacket {
    totalProducts: number;
    totalStock: number;
    totalStockValue: number;
}

export async function registerDashboardRoutes(app: FastifyInstance): Promise<void> {
    app.get('/dashboard/analytics', {
        preHandler: requireRoles('EMPLOYEE', 'ADMIN'),
        schema: {
            tags: ['Dashboard'],
            summary: 'Retorna métricas consolidadas de agenda, serviços e produtos para o período',
            security: [{ bearerAuth: [] }],
            querystring: DashboardQuerySchema,
        },
    }, async (request) => {
        const query = DashboardQuerySchema.parse(request.query);
        const appointmentParams: (number | string)[] = [query.period];

        let extraFilter = '';
        if (request.user.role === 'EMPLOYEE') {
            extraFilter = ' AND a.barber_id = ?';
            appointmentParams.push(request.user.sub);
        } else if (request.user.role === 'ADMIN' && query.staffId) {
            extraFilter = ' AND a.barber_id = ?';
            appointmentParams.push(query.staffId);
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
            appointmentParams,
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
            appointmentParams,
        );

        const [productRows] = await pool.query<ProductMetricRow[]>(
            `SELECT
                p.name AS product,
                COALESCE(SUM(pri.quantity), 0) AS quantity,
                COALESCE(SUM(pri.quantity * pri.unit_price), 0) AS revenue
            FROM product_reservations pr
            INNER JOIN product_reservation_items pri ON pri.reservation_id = pr.id
            INNER JOIN products p ON p.id = pri.product_id
            WHERE pr.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY p.id, p.name
            ORDER BY quantity DESC, revenue DESC
            LIMIT 8`,
            [query.period],
        );

        const [inventoryRows] = await pool.query<InventoryOverviewRow[]>(
            `SELECT
                COUNT(*) AS totalProducts,
                COALESCE(SUM(stock), 0) AS totalStock,
                COALESCE(SUM(stock * price), 0) AS totalStockValue
            FROM products
            WHERE active = TRUE`,
        );

        const daily = (dailyRows || []).map((row) => ({
            day: String(row.day),
            appointments: Number(row.appointments),
            revenue: Number(row.revenue),
        }));

        const services = (serviceRows || []).map((row) => ({
            service: normalizeLegacyEncoding(String(row.service)),
            appointments: Number(row.appointments),
            revenue: Number(row.revenue),
        }));

        const products = (productRows || []).map((row) => ({
            product: normalizeLegacyEncoding(String(row.product)),
            quantity: Number(row.quantity),
            revenue: Number(row.revenue),
        }));

        const inventoryData = inventoryRows?.[0] ?? {
            totalProducts: 0,
            totalStock: 0,
            totalStockValue: 0,
        };

        const inventory = {
            totalProducts: Number(inventoryData.totalProducts || 0),
            totalStock: Number(inventoryData.totalStock || 0),
            totalStockValue: Number(inventoryData.totalStockValue || 0),
        };

        const servicesRevenue = daily.reduce((total, item) => total + item.revenue, 0);
        const productsRevenue = products.reduce((total, item) => total + item.revenue, 0);
        const productsSold = products.reduce((total, item) => total + item.quantity, 0);

        return {
            period: query.period,
            generatedAt: new Date().toISOString(),
            summary: {
                appointments: daily.reduce((total, item) => total + item.appointments, 0),
                projectedRevenue: servicesRevenue,
                servicesRevenue,
                productsRevenue,
                totalRevenue: servicesRevenue + productsRevenue,
                bestDay: daily.reduce<{ day: string; appointments: number; revenue: number } | null>(
                    (best, item) => !best || item.appointments > best.appointments ? item : best,
                    null,
                )?.day ?? null,
                topService: services[0]?.service ?? null,
                topProduct: products[0]?.product ?? null,
                totalProducts: inventory.totalProducts,
                totalStock: inventory.totalStock,
                totalStockValue: inventory.totalStockValue,
                productsSold,
            },
            daily,
            services,
            products,
            inventory,
        };
    });
}
