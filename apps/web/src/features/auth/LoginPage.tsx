'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LoginSchema } from '@barbearia/contracts';
import type { LoginInput } from '@barbearia/contracts';
import { errorMessage, login } from './api';
import { useAuth } from './AuthProvider';

interface LocationNotice { state: { notice?: string } | null; }

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
            <p className="sub">Clientes consultam seus próprios dados. A equipe acessa a gestão da barbearia.</p>
            {location.state?.notice && <div className="notice" role="status">{location.state.notice}</div>}
            {message && <div className="notice error" role="alert">{message}</div>}
            <form onSubmit={(event) => void submit(event)}>
                <div className="field"><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
                <div className="field"><label htmlFor="password">Senha</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
                <div className="form-actions"><button className="button" type="submit" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button></div>
            </form>
            <p className="form-foot">Ainda não tem conta? <Link to="/cadastro">Cadastrar-se</Link></p>
        </main>
    );
}
