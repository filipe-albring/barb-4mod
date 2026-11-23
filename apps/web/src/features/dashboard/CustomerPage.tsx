'use client';

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../auth/api';
import type { CustomerAppointment, CustomerProfile } from './types';
import { Alert, Badge } from '../../components/ui';

export default function CustomerPage(): React.JSX.Element {
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        Promise.all([
            api.get<CustomerProfile>('/users/me', { signal: controller.signal }),
            api.get<CustomerAppointment[]>('/users/me/appointments', { signal: controller.signal }),
        ]).then(([profileResponse, appointmentsResponse]) => {
            setProfile(profileResponse.data);
            setAppointments(appointmentsResponse.data);
        }).catch((cause: unknown) => {
            if (!controller.signal.aborted) setError(errorMessage(cause));
        });
        return () => controller.abort();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge variant="success">Concluído</Badge>;
            case 'CANCELLED':
                return <Badge variant="danger">Cancelado</Badge>;
            default:
                return <Badge variant="warning">Agendado</Badge>;
        }
    };

    return (
        <main className="page-wrap">
            <div className="page-heading-row">
                <section className="page-heading">
                    <span className="eyebrow">Área Exclusiva</span>
                    <h1>Minha Conta</h1>
                    <p>Acompanhe seus horários agendados e consulte seus dados cadastrais.</p>
                </section>
                <div style={{ display: 'flex', gap: '.75rem' }}>
                    <Link to="/perfil" className="btn btn-outline">
                        ✏ Editar Perfil
                    </Link>
                    <Link to="/agendamentos/novo" className="btn btn-primary">
                        + Agendar Horário
                    </Link>
                </div>
            </div>

            {error && <Alert variant="error">{error}</Alert>}
            {!profile && !error && <p className="loading">Carregando seus dados...</p>}

            {profile && (
                <>
                    <section className="panel">
                        <h2>Dados Cadastrais</h2>
                        <div className="customer-data">
                            <div>
                                <span>Nome Completo</span>
                                <strong>{profile.name}</strong>
                            </div>
                            <div>
                                <span>E-mail</span>
                                {profile.email}
                            </div>
                            <div>
                                <span>CPF</span>
                                {profile.cpf ? `***.***.***-${profile.cpf.slice(-2)}` : 'Não informado'}
                            </div>
                        </div>
                    </section>

                    <section className="panel">
                        <div className="page-heading-row" style={{ marginBottom: '.5rem' }}>
                            <div>
                                <h2>Histórico de Agendamentos</h2>
                                <p>Todos os seus atendimentos passados e futuros na barbearia.</p>
                            </div>
                        </div>

                        {appointments.length > 0 ? (
                            <div className="table-responsive">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Data e Horário</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map((appointment) => (
                                            <tr key={appointment.id}>
                                                <td>
                                                    <strong>
                                                        {new Intl.DateTimeFormat('pt-BR', {
                                                            dateStyle: 'medium',
                                                            timeStyle: 'short',
                                                        }).format(new Date(appointment.startsAt))}
                                                    </strong>
                                                </td>
                                                <td>{getStatusBadge(appointment.status)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty">
                                Você ainda não possui agendamentos registrados.{' '}
                                <Link to="/agendamentos/novo" style={{ marginLeft: '.5rem', color: '#b89028', fontWeight: 600 }}>
                                    Agende seu primeiro horário aqui!
                                </Link>
                            </div>
                        )}
                    </section>
                </>
            )}
        </main>
    );
}
