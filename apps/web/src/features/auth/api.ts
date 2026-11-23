import axios, { AxiosError } from 'axios';
import type { LoginInput, RegisterInput, UpdateUserInput, UserRole } from '@barbearia/contracts';

export interface PublicUser {
    id: string;
    name: string;
    email: string;
    cpf?: string;
    role: UserRole;
}

export interface SessionResponse {
    accessToken: string;
    user: PublicUser;
}

const TOKEN_STORAGE_KEY = 'barbearia_access_token';
const USER_STORAGE_KEY = 'barbearia_user_data';

export function getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string | null): void {
    if (typeof window === 'undefined') return;
    if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
}

export function getStoredUser(): PublicUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as PublicUser;
    } catch {
        return null;
    }
}

export function setStoredUser(user: PublicUser | null): void {
    if (typeof window === 'undefined') return;
    if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
        localStorage.removeItem(USER_STORAGE_KEY);
    }
}

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((request) => {
    const token = getStoredToken();
    if (token) {
        request.headers.Authorization = `Bearer ${token}`;
    }
    return request;
});

export function errorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        const responseData: unknown = error.response?.data;
        if (typeof responseData === 'object' && responseData !== null) {
            if ('message' in responseData && typeof responseData.message === 'string') {
                return responseData.message;
            }
            if ('issues' in responseData && Array.isArray(responseData.issues) && responseData.issues.length > 0) {
                return (responseData.issues[0] as { message?: string })?.message ?? 'Verifique os dados informados.';
            }
        }
        if (error.code === 'ERR_NETWORK') {
            return 'Não foi possível conectar ao servidor. Verifique sua conexão ou status dos serviços.';
        }
    }
    return 'Ocorreu um erro inesperado. Tente novamente.';
}

export async function registerCustomer(input: RegisterInput): Promise<void> {
    await api.post('/auth/register', input);
}

export async function registerEmployee(input: RegisterInput): Promise<void> {
    await api.post('/auth/register/employee', input);
}

export async function login(input: LoginInput): Promise<SessionResponse> {
    const response = await api.post<SessionResponse>('/auth/login', input);
    setStoredToken(response.data.accessToken);
    setStoredUser(response.data.user);
    return response.data;
}

export async function refreshSession(): Promise<SessionResponse> {
    const response = await api.post<SessionResponse>('/auth/refresh');
    setStoredToken(response.data.accessToken);
    setStoredUser(response.data.user);
    return response.data;
}

export async function logout(): Promise<void> {
    try {
        await api.post('/auth/logout');
    } finally {
        setStoredToken(null);
        setStoredUser(null);
    }
}

export async function updateUserProfile(input: UpdateUserInput): Promise<PublicUser> {
    const response = await api.put<PublicUser>('/users/me', input);
    setStoredUser(response.data);
    return response.data;
}
