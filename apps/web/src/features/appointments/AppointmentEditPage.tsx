'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { AppointmentResponse, BarberResponse, ServiceResponse, PaginatedResult, AppointmentStatus } from '@barbearia/contracts';
import { UpdateAppointmentSchema } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { Alert, Button, Input, Select } from '../../components/ui';

const TIME_OPTIONS = [
    { value: '08:00', label: '08:00' },
    { value: '08:30', label: '08:30' },
    { value: '09:00', label: '09:00' },
    { value: '09:30', label: '09:30' },
    { value: '10:00', label: '10:00' },
    { value: '10:30', label: '10:30' },
    { value: '11:00', label: '11:00' },
    { value: '11:30', label: '11:30' },
    { value: '12:00', label: '12:00' },
    { value: '12:30', label: '12:30' },
    { value: '13:00', label: '13:00' },
    { value: '13:30', label: '13:30' },
    { value: '14:00', label: '14:00' },
    { value: '14:30', label: '14:30' },
    { value: '15:00', label: '15:00' },
    { value: '15:30', label: '15:30' },
    { value: '16:00', label: '16:00' },
    { value: '16:30', label: '16:30' },
    { value: '17:00', label: '17:00' },
    { value: '17:30', label: '17:30' },
    { value: '18:00', label: '18:00' },
    { value: '18:30', label: '18:30' },
    { value: '19:00', label: '19:00' },
    { value: '19:30', label: '19:30' },
    { value: '20:00', label: '20:00' },
    { value: '20:30', label: '20:30' },
];

function formatarData(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseBrazilianDateTime(dateStr: string, timeStr: string): Date | null {
    if (!dateStr || !timeStr) return null;
    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;
    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);
    if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12 || year < 2020 || year > 2100) {
        return null;
    }
    const timeParts = timeStr.split(':');
    if (timeParts.length < 2) return null;
    const hours = Number(timeParts[0]);
    const minutes = Number(timeParts[1]);
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }
    const d = new Date(year, month - 1, day, hours, minutes, 0);
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
        return null;
    }
    return d;
}

export default function AppointmentEditPage(): React.JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [barbers, setBarbers] = useState<BarberResponse[]>([]);
    const [servicesList, setServicesList] = useState<ServiceResponse[]>([]);

    const [customerName, setCustomerName] = useState('');
    const [barberId, setBarberId] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');
    const [status, setStatus] = useState<AppointmentStatus>('SCHEDULED');
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

    const [loadingData, setLoadingData] = useState(true);
    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
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

            // Formata para data brasileira (DD/MM/AAAA) e hora (HH:mm)
            const dateObj = new Date(appt.startsAt);
            const d = String(dateObj.getDate()).padStart(2, '0');
            const m = String(dateObj.getMonth() + 1).padStart(2, '0');
            const y = dateObj.getFullYear();
            setAppointmentDate(`${d}/${m}/${y}`);

            const hh = String(dateObj.getHours()).padStart(2, '0');
            const mm = String(dateObj.getMinutes()).padStart(2, '0');
            setAppointmentTime(`${hh}:${mm}`);

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

        if (!appointmentDate || !appointmentTime) {
            setErrors({
                date: !appointmentDate ? 'Informe a data do atendimento.' : undefined,
                time: !appointmentTime ? 'Selecione o horário do atendimento.' : undefined,
            });
            return;
        }

        const parsedDate = parseBrazilianDateTime(appointmentDate, appointmentTime);
        if (!parsedDate) {
            setErrors({ date: 'Informe uma data válida no formato DD/MM/AAAA.' });
            return;
        }

        const isoDate = parsedDate.toISOString();

        const parsed = UpdateAppointmentSchema.safeParse({
            barberId,
            startsAt: isoDate,
            status,
            serviceIds: selectedServiceIds,
        });

        if (!parsed.success) {
            const nextErrors: Record<string, string> = {};
            parsed.error.issues.forEach((issue) => {
                const fieldName = String(issue.path[0]);
                if (fieldName === 'startsAt') {
                    nextErrors.date = issue.message;
                } else {
                    nextErrors[fieldName] = issue.message;
                }
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

    // Garante que o horário atual do agendamento esteja disponível na lista
    const currentOptions = TIME_OPTIONS.some((opt) => opt.value === appointmentTime)
        ? TIME_OPTIONS
        : [{ value: appointmentTime, label: appointmentTime }, ...TIME_OPTIONS];

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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Input
                                label="Data do Atendimento"
                                name="appointmentDate"
                                type="text"
                                placeholder="DD/MM/AAAA"
                                maxLength={10}
                                value={appointmentDate}
                                onChange={(e) => setAppointmentDate(formatarData(e.target.value))}
                                error={errors.date}
                                helperText="Formato brasileiro: DD/MM/AAAA"
                                required
                            />
                            <label
                                htmlFor="calendar-picker-edit"
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '36px',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    userSelect: 'none',
                                    lineHeight: '1',
                                }}
                                title="Abrir calendário"
                            >
                                📅
                            </label>
                            <input
                                id="calendar-picker-edit"
                                type="date"
                                tabIndex={-1}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '34px',
                                    width: '28px',
                                    height: '28px',
                                    opacity: 0,
                                    cursor: 'pointer',
                                }}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        const [y, m, d] = e.target.value.split('-');
                                        setAppointmentDate(`${d}/${m}/${y}`);
                                    }
                                }}
                            />
                        </div>

                        <Select
                            label="Horário do Atendimento (24h)"
                            name="appointmentTime"
                            value={appointmentTime}
                            onChange={(e) => setAppointmentTime(e.target.value)}
                            options={currentOptions}
                            error={errors.time}
                            placeholder="Selecione o horário..."
                            required
                        />
                    </div>

                    {appointmentDate.length === 10 && appointmentTime && (
                        <div style={{ margin: '-0.25rem 0 1.25rem', padding: '0.65rem 0.85rem', background: '#faf9f6', border: '1px solid #e5e0d8', borderRadius: '6px', fontSize: '0.9rem', color: '#4a4843', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>🕒</span>
                            <span>
                                Atendimento para <strong>{appointmentDate}</strong> às <strong>{appointmentTime}</strong>
                            </span>
                        </div>
                    )}

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
