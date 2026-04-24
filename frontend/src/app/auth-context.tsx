import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

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
  signIn: (user?: AuthUser) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Phase 1 stub: no real auth yet. `signIn` sets a mock user, `signOut`
 * clears it. Real JWT + refresh flow lands in Phase 3 (see plan/SKILL.md §3).
 */
const MOCK_USER: AuthUser = {
  id: 'user-001',
  name: 'Priya Sharma',
  email: 'priya@example.com',
  role: 'admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  // Seed as "signed in" during Phase 1 so we can click through protected
  // routes. Step 04 will replace this with the LoginPage flow.
  const [user, setUser] = useState<AuthUser | null>(MOCK_USER);

  const signIn = useCallback((next?: AuthUser) => {
    setUser(next ?? MOCK_USER);
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      signIn,
      signOut,
    }),
    [user, signIn, signOut],
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
