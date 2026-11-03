import { z } from 'zod';

export const UserRoleSchema = z.enum(['CUSTOMER', 'EMPLOYEE', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

const emailSchema = z.string().trim().email('Informe um e-mail válido.').max(254)
    .transform((email) => email.toLocaleLowerCase('en-US'));
const cpfDigits = (value: string): string => value.replace(/\D/g, '');

export function cpfValido(value: string): boolean {
    const cpf = cpfDigits(value);

    if (cpf.length !== 11 || /^([0-9])\1{10}$/.test(cpf)) {
        return false;
    }

    const calcularDigito = (base: string, pesoInicial: number): number => {
        const soma = [...base].reduce((total, digito, indice) => total + Number(digito) * (pesoInicial - indice), 0);
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    };

    return calcularDigito(cpf.slice(0, 9), 10) === Number(cpf[9])
        && calcularDigito(cpf.slice(0, 10), 11) === Number(cpf[10]);
}

export const CpfSchema = z.string().trim().refine(cpfValido, 'Informe um CPF válido.').transform(cpfDigits);
export const PasswordSchema = z.string()
    .min(12, 'A senha precisa ter pelo menos 12 caracteres.')
    .max(128, 'A senha pode ter no máximo 128 caracteres.')
    .regex(/[a-z]/, 'Inclua ao menos uma letra minúscula.')
    .regex(/[A-Z]/, 'Inclua ao menos uma letra maiúscula.')
    .regex(/[0-9]/, 'Inclua ao menos um número.')
    .regex(/[^A-Za-z0-9]/, 'Inclua ao menos um símbolo.');

export const RegisterSchema = z.object({
    name: z.string().trim().min(2, 'Informe seu nome completo.').max(120),
    email: emailSchema,
    password: PasswordSchema,
    cpf: CpfSchema,
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({ email: emailSchema, password: z.string().min(1, 'Informe a senha.') });
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterResponseSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.string().email(),
    role: UserRoleSchema,
});

export const DashboardQuerySchema = z.object({
    period: z.coerce.number().int().min(7).max(90).default(30),
    staffId: z.string().uuid().optional(),
});
