'use client';

import React from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthProvider';
import { logout } from './api';
import LoginPage from './LoginPage';
import RegistrationForm from './RegistrationForm';
import DashboardPage from '../dashboard/DashboardPage';
import ProfileEditPage from '../profile/ProfileEditPage';

// CRUD 1: Barbeiros
import BarbersListPage from '../barbers/BarbersListPage';
import BarberCreatePage from '../barbers/BarberCreatePage';
import BarberEditPage from '../barbers/BarberEditPage';

// CRUD 2: Serviços
import ServicesListPage from '../services/ServicesListPage';
import ServiceCreatePage from '../services/ServiceCreatePage';
import ServiceEditPage from '../services/ServiceEditPage';

// CRUD 3: Agendamentos
import AppointmentsListPage from '../appointments/AppointmentsListPage';
import AppointmentCreatePage from '../appointments/AppointmentCreatePage';
import AppointmentEditPage from '../appointments/AppointmentEditPage';

// CRUD 4: Produtos
import ProductsListPage from '../products/ProductsListPage';
import ProductCreatePage from '../products/ProductCreatePage';
import ProductEditPage from '../products/ProductEditPage';

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
            <Link className="brand" to="/">
                <span className="brand-logo">✂</span> Barbearia Prime
            </Link>
            <nav className="top-links" aria-label="Navegação principal">
                {user ? (
                    <>
                        {user.role === 'CUSTOMER' && <Link to="/agendamentos">Meus Horários</Link>}
                        {user.role === 'ADMIN' && <Link to="/agendamentos">Agendamentos</Link>}
                        <Link to="/servicos">Serviços</Link>
                        <Link to="/barbeiros">Barbeiros</Link>
                        <Link to="/produtos">Produtos</Link>
                        {user.role !== 'CUSTOMER' && <Link to="/dashboard">Dashboard</Link>}
                        {user.role === 'ADMIN' && <Link to="/cadastro-equipe">Equipe</Link>}
                        <Link to="/perfil" className="user-profile-link">
                            👤 {user.name.split(' ')[0]}
                        </Link>
                        <button type="button" className="btn-logout" onClick={() => void sair()}>
                            Sair
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/login">Entrar</Link>
                        <Link to="/cadastro" className="btn btn-primary btn-sm">
                            Criar conta
                        </Link>
                    </>
                )}
            </nav>
        </header>
    );
}

function Protected({ children, roles }: { children: React.ReactNode; roles?: readonly string[] }): React.JSX.Element {
    const { user, loading } = useAuth();
    if (loading) return <div className="loading">Verificando sessão...</div>;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) {
        return <Navigate to={user.role === 'CUSTOMER' ? '/minha-conta' : '/dashboard'} replace />;
    }
    return <>{children}</>;
}

function Home(): React.JSX.Element {
    const { user } = useAuth();
    const canBook = user?.role === 'CUSTOMER';
    return (
        <>
            <section className="hero">
                <span className="eyebrow">Tradição, Estilo e Alta Performance</span>
                <h1>Seu visual nas mãos dos melhores mestres da navalha.</h1>
                <p>
                    Ambiente premium, atendimento com hora marcada e catálogo completo de serviços e produtos para cabelo e barba.
                </p>
                <div className="hero-actions">
                    <Link
                        to={canBook ? '/agendamentos/novo' : user ? '/agendamentos' : '/cadastro'}
                        className="btn btn-primary"
                    >
                        {canBook ? 'Agendar Horário Agora' : user ? 'Ver Agendamentos' : 'Cadastre-se e Agende'}
                    </Link>
                    {user && (
                        <Link to="/agendamentos" className="btn btn-outline">
                            {canBook ? 'Meus Horários' : 'Ver Agendamentos'}
                        </Link>
                    )}
                </div>
            </section>
            <main className="page-wrap">
                <div className="features-grid">
                    <div className="feature-card">
                        <span className="feature-icon">💈</span>
                        <h3>Barbeiros Especialistas</h3>
                        <p>Profissionais qualificados em cortes modernos, fade, tesoura e barboterapia completa.</p>
                        <Link to="/barbeiros">Conhecer profissionais &rarr;</Link>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">✂</span>
                        <h3>Serviços Sob Medida</h3>
                        <p>Cabelo, barba, sobrancelha e combos com toalha quente e finalização com produtos selecionados.</p>
                        <Link to="/servicos">Ver catálogo &rarr;</Link>
                    </div>
                    <div className="feature-card">
                        <span className="feature-icon">🧴</span>
                        <h3>Produtos Exclusivos</h3>
                        <p>Pomadas efeito matte, óleos aromáticos e balms para manter seu estilo no dia a dia.</p>
                        <Link to="/produtos">Ver estoque &rarr;</Link>
                    </div>
                </div>
            </main>
        </>
    );
}

