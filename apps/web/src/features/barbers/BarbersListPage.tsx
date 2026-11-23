'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { BarberResponse, PaginatedResult } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { useAuth } from '../auth/AuthProvider';
import { Alert, Badge, Button, Modal, Pagination } from '../../components/ui';

export default function BarbersListPage(): React.JSX.Element {
    const { user } = useAuth();
    const isAdmin = user?.role === 'ADMIN';
    const [barbers, setBarbers] = useState<BarberResponse[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; barber: BarberResponse | null; isDeleting: boolean }>({
        isOpen: false,
        barber: null,
        isDeleting: false,
    });

    const loadBarbers = useCallback(async (targetPage: number) => {
        setLoading(true);
        setError('');
        try {
            const response = await api.get<PaginatedResult<BarberResponse>>('/barbers', {
                params: { page: targetPage, limit: 6 },
            });
            setBarbers(response.data.data);
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
        void loadBarbers(page);
    }, [page, loadBarbers]);

    const visibleBarbers = isAdmin ? barbers : barbers.filter((barber) => barber.active);

    async function confirmDelete(): Promise<void> {
        if (!deleteModal.barber) return;
        setDeleteModal((prev) => ({ ...prev, isDeleting: true }));
        try {
            await api.delete(`/barbers/${deleteModal.barber.id}`);
            setDeleteModal({ isOpen: false, barber: null, isDeleting: false });
            await loadBarbers(page);
        } catch (err: unknown) {
            setError(errorMessage(err));
            setDeleteModal((prev) => ({ ...prev, isDeleting: false }));
        }
    }

    return (
        <main className="page-wrap">
            <div className="page-heading-row">
                <section className="page-heading">
                    <span className="eyebrow">Gestão de Equipe</span>
                    <h1>Barbeiros e Profissionais</h1>
                    <p>{isAdmin ? 'Gerencie o time de especialistas e barbeiros da Barbearia Prime.' : 'Conheça os profissionais disponíveis e escolha o seu favorito para o próximo atendimento.'}</p>
                </section>
                {isAdmin ? (
                    <div>
                    <Link to="/barbeiros/novo" className="btn btn-primary">
                        + Cadastrar Barbeiro
                    </Link>
                    </div>
                ) : (
                    <Link to="/agendamentos/novo" className="btn btn-primary">Agendar horário</Link>
                )}
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            {loading ? (
                <p className="loading">Carregando profissionais...</p>
            ) : visibleBarbers.length === 0 ? (
                <div className="panel empty">Nenhum barbeiro cadastrado no momento.</div>
            ) : (
                <div className="panel">
                    <div className="table-responsive">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Especialidade</th>
                                    <th>Telefone</th>
                                    <th>Status</th>
                                    {isAdmin && <th style={{ textAlign: 'right' }}>Ações</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {visibleBarbers.map((b) => (
                                    <tr key={b.id}>
                                        <td><strong>{b.name}</strong></td>
                                        <td>{b.specialty}</td>
                                        <td>{b.phone}</td>
                                        <td>
                                            <Badge variant={b.active ? 'success' : 'neutral'}>
                                                {b.active ? 'Ativo' : 'Inativo'}
                                            </Badge>
                                        </td>
                                        {isAdmin && <td style={{ textAlign: 'right' }}>
                                            <Link to={`/barbeiros/${b.id}/editar`} className="btn btn-outline btn-sm">Editar</Link>{' '}
                                            <Button variant="danger" className="btn-sm" onClick={() => setDeleteModal({ isOpen: true, barber: b, isDeleting: false })}>Excluir</Button>
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
                title="Excluir Barbeiro"
                description={`Tem certeza que deseja excluir o barbeiro "${deleteModal.barber?.name}"? Esta ação não pode ser desfeita.`}
                confirmText="Sim, excluir"
                cancelText="Cancelar"
                isDanger
                isLoading={deleteModal.isDeleting}
                onConfirm={() => void confirmDelete()}
                onCancel={() => setDeleteModal({ isOpen: false, barber: null, isDeleting: false })}
            />
        </main>
    );
}
