'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import type { BarberResponse, ServiceResponse, PaginatedResult } from '@barbearia/contracts';
import { CreateAppointmentSchema } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { useAuth } from '../auth/AuthProvider';
import { Alert, Button, Input, Select } from '../../components/ui';

export default function AppointmentCreatePage(): React.JSX.Element {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [barbers, setBarbers] = useState<BarberResponse[]>([]);
    const [servicesList, setServicesList] = useState<ServiceResponse[]>([]);

    const [barberId, setBarberId] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        Promise.all([
            api.get<PaginatedResult<BarberResponse>>('/barbers', { params: { limit: 100 } }),
            api.get<PaginatedResult<ServiceResponse>>('/services', { params: { limit: 100 } }),
        ]).then(([barbersRes, servicesRes]) => {
            setBarbers(barbersRes.data.data.filter((b) => b.active));
            setServicesList(servicesRes.data.data.filter((s) => s.active));
        }).catch((err: unknown) => {
            setErrorMsg(errorMessage(err));
        }).finally(() => {
            setLoadingData(false);
        });
    }, []);

    function toggleService(serviceId: string): void {
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
        );
    }

    const calculatedTotal = servicesList
        .filter((s) => selectedServiceIds.includes(s.id))
        .reduce((sum, s) => sum + Number(s.price), 0);

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        setErrorMsg('');
        setErrors({});

        if (!startsAt) {
            setErrors({ startsAt: 'Selecione data e horário para o atendimento.' });
            return;
        }

        const isoDate = new Date(startsAt).toISOString();
        const customerId = user?.id ?? '';

        const parsed = CreateAppointmentSchema.safeParse({
            customerId,
            barberId,
            startsAt: isoDate,
            serviceIds: selectedServiceIds,
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
            await api.post('/appointments', parsed.data);
            navigate('/agendamentos');
        } catch (err: unknown) {
            setErrorMsg(errorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loadingData) {
        return (
            <main className="page-wrap">
                <p className="loading">Carregando barbeiros e catálogo...</p>
            </main>
        );
    }

    return (
        <main className="page-wrap">
            <section className="page-heading">
                <span className="eyebrow">Agendar Horário</span>
                <h1>Novo Agendamento</h1>
                <p>Selecione o profissional, a data e os serviços desejados.</p>
            </section>

            {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

            <div className="panel form-panel">
                <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                    <Select
                        label="Barbeiro"
                        name="barberId"
                        value={barberId}
                        onChange={(e) => setBarberId(e.target.value)}
                        options={barbers.map((b) => ({ value: b.id, label: `${b.name} (${b.specialty})` }))}
                        error={errors.barberId}
                        required
                    />

                    <Input
                        label="Data e Horário do Atendimento"
                        name="startsAt"
                        type="datetime-local"
                        value={startsAt}
                        onChange={(e) => setStartsAt(e.target.value)}
                        error={errors.startsAt}
                        required
                    />

                    <div className="field">
                        <label>
                            Serviços a Realizar <span className="text-danger">*</span>
                        </label>
                        <p className="sub-text">Selecione um ou mais procedimentos:</p>

                        <div className="checkbox-list">
                            {servicesList.map((svc) => (
                                <label key={svc.id} className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedServiceIds.includes(svc.id)}
                                        onChange={() => toggleService(svc.id)}
                                    />
                                    <div className="checkbox-label-content">
                                        <strong>{svc.name}</strong>
                                        <span>
                                            {svc.durationMinutes} min •{' '}
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(svc.price))}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {errors.serviceIds && <span className="field-error">{errors.serviceIds}</span>}
                    </div>

                    <div className="total-highlight">
                        <span>Valor Total Estimado:</span>
                        <h3>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedTotal)}
                        </h3>
                    </div>

                    <div className="form-actions">
                        <Link to="/agendamentos" className="btn btn-outline">
                            Cancelar
                        </Link>
                        <Button type="submit" isLoading={isSubmitting}>
                            Confirmar Agendamento
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
}