function RouteTree(): React.JSX.Element {
    return (
        <div className="shell">
            <Header />
            <Routes>
                {/* Rotas Públicas */}
                <Route path="/" element={<Home />} />
                <Route path="/cadastro" element={<RegistrationForm />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Edição de Perfil de Usuário */}
                <Route
                    path="/perfil"
                    element={
                        <Protected>
                            <ProfileEditPage />
                        </Protected>
                    }
                />

                {/* Área do Cliente & Equipe */}
                <Route
                    path="/minha-conta"
                    element={
                        <Protected roles={['CUSTOMER']}>
                            <Navigate to="/agendamentos" replace />
                        </Protected>
                    }
                />
                <Route
                    path="/dashboard"
                    element={
                        <Protected roles={['EMPLOYEE', 'ADMIN']}>
                            <DashboardPage />
                        </Protected>
                    }
                />
                <Route
                    path="/cadastro-equipe"
                    element={
                        <Protected roles={['ADMIN']}>
                            <RegistrationForm employee />
                        </Protected>
                    }
                />

                {/* CRUD 1: Barbeiros */}
                <Route
                    path="/barbeiros"
                    element={
                        <Protected>
                            <BarbersListPage />
                        </Protected>
                    }
                />
                <Route
                    path="/barbeiros/novo"
                    element={
                        <Protected roles={['ADMIN']}>
                            <BarberCreatePage />
                        </Protected>
                    }
                />
                <Route
                    path="/barbeiros/:id/editar"
                    element={
                        <Protected roles={['ADMIN']}>
                            <BarberEditPage />
                        </Protected>
                    }
                />

                {/* CRUD 2: Serviços */}
                <Route
                    path="/servicos"
                    element={
                        <Protected>
                            <ServicesListPage />
                        </Protected>
                    }
                />
                <Route
                    path="/servicos/novo"
                    element={
                        <Protected roles={['ADMIN']}>
                            <ServiceCreatePage />
                        </Protected>
                    }
                />
                <Route
                    path="/servicos/:id/editar"
                    element={
                        <Protected roles={['ADMIN']}>
                            <ServiceEditPage />
                        </Protected>
                    }
                />

                {/* CRUD 3: Agendamentos */}
                <Route
                    path="/agendamentos"
                    element={
                        <Protected roles={['CUSTOMER', 'ADMIN']}>
                            <AppointmentsListPage />
                        </Protected>
                    }
                />
                <Route
                    path="/agendamentos/novo"
                    element={
                        <Protected roles={['CUSTOMER']}>
                            <AppointmentCreatePage />
                        </Protected>
                    }
                />
                <Route
                    path="/agendamentos/:id/editar"
                    element={
                        <Protected roles={['ADMIN']}>
                            <AppointmentEditPage />
                        </Protected>
                    }
                />

                {/* CRUD 4: Produtos */}
                <Route
                    path="/produtos"
                    element={
                        <Protected>
                            <ProductsListPage />
                        </Protected>
                    }
                />
                <Route
                    path="/produtos/novo"
                    element={
                        <Protected roles={['ADMIN']}>
                            <ProductCreatePage />
                        </Protected>
                    }
                />
                <Route
                    path="/produtos/:id/editar"
                    element={
                        <Protected roles={['ADMIN']}>
                            <ProductEditPage />
                        </Protected>
                    }
                />

                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

export default function AuthRouter(): React.JSX.Element {
    return (
        <AuthProvider>
            <BrowserRouter>
                <RouteTree />
            </BrowserRouter>
        </AuthProvider>
    );
}
