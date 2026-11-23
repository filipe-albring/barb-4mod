'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { AppointmentResponse, PaginatedResult } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { useAuth } from '../auth/AuthProvider';
import { Alert, Badge, Button, Modal, Pagination } from '../../components/ui';

export default function AppointmentsListPage(): React.JSX.Element {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; appointment: AppointmentResponse | null; isDeleting: boolean }>({
        isOpen: false,
        appointment: null,
        isDeleting: false,
    });

    const loadAppointments = useCallback(async (targetPage: number) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get<PaginatedResult<AppointmentResponse>>('/appointments', {
                params: { page: targetPage, limit: 6 },
            });
            setAppointments(response.data.data);
            setPage(response.data.page);
            setTotalPages(response.data.totalPages);
            setTotalItems(response.data.total);
        } catch (err: unknown) {
            setError(errorMessage(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAppointments(page);
    }, [page, loadAppointments]);

    async function confirmDelete(): Promise<void> {
        if (!deleteModal.appointment) return;
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
        try {
            await api.delete(`/appointments/${deleteModal.appointment.id}`);
            setDeleteModal({ isOpen: false, appointment: null, isDeleting: false });
            await loadAppointments(page);
        } catch (err: unknown) {
            setError(errorMessage(err));
            setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
        }
    }

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
                    <span className="eyebrow">{isAdmin ? 'Agenda da Barbearia' : 'Minha Agenda'}</span>
                    <h1>{isAdmin ? 'Agendamentos de Horários' : 'Meus Horários'}</h1>
                    <p>{isAdmin ? 'Controle completo dos atendimentos agendados, clientes e barbeiros.' : 'Acompanhe e cancele os seus atendimentos. Para marcar outro horário, use o botão ao lado.'}</p>
                </section>
                {!isAdmin && (
                    <div>
                    <Link to="/agendamentos/novo" className="btn btn-primary">
                        + Agendar horário
                    </Link>
                    </div>
                )}
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {loading ? (
                <p className="loading">Carregando agendamentos...</p>
            ) : appointments.length === 0 ? (
                <div className="panel empty">Nenhum agendamento encontrado no período.</div>
            ) : (
                <div className="panel">
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Data e Horário</th>
                                    {isAdmin && <th>Cliente</th>}
                                    <th>Barbeiro</th>
                                    <th>Serviços Vinculados</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {appointments.map((a) => (
                                    <tr key={a.id}>
                                        <td>
                                            <strong>
                                                {new Intl.DateTimeFormat('pt-BR', {
                                                    dateStyle: 'short',
                                                    timeStyle: 'short',
                                                }).format(new Date(a.startsAt))}
                                            </strong>
                                        </td>
                                        {isAdmin && <td>{a.customerName}</td>}
                                        <td>{a.barberName}</td>
                                        <td>
                                            {a.services.map((s) => s.name).join(', ')}
                                        </td>
                                        <td>
                                            <strong>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(a.totalPrice))}
                                            </strong>
                                        </td>
                                        <td>{getStatusBadge(a.status)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            {isAdmin && <><Link to={`/agendamentos/${a.id}/editar`} className="btn btn-outline btn-sm">Editar</Link>{' '}</>}
                                            <Button
                                                variant="danger"
                                                className="btn-sm"
                                                onClick={() => setDeleteModal({ isOpen: true, appointment: a, isDeleting: false })}
                                            >
                                                {isAdmin ? 'Excluir' : 'Cancelar'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        onPageChange={(p) => setPage(p)}
                    />
                </div>
            )}

            <Modal
                isOpen={deleteModal.isOpen}
                title={isAdmin ? 'Excluir Agendamento' : 'Cancelar Agendamento'}
                description={isAdmin
                    ? `Deseja realmente remover o agendamento de ${deleteModal.appointment?.customerName} com ${deleteModal.appointment?.barberName}?`
                    : `Deseja realmente cancelar seu horário com ${deleteModal.appointment?.barberName}?`}
                confirmText={isAdmin ? 'Confirmar remoção' : 'Confirmar cancelamento'}
                cancelText="Voltar"
                isDanger
                isLoading={deleteModal.isDeleting}
                onConfirm={() => void confirmDelete()}
                onCancel={() => setDeleteModal({ isOpen: false, appointment: null, isDeleting: false })}
            />
        </main>
    );
}
