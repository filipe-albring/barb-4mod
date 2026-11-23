import { RegisterSchema } from '@barbearia/contracts';
import { eq } from 'drizzle-orm';
import { db, pool } from './client.js';
import { users } from './schema.js';
import { Cpf, PasswordCredential } from '../domain/account.js';
import { randomUUID } from 'node:crypto';

const dados = {
    name: process.env.SEED_ADMIN_NAME ?? 'Administrador Barbearia',
    email: process.env.SEED_ADMIN_EMAIL ?? 'admin@barbearia.com',
    password: process.env.SEED_ADMIN_PASSWORD ?? 'SenhaForte@2026',
    cpf: process.env.SEED_ADMIN_CPF ?? '52998224725',
};

const validacao = RegisterSchema.safeParse(dados);
if (!validacao.success) {
    console.error('Dados do administrador inicial são inválidos:', validacao.error.flatten().fieldErrors);
    await pool.end();
    process.exit(1);
}

const admin = validacao.data;
const [adminExistente] = await db.select().from(users).where(eq(users.email, admin.email)).limit(1);

if (!adminExistente) {
    const passwordHash = await PasswordCredential.fromPlainText(admin.password).hashForStorage();
    await db.insert(users).values({
        id: randomUUID(),
        name: admin.name,
        email: admin.email,
        cpf: new Cpf(admin.cpf).toDatabaseValue(),
        passwordHash,
        role: 'ADMIN',
    });
    console.info(`Conta administrativa inicial criada com sucesso para ${admin.email}.`);
} else {
    console.info(`Conta administrativa inicial já existente para ${admin.email}.`);
}

await pool.end();
