import axios, { AxiosError } from 'axios';
import type { LoginInput, RegisterInput, UserRole } from '@barbearia/contracts';

export interface PublicUser { id: string; name: string; email: string; role: UserRole; }
export interface SessionResponse { accessToken: string; user: PublicUser; }

let accessToken: string | null = null;

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333',
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((request) => {
    if (accessToken) request.headers.Authorization = `Bearer ${accessToken}`;
    return request;
});

export function setAccessToken(token: string | null): void { accessToken = token; }

export function errorMessage(error: unknown): string {
    if (error instanceof AxiosError) {
        const responseData: unknown = error.response?.data;
        const responseMessage = typeof responseData === 'object' && responseData !== null && 'message' in responseData
            ? responseData.message
            : undefined;
        if (typeof responseMessage === 'string') return responseMessage;
        if (error.code === 'ERR_NETWORK') return 'Não foi possível conectar à API. Verifique se os serviços Docker estão ativos.';
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
    setAccessToken(response.data.accessToken);
    return response.data;
}

export async function refreshSession(): Promise<SessionResponse> {
    const response = await api.post<SessionResponse>('/auth/refresh');
    setAccessToken(response.data.accessToken);
    return response.data;
}

export async function logout(): Promise<void> {
    try { await api.post('/auth/logout'); } finally { setAccessToken(null); }
}
