'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { AppointmentResponse, BarberResponse, ServiceResponse, PaginatedResult, AppointmentStatus } from '@barbearia/contracts';
import { UpdateAppointmentSchema } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { Alert, Button, Input, Select } from '../../components/ui';

export default function AppointmentEditPage(): React.JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [barbers, setBarbers] = useState<BarberResponse[]>([]);
    const [servicesList, setServicesList] = useState<ServiceResponse[]>([]);

    const [customerName, setCustomerName] = useState('');
    const [barberId, setBarberId] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [status, setStatus] = useState<AppointmentStatus>('SCHEDULED');
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;

        Promise.all([
            api.get<AppointmentResponse>(`/appointments/${id}`),
            api.get<PaginatedResult<BarberResponse>>('/barbers', { params: { limit: 100 } }),
            api.get<PaginatedResult<ServiceResponse>>('/services', { params: { limit: 100 } }),
        ]).then(([apptRes, barbersRes, servicesRes]) => {
            const appt = apptRes.data;
            setCustomerName(appt.customerName);
            setBarberId(appt.barberId);
            setStatus(appt.status);
            setSelectedServiceIds(appt.services.map((s) => s.serviceId));

            // Formata para datetime-local (YYYY-MM-DDTHH:mm)
            const dateObj = new Date(appt.startsAt);
            const offset = dateObj.getTimezoneOffset() * 60000;
            const localISOTime = new Date(dateObj.getTime() - offset).toISOString().slice(0, 16);
            setStartsAt(localISOTime);

            setBarbers(barbersRes.data.data);
            setServicesList(servicesRes.data.data);
        }).catch((err: unknown) => {
            setErrorMsg(errorMessage(err));
        }).finally(() => {
            setLoadingData(false);
        });
    }, [id]);

    function toggleService(serviceId: string): void {
        setSelectedServiceIds((prev) =>
            prev.includes(serviceId) ? prev.filter((sId) => sId !== serviceId) : [...prev, serviceId],
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

        const parsed = UpdateAppointmentSchema.safeParse({
            barberId,
            startsAt: isoDate,
            status,
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
            await api.put(`/appointments/${id}`, parsed.data);
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
                <p className="loading">Carregando dados do agendamento...</p>
            </main>
        );
    }

    return (
        <main className="page-wrap">
            <section className="page-heading">
                <span className="eyebrow">Edição de Agenda</span>
                <h1>Editar Agendamento</h1>
                <p>Atualize o profissional, horário, serviços e status do atendimento.</p>
            </section>

            {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

            <div className="panel form-panel">
                <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                    <div className="field">
                        <label>Cliente</label>
                        <input type="text" value={customerName} disabled className="input-disabled" />
                    </div>

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

                    <Select
                        label="Status do Agendamento"
                        name="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
                        options={[
                            { value: 'SCHEDULED', label: 'Agendado' },
                            { value: 'COMPLETED', label: 'Concluído' },
                            { value: 'CANCELLED', label: 'Cancelado' },
                        ]}
                        required
                    />

                    <div className="field">
                        <label>
                            Serviços Vinculados <span className="text-danger">*</span>
                        </label>
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
                        <span>Valor Total Atualizado:</span>
                        <h3>
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(calculatedTotal)}
                        </h3>
                    </div>

                    <div className="form-actions">
                        <Link to="/agendamentos" className="btn btn-outline">
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
