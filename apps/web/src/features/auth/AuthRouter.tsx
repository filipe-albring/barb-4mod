'use client';

import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthProvider';
import { logout } from './api';
import LoginPage from './LoginPage';
import RegistrationForm from './RegistrationForm';
import DashboardPage from '../dashboard/DashboardPage';
import CustomerPage from '../dashboard/CustomerPage';

function Header(): React.JSX.Element {
    const { user, clearSession } = useAuth();
    const navigate = useNavigate();

    async function sair(): Promise<void> {
        await logout().catch(() => undefined);
        clearSession();
        navigate('/login', { replace: true });
    }

    return (
        <header className="topbar">
            <Link className="brand" to="/">Barbearia Prime</Link>
            <nav className="top-links" aria-label="Navegação principal">
                {user ? <>
                    <span>{user.name}</span>
                    {user.role === 'CUSTOMER' ? <Link to="/minha-conta">Minha conta</Link> : <Link to="/dashboard">Dashboard</Link>}
                    {user.role === 'ADMIN' && <Link to="/cadastro-equipe">Adicionar equipe</Link>}
                    <button type="button" onClick={() => void sair()}>Sair</button>
                </> : <><Link to="/login">Entrar</Link><Link to="/cadastro">Criar conta</Link></>}
            </nav>
        </header>
    );
}

function Protected({ children, roles }: { children: React.ReactNode; roles: readonly string[] }): React.JSX.Element {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading">Verificando sessão...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (!roles.includes(user.role)) return <Navigate to={user.role === 'CUSTOMER' ? '/minha-conta' : '/dashboard'} replace />;
    return <>{children}</>;
}

function Home(): React.JSX.Element {
    const { user } = useAuth();
    return <>
        <section className="hero">
            <span className="eyebrow">Estilo e cuidado, no seu ritmo</span>
            <h1>Seu próximo corte começa aqui.</h1>
            <p>Uma experiência de barbearia organizada, com profissionais experientes e atendimento com hora marcada.</p>
            <Link to={user ? (user.role === 'CUSTOMER' ? '/minha-conta' : '/dashboard') : '/cadastro'} className="button">{user ? 'Acessar minha área' : 'Criar conta'}</Link>
        </section>
        <main className="page-wrap"><section className="page-heading"><h2>Bem-vindo à Barbearia Prime</h2><p>Entre na sua conta para acompanhar seus dados ou acessar o painel da equipe.</p></section></main>
    </>;
}

function RouteTree(): React.JSX.Element {
    return <div className="shell"><Header /><Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cadastro" element={<RegistrationForm />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cadastro-equipe" element={<Protected roles={['ADMIN']}><RegistrationForm employee /></Protected>} />
        <Route path="/dashboard" element={<Protected roles={['EMPLOYEE', 'ADMIN']}><DashboardPage /></Protected>} />
        <Route path="/minha-conta" element={<Protected roles={['CUSTOMER']}><CustomerPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></div>;
}

export default function AuthRouter(): React.JSX.Element {
    return <AuthProvider><BrowserRouter><RouteTree /></BrowserRouter></AuthProvider>;
}
