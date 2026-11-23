'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { EMAIL_REGEX, LoginSchema } from '@barbearia/contracts';
import type { LoginInput } from '@barbearia/contracts';
import { errorMessage, login } from './api';
import { useAuth } from './AuthProvider';
import { Alert, Button, Input } from '../../components/ui';

interface LocationNotice {
    state: { notice?: string } | null;
}

export default function LoginPage(): React.JSX.Element {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const { acceptSession } = useAuth();
    const navigate = useNavigate();
    const location = useLocation() as LocationNotice;

    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setMessage('');

        // Validação explícita por regex no frontend
        if (!EMAIL_REGEX.test(email.trim())) {
            setMessage('Informe um e-mail válido no formato exemplo@dominio.com.');
            return;
        }

        const input = LoginSchema.safeParse({ email, password });
        if (!input.success) {
            setMessage(input.error.issues[0]?.message ?? 'Confira os dados informados.');
            return;
        }

        setBusy(true);
        try {
            const session = await login(input.data satisfies LoginInput);
            acceptSession(session);
            navigate(session.user.role === 'CUSTOMER' ? '/minha-conta' : '/dashboard', { replace: true });
        } catch (error: unknown) {
            setMessage(errorMessage(error));
        } finally {
            setBusy(false);
        }
    }

    return (
        <main className="auth-card">
            <span className="eyebrow">Acesso seguro</span>
            <h1>Entrar</h1>
            <p className="sub">Clientes agendam e consultam seus horários. A equipe gerencia a barbearia.</p>

            {location.state?.notice && <Alert variant="info">{location.state.notice}</Alert>}
            {message && <Alert variant="error">{message}</Alert>}

            <form onSubmit={(event) => void submit(event)}>
                <Input
                    label="E-mail"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="seu.email@exemplo.com"
                    required
                />

                <Input
                    label="Senha"
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Digite sua senha"
                    required
                />

                <div className="form-actions">
                    <Button type="submit" isLoading={busy} style={{ width: '100%' }}>
                        Entrar
                    </Button>
                </div>
            </form>
            <p className="form-foot">
                Ainda não tem conta? <Link to="/cadastro">Cadastrar-se</Link>
            </p>
        </main>
    );
}
