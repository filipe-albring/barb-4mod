'use client';

import { useEffect, useState } from 'react';
import { api, errorMessage } from '../auth/api';
import type { CustomerAppointment, CustomerProfile } from './types';

export default function CustomerPage(): React.JSX.Element {
    const [profile, setProfile] = useState<CustomerProfile | null>(null);
    const [appointments, setAppointments] = useState<CustomerAppointment[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        Promise.all([
            api.get<CustomerProfile>('/users/me', { signal: controller.signal }),
            api.get<CustomerAppointment[]>('/users/me/appointments', { signal: controller.signal }),
        ]).then(([profileResponse, appointmentsResponse]) => {
            setProfile(profileResponse.data);
            setAppointments(appointmentsResponse.data);
        }).catch((cause: unknown) => {
            if (!controller.signal.aborted) setError(errorMessage(cause));
        });
        return () => controller.abort();
    }, []);

    return <main className="page-wrap">
        <section className="page-heading"><span className="eyebrow">Área do cliente</span><h1>Seus dados</h1><p>Esta área mostra somente as informações da sua própria conta.</p></section>
        {error && <div className="notice error" role="alert">{error}</div>}
        {!profile && !error && <p className="loading">Carregando seus dados...</p>}
        {profile && <>
            <section className="panel"><h2>Meu perfil</h2><div className="customer-data">
                <div><span>Nome</span>{profile.name}</div><div><span>E-mail</span>{profile.email}</div><div><span>CPF</span>{`***.***.***-${profile.cpf.slice(-2)}`}</div>
            </div></section>
            <section className="panel"><h2>Meus agendamentos</h2><p>Somente horários vinculados à sua conta.</p>
                {appointments.length ? appointments.map((appointment) => <div className="customer-data" key={appointment.id}>
                    <div><span>Data</span>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(appointment.startsAt))}</div>
                    <div><span>Status</span>{appointment.status}</div>
                </div>) : <div className="empty">Você ainda não possui agendamentos registrados.</div>}
            </section>
        </>}
    </main>;
}
