import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { authClient, setUnauthorizedHandler, tokenStore } from '@/services/apiClient';

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'sales' | 'warehouse' | 'engineer' | 'viewer';
    avatarUrl?: string;
}

interface AuthContextValue {
    user: AuthUser | null;
    isAuthenticated: boolean;
    initializing: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => void;
    /** Test/dev seam — set a user without hitting the API. */
    setMockUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USE_MOCK_AUTH = import.meta.env.VITE_USE_MOCK_AUTH === 'true';

const MOCK_USER: AuthUser = {
    id: 'user-001',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    role: 'admin',
};

interface BackendUser {
    id: number | string;
    email: string;
    first_name?: string;
    last_name?: string;
    is_superuser?: boolean;
    is_staff?: boolean;
    roles?: { code?: string; name?: string }[];
}

function mapRole(u: BackendUser): AuthUser['role'] {
    if (u.is_superuser || u.is_staff) return 'admin';
    const code = u.roles?.[0]?.code?.toLowerCase() ?? '';
    if (code.includes('sales')) return 'sales';
    if (code.includes('warehouse')) return 'warehouse';
    if (code.includes('engineer')) return 'engineer';
    if (code.includes('admin')) return 'admin';
    return 'viewer';
}

function toAuthUser(u: BackendUser): AuthUser {
    const name = [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || u.email;
    return {
        id: String(u.id),
        name,
        email: u.email,
        role: mapRole(u),
    };
}

async function fetchMe(): Promise<AuthUser | null> {
    try {
        const res = await authClient.get<BackendUser>('/me');
        return toAuthUser(res.data);
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(USE_MOCK_AUTH ? MOCK_USER : null);
    const [initializing, setInitializing] = useState(!USE_MOCK_AUTH);

    useEffect(() => {
        if (USE_MOCK_AUTH) return;
        setUnauthorizedHandler(() => setUser(null));
        if (!tokenStore.getAccess()) {
            setInitializing(false);
            return;
        }
        let cancelled = false;
        fetchMe().then((u) => {
            if (cancelled) return;
            setUser(u);
            setInitializing(false);
        });
        return () => {
            cancelled = true;
        };
    }, []);

    const signIn = useCallback(async (email: string, password: string) => {
        const res = await authClient.post<{ access: string; refresh: string; user?: BackendUser }>(
            '/login',
            { email, password },
        );
        tokenStore.set(res.data.access, res.data.refresh);
        const next = res.data.user ? toAuthUser(res.data.user) : await fetchMe();
        setUser(next);
    }, []);

    const signOut = useCallback(() => {
        tokenStore.clear();
        setUser(null);
    }, []);

    const setMockUser = useCallback((u: AuthUser | null) => setUser(u), []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            initializing,
            signIn,
            signOut,
            setMockUser,
        }),
        [user, initializing, signIn, signOut, setMockUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth() must be used inside <AuthProvider>');
    }
    return ctx;
}
