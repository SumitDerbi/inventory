import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import {
    clientUsers,
    currentClientUser,
    setCurrentClientUserId,
    type ClientUser,
} from '@/mocks/portal/client-users';

interface PortalAuthContextValue {
    user: ClientUser | null;
    isAuthenticated: boolean;
    signIn: (userId?: string) => void;
    signOut: () => void;
    /** Demo helper for the admin "Portal preview" toggle. */
    switchUser: (userId: string) => void;
}

const PortalAuthContext = createContext<PortalAuthContextValue | undefined>(
    undefined,
);

/**
 * Phase 1 stub portal-side auth. Distinct from the staff `AuthProvider`;
 * client-portal users are scoped to a single organisation and only ever
 * see public data for their own account. Real OTP / magic-link flow
 * lands in Phase 3 (see plan/SKILL.md §3).
 */
export function PortalAuthProvider({ children }: { children: ReactNode }) {
    // Seed signed-in so we can click through. `/portal/login` clears.
    const [user, setUser] = useState<ClientUser | null>(() => currentClientUser());

    const signIn = useCallback((userId?: string) => {
        if (userId) {
            setCurrentClientUserId(userId);
        }
        setUser(currentClientUser());
    }, []);

    const signOut = useCallback(() => {
        setUser(null);
    }, []);

    const switchUser = useCallback((userId: string) => {
        const next = clientUsers.find((u) => u.id === userId);
        if (!next) return;
        setCurrentClientUserId(userId);
        setUser(next);
    }, []);

    return (
        <PortalAuthContext.Provider
            value={{
                user,
                isAuthenticated: Boolean(user),
                signIn,
                signOut,
                switchUser,
            }}
        >
            {children}
        </PortalAuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePortalAuth() {
    const ctx = useContext(PortalAuthContext);
    if (!ctx) {
        throw new Error('usePortalAuth() must be used inside <PortalAuthProvider>');
    }
    return ctx;
}

/** Redirects unauthenticated portal visitors to `/portal/login`. */
export function PortalAuthGuard({ children }: { children: ReactNode }) {
    const { isAuthenticated } = usePortalAuth();
    const location = useLocation();
    if (!isAuthenticated) {
        return (
            <Navigate
                to="/portal/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }
    return <>{children}</>;
}
