'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { BarberResponse } from '@barbearia/contracts';
import { UpdateBarberSchema } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { Alert, Button, Input } from '../../components/ui';

function formatarCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function BarberEditPage(): React.JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [phone, setPhone] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [active, setActive] = useState(true);

    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        api.get<BarberResponse>(`/barbers/${id}`)
            .then((res) => {
                setName(res.data.name);
                setCpf(formatarCpf(res.data.cpf));
                setPhone(res.data.phone);
                setSpecialty(res.data.specialty);
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

        const parsed = UpdateBarberSchema.safeParse({
            name,
            cpf,
            phone,
            specialty,
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
            await api.put(`/barbers/${id}`, parsed.data);
            navigate('/barbeiros');
        } catch (err: unknown) {
            setErrorMsg(errorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return (
            <main className="page-wrap">
                <p className="loading">Carregando dados do barbeiro...</p>
            </main>
        );
    }

    return (
        <main className="page-wrap">
            <section className="page-heading">
                <span className="eyebrow">Edição de Cadastro</span>
                <h1>Editar Barbeiro</h1>
                <p>Atualize as informações do profissional.</p>
            </section>

            {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

            <div className="panel form-panel">
                <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                    <Input
                        label="Nome do Barbeiro"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={errors.name}
                        required
                    />

                    <Input
                        label="CPF"
                        name="cpf"
                        value={cpf}
                        maxLength={14}
                        onChange={(e) => setCpf(formatarCpf(e.target.value))}
                        error={errors.cpf}
                        required
                    />

                    <Input
                        label="Telefone de Contato"
                        name="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={errors.phone}
                        required
                    />

                    <Input
                        label="Especialidade Principal"
                        name="specialty"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        error={errors.specialty}
                        required
                    />

                    <div className="field-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={active}
                                onChange={(e) => setActive(e.target.checked)}
                            />
                            Profissional ativo para agendamentos
                        </label>
                    </div>

                    <div className="form-actions">
                        <Link to="/barbeiros" className="btn btn-outline">
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
