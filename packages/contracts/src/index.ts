import { z } from 'zod';

export const UserRoleSchema = z.enum(['CUSTOMER', 'EMPLOYEE', 'ADMIN']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Expressão regular explícita para validação de e-mail (RFC 5322 simplificado)
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const emailSchema = z.string()
    .trim()
    .regex(EMAIL_REGEX, 'Informe um e-mail válido (ex: usuario@dominio.com).')
    .max(254, 'O e-mail pode ter no máximo 254 caracteres.')
    .transform((email) => email.toLocaleLowerCase('en-US'));

export const cpfDigits = (value: string): string => value.replace(/\D/g, '');

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
    .regex(/[^A-Za-z0-9]/, 'Inclua ao menos um símbolo especial (!@#$%^&*...).');

// ==========================
// USUÁRIOS & AUTENTICAÇÃO
// ==========================

export const RegisterSchema = z.object({
    name: z.string().trim().min(2, 'Informe seu nome completo.').max(120),
    email: emailSchema,
    password: PasswordSchema,
    cpf: CpfSchema,
});
export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, 'Informe a senha.'),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const RegisterResponseSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: UserRoleSchema,
});

export const UpdateUserSchema = z.object({
    name: z.string().trim().min(2, 'Informe seu nome completo.').max(120),
    cpf: CpfSchema,
    currentPassword: z.string().optional(),
    newPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
}).superRefine((data, context) => {
    const changingPassword = Boolean(data.currentPassword || data.newPassword || data.confirmNewPassword);
    if (!changingPassword) return;

    if (!data.currentPassword) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['currentPassword'], message: 'Informe sua senha atual para alterar a senha.' });
    }
    if (!data.newPassword) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['newPassword'], message: 'Informe a nova senha.' });
    } else {
        const passwordValidation = PasswordSchema.safeParse(data.newPassword);
        if (!passwordValidation.success) {
            passwordValidation.error.issues.forEach((issue) => context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['newPassword'],
                message: issue.message,
            }));
        }
    }
    if (!data.confirmNewPassword) {
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['confirmNewPassword'], message: 'Confirme a nova senha.' });
    } else if (data.newPassword !== data.confirmNewPassword) {
        context.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['confirmNewPassword'],
            message: 'A nova senha e a confirmação precisam ser idênticas.',
        });
    }
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

// ==========================
// PAGINAÇÃO
// ==========================

