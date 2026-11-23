'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { errorMessage, updateUserProfile } from '../auth/api';
import { Alert, Button, Input } from '../../components/ui';
import { UpdateUserSchema } from '@barbearia/contracts';

function formatarCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function ProfileEditPage(): React.JSX.Element {
    const { user, updateCurrentUser } = useAuth();

    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            if (user.cpf) setCpf(formatarCpf(user.cpf));
        }
    }, [user]);

    const validatePasswordLevel = (pass: string) => {
        return {
            length: pass.length >= 12,
            lower: /[a-z]/.test(pass),
            upper: /[A-Z]/.test(pass),
            number: /[0-9]/.test(pass),
            special: /[^A-Za-z0-9]/.test(pass),
        };
    };

    const passCheck = validatePasswordLevel(newPassword);

    async function handleSubmit(event: React.FormEvent): Promise<void> {
        event.preventDefault();
        setStatusMessage(null);
        setErrors({});

        const parsed = UpdateUserSchema.safeParse({
            name,
            cpf,
            currentPassword,
            newPassword,
            confirmNewPassword,
        });

        if (!parsed.success) {
            const nextErrors: Record<string, string> = {};
            parsed.error.issues.forEach((issue) => {
                const fieldName = String(issue.path[0]);
                nextErrors[fieldName] = issue.message;
            });
            setErrors(nextErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const updatedUser = await updateUserProfile(parsed.data);
            updateCurrentUser(updatedUser);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setStatusMessage({ type: 'success', text: 'Seus dados foram atualizados com sucesso!' });
        } catch (err: unknown) {
            setStatusMessage({ type: 'error', text: errorMessage(err) });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="page-wrap">
            <section className="page-heading">
                <span className="eyebrow">Configurações da Conta</span>
                <h1>Editar Meu Perfil</h1>
                <p>Mantenha seus dados atualizados e sua senha segura.</p>
            </section>

            {statusMessage && (
                <Alert variant={statusMessage.type === 'success' ? 'success' : 'error'}>
                    {statusMessage.text}
                </Alert>
            )}

            <div className="panel form-panel">
                <form onSubmit={(e) => void handleSubmit(e)} noValidate>
                    <Input
                        label="Nome Completo"
                        name="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        error={errors.name}
                        required
                    />

                    <div className="field">
                        <label htmlFor="email">E-mail de Acesso</label>
                        <input
                            id="email"
                            type="email"
                            value={user?.email ?? ''}
                            disabled
                            className="input-disabled"
                        />
                        <span className="field-hint">O e-mail é a chave de login e não pode ser alterado por segurança.</span>
                    </div>

                    <Input
                        label="CPF"
                        name="cpf"
                        value={cpf}
                        maxLength={14}
                        onChange={(e) => setCpf(formatarCpf(e.target.value))}
                        error={errors.cpf}
                        placeholder="000.000.000-00"
                        required
                    />

                    <hr className="divider" />

                    <h3>Segurança e Atualização de Senha</h3>
                    <p className="sub">Deixe os campos abaixo vazios para alterar somente nome ou CPF. Para trocar a senha, preencha os três campos.</p>

                    <Input
                        label="Senha Atual (somente para troca)"
                        name="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        error={errors.currentPassword}
                        placeholder="Digite sua senha atual"
                    />

                    <Input
                        label="Nova Senha (opcional)"
                        name="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        error={errors.newPassword}
                        placeholder="Mínimo de 12 caracteres com maiúscula, minúscula, número e símbolo"
                    />

                    {newPassword && (
                        <div className="password-checklist">
                            <span className={passCheck.length ? 'checked' : 'unchecked'}>
                                {passCheck.length ? '✔' : '✖'} Mínimo 12 caracteres
                            </span>
                            <span className={passCheck.upper ? 'checked' : 'unchecked'}>
                                {passCheck.upper ? '✔' : '✖'} Letra maiúscula
                            </span>
                            <span className={passCheck.lower ? 'checked' : 'unchecked'}>
                                {passCheck.lower ? '✔' : '✖'} Letra minúscula
                            </span>
                            <span className={passCheck.number ? 'checked' : 'unchecked'}>
                                {passCheck.number ? '✔' : '✖'} Número
                            </span>
                            <span className={passCheck.special ? 'checked' : 'unchecked'}>
                                {passCheck.special ? '✔' : '✖'} Símbolo especial (!@#$...)
                            </span>
                        </div>
                    )}

                    <Input
                        label="Confirme a Nova Senha"
                        name="confirmNewPassword"
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        error={errors.confirmNewPassword}
                        placeholder="Repita a nova senha exatamente"
                    />

                    <div className="form-actions">
                        <Button type="submit" isLoading={isSubmitting}>
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </div>
        </main>
    );
}
