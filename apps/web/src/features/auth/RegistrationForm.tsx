'use client';

import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { EMAIL_REGEX, RegisterSchema } from '@barbearia/contracts';
import type { RegisterInput } from '@barbearia/contracts';
import { errorMessage, registerCustomer, registerEmployee } from './api';
import { Alert, Button, Input } from '../../components/ui';

interface RegistrationFormProps {
    employee?: boolean;
}

type FieldName = 'name' | 'email' | 'cpf' | 'password' | 'confirmPassword';
type FormValues = Record<FieldName, string>;

const initialValues: FormValues = {
    name: '',
    email: '',
    cpf: '',
    password: '',
    confirmPassword: '',
};

function formatarCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export default function RegistrationForm({ employee = false }: RegistrationFormProps): React.JSX.Element {
    const [values, setValues] = useState<FormValues>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
    const [message, setMessage] = useState('');
    const [messageIsError, setMessageIsError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    function change(field: FieldName, value: string): void {
        setValues((current) => ({ ...current, [field]: value }));
        setErrors((current) => ({ ...current, [field]: undefined }));
    }

    const validatePasswordLevel = (pass: string) => {
        return {
            length: pass.length >= 12,
            lower: /[a-z]/.test(pass),
            upper: /[A-Z]/.test(pass),
            number: /[0-9]/.test(pass),
            special: /[^A-Za-z0-9]/.test(pass),
        };
    };

    const passCheck = validatePasswordLevel(values.password);

    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setMessage('');
        setMessageIsError(false);

        const nextErrors: Partial<Record<FieldName, string>> = {};

        // Validação explícita de e-mail via Regex
        if (!EMAIL_REGEX.test(values.email.trim())) {
            nextErrors.email = 'Informe um e-mail válido (ex: cliente@exemplo.com).';
        }

        const parsed = RegisterSchema.safeParse({
            name: values.name,
            email: values.email,
            cpf: values.cpf,
            password: values.password,
        });

        if (!parsed.success) {
            parsed.error.issues.forEach((issue) => {
                const field = issue.path[0];
                if (typeof field === 'string' && field in values) {
                    nextErrors[field as FieldName] = issue.message;
                }
            });
        }

        if (values.confirmPassword !== values.password) {
            nextErrors.confirmPassword = 'As senhas informadas precisam ser idênticas.';
        }

        setErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0 || !parsed.success) return;

        setIsSubmitting(true);
        try {
            const input: RegisterInput = parsed.data;
            if (employee) {
                await registerEmployee(input);
                setValues(initialValues);
                setMessage('Novo funcionário cadastrado com sucesso.');
            } else {
                await registerCustomer(input);
                navigate('/login', {
                    replace: true,
                    state: { notice: 'Cadastro concluído com sucesso! Entre na sua conta para agendar.' },
                });
            }
        } catch (error: unknown) {
            setMessage(errorMessage(error));
            setMessageIsError(true);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="auth-card">
            <span className="eyebrow">Barbearia Prime</span>
            <h1>{employee ? 'Cadastrar Funcionário' : 'Criar Conta de Cliente'}</h1>
            <p className="sub">
                {employee
                    ? 'Adicione um membro da equipe com perfil de acesso ao painel.'
                    : 'Cadastre-se para agendar cortes e acompanhar seus horários.'}
            </p>

            {message && (
                <Alert variant={messageIsError ? 'error' : 'success'}>
                    {message}
                </Alert>
            )}

            <form onSubmit={(event) => void submit(event)} noValidate>
                <Input
                    label="Nome Completo"
                    name="name"
                    autoComplete="name"
                    value={values.name}
                    onChange={(e) => change('name', e.target.value)}
                    error={errors.name}
                    placeholder="Ex: João da Silva"
                    required
                />

                <Input
                    label="E-mail"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(e) => change('email', e.target.value)}
                    error={errors.email}
                    placeholder="exemplo@dominio.com"
                    required
                />

                <Input
                    label="CPF"
                    name="cpf"
                    maxLength={14}
                    value={formatarCpf(values.cpf)}
                    onChange={(e) => change('cpf', e.target.value)}
                    error={errors.cpf}
                    placeholder="000.000.000-00"
                    required
                />

                <Input
                    label="Senha"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={values.password}
                    onChange={(e) => change('password', e.target.value)}
                    error={errors.password}
                    placeholder="Mínimo de 12 caracteres"
                    required
                />

                {values.password && (
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
                            {passCheck.special ? '✔' : '✖'} Símbolo (!@#$...)
                        </span>
                    </div>
                )}

                <Input
                    label="Confirme a Senha"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={values.confirmPassword}
                    onChange={(e) => change('confirmPassword', e.target.value)}
                    error={errors.confirmPassword}
                    placeholder="Repita a senha"
                    required
                />

                <div className="form-actions">
                    <Button type="submit" isLoading={isSubmitting} style={{ width: '100%' }}>
                        {employee ? 'Salvar Funcionário' : 'Criar Minha Conta'}
                    </Button>
                </div>
            </form>

            {!employee && (
                <p className="form-foot">
                    Já possui conta? <Link to="/login">Entrar</Link>
                </p>
            )}
        </main>
    );
}
