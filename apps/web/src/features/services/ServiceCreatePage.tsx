'use client';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreateServiceSchema } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { Alert, Button, Input } from '../../components/ui';

export default function ServiceCreatePage(): React.JSX.Element {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [durationMinutes, setDurationMinutes] = useState('30');
    const [active, setActive] = useState(true);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        setErrorMsg('');
        setErrors({});

        const parsed = CreateServiceSchema.safeParse({
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
            await api.post('/services', parsed.data);
            navigate('/servicos');
        } catch (err: unknown) {
            setErrorMsg(errorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="page-wrap">
            <section className="page-heading">
                <span className="eyebrow">Novo Serviço</span>
                <h1>Cadastrar Procedimento</h1>
                <p>Adicione um novo serviço ao menu da barbearia.</p>
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
                        placeholder="Ex: Corte Degrade Navalhado"
                        required
                    />

                    <Input
                        label="Descrição"
                        name="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        error={errors.description}
                        placeholder="Ex: Inclui lavagem com shampoo mentolado e finalização com pomada matte"
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
                        placeholder="Ex: 45.00"
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
                            Salvar Serviço
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
}
