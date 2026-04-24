import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';

/**
 * Redirects unauthenticated visitors to `/login`, preserving the
 * originally requested URL in router state so we can bounce back
 * after successful sign-in.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return (
            <Navigate to="/login" replace state={{ from: location.pathname }} />
        );
    }
    return <>{children}</>;
}
