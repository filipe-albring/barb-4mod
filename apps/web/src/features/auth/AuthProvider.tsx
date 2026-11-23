'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { PublicUser, SessionResponse } from './api';
import { getStoredToken, getStoredUser, refreshSession, setStoredToken, setStoredUser } from './api';

interface AuthContextValue {
    user: PublicUser | null;
    loading: boolean;
    acceptSession: (session: SessionResponse) => void;
    updateCurrentUser: (user: PublicUser) => void;
    clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
    const [user, setUser] = useState<PublicUser | null>(() => getStoredUser());
    const [loading, setLoading] = useState(true);

    const acceptSession = useCallback((session: SessionResponse): void => {
        setStoredToken(session.accessToken);
        setStoredUser(session.user);
        setUser(session.user);
    }, []);

    const updateCurrentUser = useCallback((updated: PublicUser): void => {
        setStoredUser(updated);
        setUser(updated);
    }, []);

    const clearSession = useCallback((): void => {
        setStoredToken(null);
        setStoredUser(null);
        setUser(null);
    }, []);

    useEffect(() => {
        let active = true;
        const token = getStoredToken();

        if (!token) {
            setLoading(false);
            return;
        }

        refreshSession().then((session) => {
            if (active) {
                setUser(session.user);
            }
        }).catch(() => {
            if (active) {
                clearSession();
            }
        }).finally(() => {
            if (active) {
                setLoading(false);
            }
        });

        return () => { active = false; };
    }, [clearSession]);

    const value = useMemo(() => ({
        user,
        loading,
        acceptSession,
        updateCurrentUser,
        clearSession,
    }), [user, loading, acceptSession, updateCurrentUser, clearSession]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth precisa estar dentro de AuthProvider.');
    return context;
}
