'use client';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreateBarberSchema } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { Alert, Button, Input } from '../../components/ui';

function formatarCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function BarberCreatePage(): React.JSX.Element {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [phone, setPhone] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [active, setActive] = useState(true);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        setErrorMsg('');
        setErrors({});

        const parsed = CreateBarberSchema.safeParse({
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
            await api.post('/barbers', parsed.data);
            navigate('/barbeiros');
        } catch (err: unknown) {
            setErrorMsg(errorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="page-wrap">
            <section className="page-heading">
                <span className="eyebrow">Novo Cadastro</span>
                <h1>Cadastrar Barbeiro</h1>
                <p>Adicione um novo profissional para compor o time de atendimento.</p>
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
                        placeholder="Ex: Lucas Santana"
                        required
                    />

                    <Input
                        label="CPF"
                        name="cpf"
                        value={cpf}
                        maxLength={14}
                        onChange={(e) => setCpf(formatarCpf(e.target.value))}
                        error={errors.cpf}
                        placeholder="000.000.000-00"
                        required
                    />

                    <Input
                        label="Telefone de Contato"
                        name="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        error={errors.phone}
                        placeholder="(11) 98765-4321"
                        required
                    />

                    <Input
                        label="Especialidade Principal"
                        name="specialty"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        error={errors.specialty}
                        placeholder="Ex: Degradê, Barboterapia, Navalhado..."
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
                            Salvar Barbeiro
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
}
