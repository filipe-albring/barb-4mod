'use client';

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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

    const productChart = useMemo(() => (data?.products ?? [])
        .filter((item) => item.quantity > 0)
        .map((item) => ({
            ...item,
            label: item.product.length > 18 ? `${item.product.slice(0, 16)}…` : item.product,
            revenueLabel: currency.format(item.revenue),
        })), [data]);

    return <main className="page-wrap">
        <section className="page-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
                <span className="eyebrow">Painel da equipe</span>
                <h1>Visão da barbearia</h1>
                <p>Métricas consolidadas de atendimentos, serviços e produtos no período.</p>
            </div>
            <label className="field" style={{ minWidth: 180 }}>Período
                <select value={period} onChange={(event) => setPeriod(Number(event.target.value))}>
                    <option value={7}>Últimos 7 dias</option>
                    <option value={30}>Últimos 30 dias</option>
                    <option value={90}>Últimos 90 dias</option>
                </select>
            </label>
        </section>

        {error && <div className="notice error" role="alert">{error}</div>}
        {loading && <p className="loading">Atualizando indicadores...</p>}
        {!loading && data && <>
            {/* Bloco 1: Indicadores Financeiros e Volume */}
            <section className="metrics" aria-label="Indicadores Financeiros" style={{ marginBottom: '1.25rem' }}>
                <article className="metric">
                    <div className="metric-label">Faturamento Consolidado</div>
                    <div className="metric-value" style={{ color: 'var(--primary, #b68a25)' }}>
                        {currency.format(data.summary.totalRevenue ?? (data.summary.projectedRevenue + (data.summary.productsRevenue ?? 0)))}
                    </div>
                </article>
                <article className="metric">
                    <div className="metric-label">Faturamento Serviços</div>
                    <div className="metric-value">
                        {currency.format(data.summary.servicesRevenue ?? data.summary.projectedRevenue)}
                    </div>
                </article>
                <article className="metric">
                    <div className="metric-label">Faturamento Produtos</div>
                    <div className="metric-value">
                        {currency.format(data.summary.productsRevenue ?? 0)}
                    </div>
                </article>
                <article className="metric">
                    <div className="metric-label">Agendamentos Ativos</div>
                    <div className="metric-value">{data.summary.appointments}</div>
                </article>
            </section>

            {/* Bloco 2: Destaques e Estoque */}
            <section className="metrics" aria-label="Destaques operacionais" style={{ marginBottom: '1.5rem' }}>
                <article className="metric">
                    <div className="metric-label">Dia de maior movimento</div>
                    <div className="metric-value" style={{ fontSize: '1.35rem' }}>
                        {data.summary.bestDay ? dateLabel(data.summary.bestDay) : '—'}
                    </div>
                </article>
                <article className="metric">
                    <div className="metric-label">Serviço em destaque</div>
                    <div className="metric-value" style={{ fontSize: '1.35rem' }}>
                        {data.summary.topService ?? '—'}
                    </div>
                </article>
                <article className="metric">
                    <div className="metric-label">Produto em destaque</div>
                    <div className="metric-value" style={{ fontSize: '1.35rem' }}>
                        {data.summary.topProduct ?? (data.products?.[0]?.product ?? '—')}
                    </div>
                </article>
                <article className="metric">
                    <div className="metric-label">Estoque Total Ativo</div>
                    <div className="metric-value" style={{ fontSize: '1.35rem' }}>
                        {data.inventory ? `${data.inventory.totalStock} un (${data.inventory.totalProducts} produtos)` : '—'}
                    </div>
                </article>
            </section>

            {/* Bloco 3: Gráficos de Agendamentos e Serviços */}
            <section className="grid-two" style={{ marginBottom: '1.5rem' }}>
                <article className="panel">
                    <h2>Movimento por dia</h2>
                    <p>Série temporal de agendamentos não cancelados.</p>
                    {dailyChart.length ? (
                        <div className="chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dailyChart} margin={{ top: 12, right: 8, left: -20, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ece8df" />
                                    <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={18} />
                                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                                    <Tooltip labelFormatter={(label) => `Dia ${label}`} />
                                    <Bar dataKey="appointments" name="Agendamentos" fill="#b68a25" radius={[5, 5, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty">Nenhum agendamento encontrado para este período.</div>
                    )}
                </article>

                <article className="panel">
                    <h2>Serviços mais procurados</h2>
                    <p>Comparação de volume por serviço.</p>
                    {serviceChart.length ? (
                        <div className="chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={serviceChart} layout="vertical" margin={{ top: 8, right: 10, left: 5, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ece8df" />
                                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="label" width={100} tickLine={false} axisLine={false} />
                                    <Tooltip formatter={(value) => [`${value} agendamento(s)`, 'Volume']} />
                                    <Bar dataKey="appointments" name="Agendamentos" fill="#282825" radius={[0, 5, 5, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty">Nenhum serviço teve agendamento neste período.</div>
                    )}
                </article>
            </section>

            {/* Bloco 4: Produtos Demandados e Visão de Estoque */}
            <section className="grid-two">
                <article className="panel">
                    <h2>Produtos mais demandados</h2>
                    <p>Volume e receita gerada por produtos reservados no período.</p>
                    {productChart.length ? (
                        <div className="chart">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={productChart} layout="vertical" margin={{ top: 8, right: 10, left: 5, bottom: 8 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#ece8df" />
                                    <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                                    <YAxis type="category" dataKey="label" width={100} tickLine={false} axisLine={false} />
                                    <Tooltip formatter={(value, _name, item) => [`${value} unidade(s) (${(item?.payload as { revenueLabel?: string })?.revenueLabel ?? ''})`, 'Demanda']} />
                                    <Bar dataKey="quantity" name="Unidades" fill="#b68a25" radius={[0, 5, 5, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty">Nenhuma reserva ou venda de produto registrada neste período.</div>
                    )}
                </article>

                <article className="panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                        <h2>Patrimônio & Gestão de Estoque</h2>
                        <p>Visão em tempo real dos produtos físicos ativos da barbearia.</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
                            <div style={{ padding: '0.85rem', background: '#faf9f6', borderRadius: '8px', border: '1px solid #e5e0d8' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Valor em Estoque</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                    {currency.format(data.inventory?.totalStockValue ?? 0)}
                                </div>
                            </div>
                            <div style={{ padding: '0.85rem', background: '#faf9f6', borderRadius: '8px', border: '1px solid #e5e0d8' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Itens Disponíveis</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                    {data.inventory?.totalStock ?? 0} unidades
                                </div>
                            </div>
                            <div style={{ padding: '0.85rem', background: '#faf9f6', borderRadius: '8px', border: '1px solid #e5e0d8' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Produtos Ativos</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                    {data.inventory?.totalProducts ?? 0} produtos
                                </div>
                            </div>
                            <div style={{ padding: '0.85rem', background: '#faf9f6', borderRadius: '8px', border: '1px solid #e5e0d8' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>Saídas no Período</div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '0.25rem' }}>
                                    {data.summary.productsSold ?? 0} unidades
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #ece8df' }}>
                        <Link to="/produtos" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                            📦 Acessar Catálogo e Reposição
                        </Link>
                    </div>
                </article>
            </section>

            <p className="hint" style={{ marginTop: '1rem' }}>
                O faturamento consolidado considera a receita calculada a partir de agendamentos ativos e reservas de produtos no período selecionado.
            </p>
        </>}
    </main>;
}
