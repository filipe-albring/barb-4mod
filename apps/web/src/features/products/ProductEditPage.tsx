'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { ProductResponse } from '@barbearia/contracts';
import { UpdateProductSchema } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { Alert, Button, Input, Select } from '../../components/ui';

export default function ProductEditPage(): React.JSX.Element {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('0');
    const [active, setActive] = useState(true);

    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!id) return;
        api.get<ProductResponse>(`/products/${id}`)
            .then((res) => {
                setName(res.data.name);
                setDescription(res.data.description ?? '');
                setCategory(res.data.category);
                setPrice(String(res.data.price));
                setStock(String(res.data.stock));
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

        const parsed = UpdateProductSchema.safeParse({
            name,
            description,
            category,
            price: Number(price),
            stock: Number(stock),
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
            await api.put(`/products/${id}`, parsed.data);
            navigate('/produtos');
        } catch (err: unknown) {
            setErrorMsg(errorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return (
            <main className="page-wrap">
                <p className="loading">Carregando dados do produto...</p>
            </main>
        );
    }

    return (
        <main className="page-wrap">
            <section className="page-heading">
                <span className="eyebrow">Edição de Estoque</span>
                <h1>Editar Produto</h1>
                <p>Atualize preço, quantidade em estoque e detalhes do produto.</p>
            </section>

            {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

            <div className="panel form-panel">
                <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                    <Input
                        label="Nome do Produto"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={errors.name}
                        required
                    />

                    <Select
                        label="Categoria"
                        name="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        options={[
                            { value: 'Cabelo', label: 'Cabelo (Pomadas, Pastas, Sprays)' },
                            { value: 'Barba', label: 'Barba (Óleos, Balms, Shampoos)' },
                            { value: 'Pele', label: 'Pele (Pós-barba, Hidratantes, Esfoliantes)' },
                            { value: 'Acessórios', label: 'Acessórios (Pentes, Escovas, Lâminas)' },
                        ]}
                        error={errors.category}
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
                        label="Preço de Venda (R$)"
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
                        label="Quantidade em Estoque"
                        name="stock"
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) => setStock(e.target.value)}
                        error={errors.stock}
                        required
                    />

                    <div className="field-checkbox">
                        <label>
                            <input
                                type="checkbox"
                                checked={active}
                                onChange={(e) => setActive(e.target.checked)}
                            />
                            Produto ativo para venda
                        </label>
                    </div>

                    <div className="form-actions">
                        <Link to="/produtos" className="btn btn-outline">
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
