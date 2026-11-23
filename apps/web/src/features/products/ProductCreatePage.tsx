'use client';

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CreateProductSchema } from '@barbearia/contracts';
import { api, errorMessage } from '../auth/api';
import { Alert, Button, Input, Select } from '../../components/ui';

export default function ProductCreatePage(): React.JSX.Element {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('10');
    const [active, setActive] = useState(true);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [errorMsg, setErrorMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        setErrorMsg('');
        setErrors({});

        const parsed = CreateProductSchema.safeParse({
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
            await api.post('/products', parsed.data);
            navigate('/produtos');
        } catch (err: unknown) {
            setErrorMsg(errorMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="page-wrap">
            <section className="page-heading">
                <span className="eyebrow">Novo Item</span>
                <h1>Cadastrar Produto</h1>
                <p>Adicione um novo produto ao estoque da barbearia.</p>
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
                        placeholder="Ex: Óleo Hidratante de Barba 30ml"
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
                        placeholder="Ex: Fragrância amadeirada com óleo de argan e rápida absorção."
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
                        placeholder="Ex: 38.50"
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
                            Salvar Produto
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
}
