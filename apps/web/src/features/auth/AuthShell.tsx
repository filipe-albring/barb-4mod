'use client';

import dynamic from 'next/dynamic';

const AuthRouter = dynamic(() => import('./AuthRouter'), {
    ssr: false,
    loading: () => <div className="loading">Carregando Barbearia Prime...</div>,
});

export default function AuthShell(): React.JSX.Element { return <AuthRouter />; }
