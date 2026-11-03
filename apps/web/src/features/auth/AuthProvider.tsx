'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PublicUser, SessionResponse } from './api';
import { refreshSession, setAccessToken } from './api';

interface AuthContextValue {
    user: PublicUser | null;
    loading: boolean;
    acceptSession: (session: SessionResponse) => void;
    clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
    const [user, setUser] = useState<PublicUser | null>(null);
    const [loading, setLoading] = useState(true);

    const acceptSession = useCallback((session: SessionResponse): void => {
        setAccessToken(session.accessToken);
        setUser(session.user);
    }, []);

    const clearSession = useCallback((): void => {
        setAccessToken(null);
        setUser(null);
    }, []);

    useEffect(() => {
        let active = true;
        refreshSession().then((session) => {
            if (active) setUser(session.user);
        }).catch(() => {
            if (active) clearSession();
        }).finally(() => {
            if (active) setLoading(false);
        });

        return () => { active = false; };
    }, [clearSession]);

    const value = useMemo(() => ({ user, loading, acceptSession, clearSession }), [user, loading, acceptSession, clearSession]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.');
    return context;
}
