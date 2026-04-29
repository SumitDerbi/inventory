import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

const TOKEN_KEY = 'inv.access_token';
const REFRESH_KEY = 'inv.refresh_token';

export const tokenStore = {
    getAccess(): string | null {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch {
            return null;
        }
    },
    getRefresh(): string | null {
        try {
            return localStorage.getItem(REFRESH_KEY);
        } catch {
            return null;
        }
    },
    set(access: string, refresh?: string) {
        try {
            localStorage.setItem(TOKEN_KEY, access);
            if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
        } catch {
            /* ignore storage errors */
        }
    },
    clear() {
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(REFRESH_KEY);
        } catch {
            /* ignore */
        }
    },
};

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const apiClient: AxiosInstance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

// Auth client uses the same host but mounts under /api/auth/.
export const authClient: AxiosInstance = axios.create({
    baseURL: baseURL.replace(/\/api\/v1\/?$/, '/api/auth'),
    headers: { 'Content-Type': 'application/json' },
});

function attachToken(config: InternalAxiosRequestConfig) {
    const token = tokenStore.getAccess();
    if (token) {
        config.headers = config.headers ?? {};
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
    return config;
}

apiClient.interceptors.request.use(attachToken);
authClient.interceptors.request.use(attachToken);

let refreshing: Promise<string | null> | null = null;
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(fn: () => void) {
    onUnauthorized = fn;
}

async function refreshAccessToken(): Promise<string | null> {
    const refresh = tokenStore.getRefresh();
    if (!refresh) return null;
    try {
        const res = await axios.post(
            `${authClient.defaults.baseURL}/refresh`,
            { refresh },
            { headers: { 'Content-Type': 'application/json' } },
        );
        const access = res.data?.access as string | undefined;
        const newRefresh = res.data?.refresh as string | undefined;
        if (access) {
            tokenStore.set(access, newRefresh);
            return access;
        }
    } catch {
        /* fall through */
    }
    return null;
}

apiClient.interceptors.response.use(
    (r) => r,
    async (error: AxiosError) => {
        const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
        if (error.response?.status === 401 && original && !original._retry) {
            original._retry = true;
            refreshing ??= refreshAccessToken().finally(() => {
                refreshing = null;
            });
            const newToken = await refreshing;
            if (newToken) {
                original.headers = original.headers ?? {};
                (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
                return apiClient.request(original);
            }
            tokenStore.clear();
            onUnauthorized?.();
        }
        return Promise.reject(error);
    },
);

export interface DRFErrorBody {
    detail?: string;
    [field: string]: unknown;
}

export function extractErrorMessage(error: unknown, fallback = 'Request failed'): string {
    if (axios.isAxiosError(error)) {
        const data = error.response?.data as DRFErrorBody | undefined;
        if (typeof data?.detail === 'string') return data.detail;
        if (data && typeof data === 'object') {
            const first = Object.entries(data)[0];
            if (first) {
                const [field, value] = first;
                const msg = Array.isArray(value) ? value[0] : value;
                return typeof msg === 'string' ? `${field}: ${msg}` : fallback;
            }
        }
        return error.message || fallback;
    }
    if (error instanceof Error) return error.message;
    return fallback;
}

export interface PageResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}