export const PaginationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface PaginatedResult<T> {
    data: T[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ==========================
// CRUD 1: BARBEIROS
// ==========================

export const BarberSchema = z.object({
    id: z.string(),
    name: z.string().trim().min(2, 'Nome deve ter pelo menos 2 caracteres.').max(100),
    cpf: CpfSchema,
    phone: z.string().trim().min(8, 'Telefone inválido.').max(20),
    specialty: z.string().trim().min(2, 'Especialidade obrigatória.').max(100),
    active: z.boolean().default(true),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const CreateBarberSchema = BarberSchema.omit({ id: true, createdAt: true, updatedAt: true });
export type CreateBarberInput = z.infer<typeof CreateBarberSchema>;

export const UpdateBarberSchema = CreateBarberSchema;
export type UpdateBarberInput = z.infer<typeof UpdateBarberSchema>;
export type BarberResponse = z.infer<typeof BarberSchema>;

// ==========================
// CRUD 2: SERVIÇOS
// ==========================

export const ServiceSchema = z.object({
    id: z.string(),
    name: z.string().trim().min(2, 'Nome do serviço deve ter pelo menos 2 caracteres.').max(100),
    description: z.string().trim().max(255).default(''),
    price: z.coerce.number().min(0, 'O preço não pode ser negativo.'),
    durationMinutes: z.coerce.number().int().min(5, 'Duração mínima de 5 minutos.').max(480, 'Duração máxima de 480 minutos.'),
    active: z.boolean().default(true),
    createdAt: z.string().optional(),
});

export const CreateServiceSchema = ServiceSchema.omit({ id: true, createdAt: true });
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

export const UpdateServiceSchema = CreateServiceSchema;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;
export type ServiceResponse = z.infer<typeof ServiceSchema>;

// ==========================
// CRUD 3: AGENDAMENTOS
// ==========================

export const AppointmentStatusSchema = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']);
export type AppointmentStatus = z.infer<typeof AppointmentStatusSchema>;

export const AppointmentServiceItemSchema = z.object({
    serviceId: z.string(),
    name: z.string(),
    unitPrice: z.coerce.number(),
});

export const AppointmentResponseSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    customerName: z.string(),
    barberId: z.string(),
    barberName: z.string(),
    startsAt: z.string(),
    status: AppointmentStatusSchema,
    totalPrice: z.coerce.number(),
    services: z.array(AppointmentServiceItemSchema),
    createdAt: z.string().optional(),
});
export type AppointmentResponse = z.infer<typeof AppointmentResponseSchema>;

export const CreateAppointmentSchema = z.object({
    customerId: z.string().min(1, 'Selecione o cliente.'),
    barberId: z.string().min(1, 'Selecione o barbeiro.'),
    startsAt: z.string().datetime('Data e hora no formato ISO obrigatória.'),
    serviceIds: z.array(z.string()).min(1, 'Selecione ao menos um serviço para o agendamento.'),
});
export type CreateAppointmentInput = z.infer<typeof CreateAppointmentSchema>;

export const UpdateAppointmentSchema = z.object({
    barberId: z.string().min(1, 'Selecione o barbeiro.'),
    startsAt: z.string().datetime('Data e hora no formato ISO obrigatória.'),
    status: AppointmentStatusSchema,
    serviceIds: z.array(z.string()).min(1, 'Selecione ao menos um serviço.'),
});
export type UpdateAppointmentInput = z.infer<typeof UpdateAppointmentSchema>;

// ==========================
// CRUD 4: PRODUTOS
// ==========================

export const ProductSchema = z.object({
    id: z.string(),
    name: z.string().trim().min(2, 'Nome do produto deve ter pelo menos 2 caracteres.').max(100),
    description: z.string().trim().max(255).default(''),
    category: z.string().trim().min(2, 'Categoria obrigatória.').max(60),
    price: z.coerce.number().min(0, 'O preço não pode ser negativo.'),
    stock: z.coerce.number().int().min(0, 'O estoque não pode ser negativo.'),
    active: z.boolean().default(true),
    createdAt: z.string().optional(),
});

export const CreateProductSchema = ProductSchema.omit({ id: true, createdAt: true });
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type ProductResponse = z.infer<typeof ProductSchema>;

// ==========================
// RESERVAS DE PRODUTOS PARA RETIRADA
// ==========================

export const PaymentMethodSchema = z.enum(['PIX', 'CASH', 'CARD']);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const ProductReservationStatusSchema = z.enum(['RESERVED']);
export type ProductReservationStatus = z.infer<typeof ProductReservationStatusSchema>;

export const ProductReservationItemSchema = z.object({
    productId: z.string().min(1),
    quantity: z.coerce.number().int().min(1, 'Informe ao menos uma unidade.').max(50, 'A reserva pode ter no máximo 50 unidades por produto.'),
});

export const CreateProductReservationSchema = z.object({
    paymentMethod: PaymentMethodSchema,
    items: z.array(ProductReservationItemSchema).min(1, 'Adicione ao menos um produto à reserva.'),
}).superRefine((data, context) => {
    const productIds = new Set<string>();
    data.items.forEach((item, index) => {
        if (productIds.has(item.productId)) {
            context.addIssue({
                code: z.ZodIssueCode.custom,
                path: ['items', index, 'productId'],
                message: 'Cada produto deve aparecer uma única vez na reserva.',
            });
        }
        productIds.add(item.productId);
    });
});
export type CreateProductReservationInput = z.infer<typeof CreateProductReservationSchema>;

export const ProductReservationResponseSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    paymentMethod: PaymentMethodSchema,
    status: ProductReservationStatusSchema,
    totalPrice: z.coerce.number(),
    createdAt: z.string(),
    items: z.array(z.object({
        productId: z.string(),
        name: z.string(),
        quantity: z.coerce.number().int(),
        unitPrice: z.coerce.number(),
    })),
});
export type ProductReservationResponse = z.infer<typeof ProductReservationResponseSchema>;

// ==========================
// DASHBOARD
// ==========================

export const DashboardQuerySchema = z.object({
    period: z.coerce.number().int().min(7).max(90).default(30),
    staffId: z.string().optional(),
});
