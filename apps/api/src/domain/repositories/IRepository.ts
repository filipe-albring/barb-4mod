export interface PaginationFilter {
    page: number;
    limit: number;
    search?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface IRepository<T, TId = string> {
    findById(id: TId): Promise<T | null>;
    findAll(filter: PaginationFilter): Promise<PaginatedResult<T>>;
    create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
    update(id: TId, data: Partial<T>): Promise<T>;
    delete(id: TId): Promise<boolean>;
}
