import { and, eq, ne } from 'drizzle-orm';
import { db } from '../db/client.js';
import { users } from '../db/schema.js';
import type { UpdateUserInput } from '@barbearia/contracts';
import { Cpf, PasswordCredential } from '../domain/account.js';
import { ConflictError, NotFoundError, ValidationError } from '../domain/exceptions/AppError.js';

export class UserService {
    async getProfile(userId: string) {
        const [user] = await db
            .select({
                id: users.id,
                name: users.name,
                email: users.email,
                cpf: users.cpf,
                role: users.role,
                createdAt: users.createdAt,
            })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user) throw new NotFoundError('Usuário');
        return user;
    }

    async updateProfile(userId: string, input: UpdateUserInput) {
        const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        if (!user) throw new NotFoundError('Usuário');

        // Valida CPF
        const cpf = new Cpf(input.cpf);
        const cpfLimpo = cpf.toDatabaseValue();

        const [cpfEmUso] = await db
            .select()
            .from(users)
            .where(and(eq(users.cpf, cpfLimpo), ne(users.id, userId)))
            .limit(1);

        if (cpfEmUso) {
            throw new ConflictError('Já existe outra conta com este CPF cadastrado.');
        }

        let novoPasswordHash: string | undefined;
        if (input.newPassword) {
            if (!input.currentPassword) {
                throw new ValidationError('Informe sua senha atual para alterar a senha.');
            }

            const credential = PasswordCredential.fromPlainText(input.currentPassword);
            const senhaCorreta = await credential.matches(user.passwordHash);
            if (!senhaCorreta) {
                throw new ValidationError('A senha atual informada está incorreta.');
            }

            novoPasswordHash = await PasswordCredential.fromPlainText(input.newPassword).hashForStorage();
        }

        // Atualiza garantindo que o e-mail NUNCA é alterado e preserva a
        // senha existente quando o usuário só edita os dados cadastrais.
        await db.update(users)
            .set({
                name: input.name.trim(),
                cpf: cpfLimpo,
                ...(novoPasswordHash ? { passwordHash: novoPasswordHash } : {}),
            })
            .where(eq(users.id, userId));

        return this.getProfile(userId);
    }
}
