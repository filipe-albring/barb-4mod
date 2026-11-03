'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, errorMessage } from '../auth/api';
import type { DashboardAnalytics } from './types';
import {
    Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';

const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dateLabel = (day: string): string => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(`${day}T12:00:00`));

export default function DashboardPage(): React.JSX.Element {
    const [period, setPeriod] = useState(30);
    const [data, setData] = useState<DashboardAnalytics | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError('');
        api.get<DashboardAnalytics>('/dashboard/analytics', {
            params: { period },
            signal: controller.signal,
        }).then((response) => setData(response.data)).catch((cause: unknown) => {
            if (!controller.signal.aborted) setError(errorMessage(cause));
        }).finally(() => {
            if (!controller.signal.aborted) setLoading(false);
        });

        return () => controller.abort();
    }, [period]);

    const serviceChart = useMemo(() => (data?.services ?? [])
        .filter((item) => item.appointments > 0)
        .map((item) => ({
            ...item,
            label: item.service.length > 18 ? `${item.service.slice(0, 16)}…` : item.service,
            revenueLabel: currency.format(item.revenue),
        })), [data]);

    const dailyChart = useMemo(() => (data?.daily ?? []).map((item) => ({
        ...item,
        label: dateLabel(item.day),
    })), [data]);

    return <main className="page-wrap">
        <section className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap' }}>
            <div><span className="eyebrow">Painel da equipe</span><h1>Visão da barbearia</h1><p>Agendamentos e serviços no período selecionado.</p></div>
            <label className="field" style={{ minWidth: 180 }}>Período
                <select value={period} onChange={(event) => setPeriod(Number(event.target.value))}>
                    <option value={7}>Últimos 7 dias</option><option value={30}>Últimos 30 dias</option><option value={90}>Últimos 90 dias</option>
                </select>
            </label>
        </section>

        {error && <div className="notice error" role="alert">{error}</div>}
        {loading && <p className="loading">Atualizando indicadores...</p>}
        {!loading && data && <>
            <section className="metrics" aria-label="Indicadores">
                <article className="metric"><div className="metric-label">Agendamentos ativos</div><div className="metric-value">{data.summary.appointments}</div></article>
                <article className="metric"><div className="metric-label">Faturamento previsto</div><div className="metric-value">{currency.format(data.summary.projectedRevenue)}</div></article>
                <article className="metric"><div className="metric-label">Dia de maior movimento</div><div className="metric-value" style={{ fontSize: '1.35rem' }}>{data.summary.bestDay ? dateLabel(data.summary.bestDay) : '—'}</div></article>
                <article className="metric"><div className="metric-label">Serviço em destaque</div><div className="metric-value" style={{ fontSize: '1.35rem' }}>{data.summary.topService ?? '—'}</div></article>
            </section>

            <section className="grid-two">
                <article className="panel"><h2>Movimento por dia</h2><p>Série temporal de agendamentos não cancelados.</p>
                    {dailyChart.length ? <div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={dailyChart} margin={{ top: 12, right: 8, left: -20, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece8df" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <Tooltip labelFormatter={(label) => `Dia ${label}`} />
                        <Bar dataKey="appointments" name="Agendamentos" fill="#b68a25" radius={[5, 5, 0, 0]} />
                    </BarChart></ResponsiveContainer></div> : <div className="empty">Nenhum agendamento encontrado para este período.</div>}
                </article>
                <article className="panel"><h2>Serviços mais procurados</h2><p>Comparação de volume por serviço.</p>
                    {serviceChart.length ? <div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={serviceChart} layout="vertical" margin={{ top: 8, right: 10, left: 5, bottom: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ece8df" />
                        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="label" width={100} tickLine={false} axisLine={false} />
                        <Tooltip formatter={(value) => [`${value} agendamento(s)`, 'Volume']} />
                        <Bar dataKey="appointments" name="Agendamentos" fill="#282825" radius={[0, 5, 5, 0]} />
                    </BarChart></ResponsiveContainer></div> : <div className="empty">Nenhum serviço teve agendamento neste período.</div>}
                </article>
            </section>
            <p className="hint">Faturamento previsto soma os preços registrados nos agendamentos não cancelados; pagamentos reais ainda não fazem parte desta etapa.</p>
        </>}
    </main>;
}
