'use client';

import { useState } from 'react';
import type { FormEvent, JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { RegisterSchema } from '@barbearia/contracts';
import type { RegisterInput } from '@barbearia/contracts';
import { errorMessage, registerCustomer, registerEmployee } from './api';

interface RegistrationFormProps { employee?: boolean; }
type FieldName = 'name' | 'email' | 'cpf' | 'password' | 'confirmPassword';
type FormValues = Record<FieldName, string>;

const initialValues: FormValues = { name: '', email: '', cpf: '', password: '', confirmPassword: '' };

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

    async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault();
        setMessage('');
        setMessageIsError(false);

        const parsed = RegisterSchema.safeParse({
            name: values.name,
            email: values.email,
            cpf: values.cpf,
            password: values.password,
        });
        const nextErrors: Partial<Record<FieldName, string>> = {};

        if (!parsed.success) {
            parsed.error.issues.forEach((issue) => {
                const field = issue.path[0];
                if (typeof field === 'string' && field in values) nextErrors[field as FieldName] = issue.message;
            });
        }
        if (values.confirmPassword !== values.password) nextErrors.confirmPassword = 'As senhas precisam ser iguais.';
        setErrors(nextErrors);

        if (!parsed.success || Object.keys(nextErrors).length > 0) return;

        setIsSubmitting(true);
        try {
            const input: RegisterInput = parsed.data;
            if (employee) {
                await registerEmployee(input);
                setValues(initialValues);
                setMessage('Funcionário cadastrado. Ele já pode entrar com o e-mail e a senha definidos.');
            } else {
                await registerCustomer(input);
                navigate('/login', { replace: true, state: { notice: 'Cadastro concluído. Entre na sua conta para continuar.' } });
            }
        } catch (error: unknown) {
            setMessage(errorMessage(error));
            setMessageIsError(true);
        } finally {
            setIsSubmitting(false);
        }
    }

    const field = (name: FieldName, label: string, type = 'text', autocomplete?: string): JSX.Element => (
        <div className="field" key={name}>
            <label htmlFor={name}>{label}</label>
            <input
                id={name}
                name={name}
                type={type}
                autoComplete={autocomplete}
                value={name === 'cpf' ? formatarCpf(values[name]) : values[name]}
                maxLength={name === 'cpf' ? 14 : undefined}
                onChange={(event) => change(name, event.target.value)}
                aria-invalid={Boolean(errors[name])}
                aria-describedby={errors[name] ? `${name}-error` : undefined}
                required
            />
            {errors[name] && <span className="field-error" id={`${name}-error`}>{errors[name]}</span>}
        </div>
    );

    return (
        <main className="auth-card">
            <span className="eyebrow">Barbearia Prime</span>
            <h1>{employee ? 'Cadastrar funcionário' : 'Criar conta de cliente'}</h1>
            <p className="sub">{employee ? 'Adicione uma pessoa da equipe ao painel.' : 'Cadastre-se para acompanhar seus próprios dados e horários.'}</p>
            {message && <div className={`notice${messageIsError ? ' error' : ''}`} role={messageIsError ? 'alert' : 'status'}>{message}</div>}

            <form onSubmit={(event) => void submit(event)} noValidate>
                {field('name', 'Nome completo', 'text', 'name')}
                {field('email', 'E-mail', 'email', 'email')}
                {field('cpf', 'CPF', 'text', 'off')}
                {field('password', 'Senha', 'password', 'new-password')}
                <p className="hint">Mínimo de 12 caracteres, com maiúscula, minúscula, número e símbolo.</p>
                {field('confirmPassword', 'Confirme a senha', 'password', 'new-password')}
                <div className="form-actions"><button className="button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Cadastrar'}</button></div>
            </form>
            {!employee && <p className="form-foot">Já possui conta? <Link to="/login">Entrar</Link></p>}
        </main>
    );
}
