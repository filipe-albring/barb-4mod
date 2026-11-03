export interface DailyMetric { day: string; appointments: number; revenue: number; }
export interface ServiceMetric { service: string; appointments: number; revenue: number; }
export interface DashboardAnalytics {
    period: number;
    generatedAt: string;
    summary: { appointments: number; projectedRevenue: number; bestDay: string | null; topService: string | null };
    daily: DailyMetric[];
    services: ServiceMetric[];
}
export interface CustomerProfile {
    id: string;
    name: string;
    email: string;
    cpf: string;
    role: 'CUSTOMER';
    createdAt: string;
}
export interface CustomerAppointment { id: string; startsAt: string; status: string; }
