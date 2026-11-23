'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { PaginatedResult, ServiceResponse } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { useAuth } from '../auth/AuthProvider';
import { Alert, Badge, Button, Modal, Pagination } from '../../components/ui';

export default function ServicesListPage(): React.JSX.Element {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [servicesList, setServicesList] = useState<ServiceResponse[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; service: ServiceResponse | null; isDeleting: boolean }>({
        isOpen: false,
        service: null,
        isDeleting: false,
    });

    const loadServices = useCallback(async (targetPage: number) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get<PaginatedResult<ServiceResponse>>('/services', {
                params: { page: targetPage, limit: 6 },
            });
            setServicesList(response.data.data);
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
        void loadServices(page);
    }, [page, loadServices]);

    const visibleServices = isAdmin ? servicesList : servicesList.filter((service) => service.active);

    async function confirmDelete(): Promise<void> {
        if (!deleteModal.service) return;
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
        try {
            await api.delete(`/services/${deleteModal.service.id}`);
            setDeleteModal({ isOpen: false, service: null, isDeleting: false });
            await loadServices(page);
        } catch (err: unknown) {
            setError(errorMessage(err));
            setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
        }
    }

    return (
        <main className="page-wrap">
            <div className="page-heading-row">
                <section className="page-heading">
                    <span className="eyebrow">Catálogo de Procedimentos</span>
                    <h1>Serviços Disponíveis</h1>
                    <p>{isAdmin ? 'Cadastre e ajuste os serviços oferecidos pela barbearia.' : 'Escolha entre os serviços disponíveis e agende o seu atendimento.'}</p>
                </section>
                {isAdmin ? (
                    <div>
                    <Link to="/servicos/novo" className="btn btn-primary">
                        + Novo Serviço
                    </Link>
                    </div>
                ) : (
                    <Link to="/agendamentos/novo" className="btn btn-primary">Agendar horário</Link>
                )}
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {loading ? (
                <p className="loading">Carregando serviços...</p>
            ) : visibleServices.length === 0 ? (
                <div className="panel empty">Nenhum serviço cadastrado no catálogo.</div>
            ) : (
                <div className="panel">
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Serviço</th>
                                    <th>Duração Estimada</th>
                                    <th>Preço</th>
                                    <th>Status</th>
                                    {isAdmin && <th style={{ textAlign: 'right' }}>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {visibleServices.map((s) => (
                                    <tr key={s.id}>
                                        <td>
                                            <strong>{s.name}</strong>
                                            {s.description && <div className="sub-text">{s.description}</div>}
                                        </td>
                                        <td>{s.durationMinutes} minutos</td>
                                        <td><strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(s.price))}</strong></td>
                                        <td>
                                            <Badge variant={s.active ? 'success' : 'neutral'}>
                                                {s.active ? 'Disponível' : 'Inativo'}
                                            </Badge>
                                        </td>
                                        {isAdmin && <td style={{ textAlign: 'right' }}>
                                            <Link to={`/servicos/${s.id}/editar`} className="btn btn-outline btn-sm">Editar</Link>{' '}
                                            <Button variant="danger" className="btn-sm" onClick={() => setDeleteModal({ isOpen: true, service: s, isDeleting: false })}>Excluir</Button>
                                        </td>}
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
                title="Excluir Serviço"
                description={`Tem certeza que deseja excluir o serviço "${deleteModal.service?.name}"? Esta ação removerá o serviço do catálogo.`}
                confirmText="Sim, excluir"
                cancelText="Cancelar"
                isDanger
                isLoading={deleteModal.isDeleting}
                onConfirm={() => void confirmDelete()}
                onCancel={() => setDeleteModal({ isOpen: false, service: null, isDeleting: false })}
            />
        </main>
    );
}
