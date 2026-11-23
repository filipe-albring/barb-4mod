'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { ServiceResponse } from '@barbearia/contracts';
import { UpdateServiceSchema } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { Alert, Button, Input } from '../../components/ui';

export default function ServiceEditPage(): React.JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('30');
    const [active, setActive] = useState(true);

    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        api.get<ServiceResponse>(`/services/${id}`)
            .then((res) => {
                setName(res.data.name);
                setDescription(res.data.description ?? '');
                setPrice(String(res.data.price));
                setDurationMinutes(String(res.data.durationMinutes));
                setActive(res.data.active);
            })
            .catch((err: unknown) => {
                setErrorMsg(errorMessage(err));
            })
            .finally(() => setLoading(false));
    }, [id]);

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        setErrorMsg('');
        setErrors({});

        const parsed = UpdateServiceSchema.safeParse({
            name,
            description,
            price: Number(price),
            durationMinutes: Number(durationMinutes),
            active,
        });

        if (!parsed.success) {
            const nextErrors: Record<string, string> = {};
            parsed.error.issues.forEach((issue) => {
                nextErrors[String(issue.path[0])] = issue.message;
            });
            setErrors(nextErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await api.put(`/services/${id}`, parsed.data);
            navigate('/servicos');
        } catch (err: unknown) {
            setErrorMsg(errorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return (
            <main className="page-wrap">
                <p className="loading">Carregando dados do serviço...</p>
            </main>
        );
    }

    return (
        <main className="page-wrap">
            <section className="page-heading">
                <span className="eyebrow">Edição de Catálogo</span>
                <h1>Editar Serviço</h1>
                <p>Atualize as informações do serviço.</p>
            </section>

            {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

            <div className="panel form-panel">
                <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                    <Input
                        label="Nome do Serviço"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={errors.name}
                        required
                    />

                    <Input
                        label="Descrição"
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        error={errors.description}
                    />

                    <Input
                        label="Preço (R$)"
                        name="price"
                        type="number"
                        step="0.50"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        error={errors.price}
                        required
                    />

                    <Input
                        label="Duração Estimada (minutos)"
                        name="durationMinutes"
                        type="number"
                        min="5"
                        max="480"
                        value={durationMinutes}
                        onChange={(e) => setDurationMinutes(e.target.value)}
                        error={errors.durationMinutes}
                        required
                    />

                    <div className="field-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={active}
                                onChange={(e) => setActive(e.target.checked)}
                            />
                            Serviço disponível para agendamento
                        </label>
                    </div>

                    <div className="form-actions">
                        <Link to="/servicos" className="btn btn-outline">
                            Cancelar
                        </Link>
                        <Button type="submit" isLoading={isSubmitting}>
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
}
