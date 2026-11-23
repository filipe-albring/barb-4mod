export interface DailyMetric {
    day: string;
    appointments: number;
    revenue: number;
}

export interface ServiceMetric {
    service: string;
    appointments: number;
    revenue: number;
}

export interface ProductMetric {
    product: string;
    quantity: number;
    revenue: number;
}

export interface InventoryOverview {
    totalProducts: number;
    totalStock: number;
    totalStockValue: number;
}

export interface DashboardSummary {
    appointments: number;
    projectedRevenue: number;
    servicesRevenue?: number;
    productsRevenue?: number;
    totalRevenue?: number;
    bestDay: string | null;
    topService: string | null;
    topProduct?: string | null;
    totalProducts?: number;
    totalStock?: number;
    totalStockValue?: number;
    productsSold?: number;
}

export interface DashboardAnalytics {
    period: number;
    generatedAt: string;
    summary: DashboardSummary;
    daily: DailyMetric[];
    services: ServiceMetric[];
    products?: ProductMetric[];
    inventory?: InventoryOverview;
}

export interface CustomerProfile {
    id: string;
    name: string;
    email: string;
    cpf: string;
    role: 'CUSTOMER';
    createdAt: string;
}

export interface CustomerAppointment {
    id: string;
    startsAt: string;
    status: string;
}
