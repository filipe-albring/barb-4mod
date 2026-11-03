import { RegisterSchema } from '@barbearia/contracts';
import { eq } from 'drizzle-orm';
import { db, pool } from './client.js';
import { users } from './schema.js';
import { Cpf, PasswordCredential } from '../domain/account.js';

const dados = {
    name: process.env.SEED_ADMIN_NAME ?? '',
    email: process.env.SEED_ADMIN_EMAIL ?? '',
    password: process.env.SEED_ADMIN_PASSWORD ?? '',
    cpf: process.env.SEED_ADMIN_CPF ?? '',
};

if (!Object.values(dados).every(Boolean)) {
    console.info('Seed do administrador ignorado: configure SEED_ADMIN_NAME, EMAIL, PASSWORD e CPF.');
    await pool.end();
    process.exit(0);
}

const validacao = RegisterSchema.safeParse(dados);
if (!validacao.success) {
    console.error('Dados do administrador inicial são inválidos:', validacao.error.flatten().fieldErrors);
    await pool.end();
    process.exit(1);
}

const admin = validacao.data;
const passwordHash = await PasswordCredential.fromPlainText(admin.password).hashForStorage();
await db.insert(users).values({
    name: admin.name,
    email: admin.email,
    cpf: new Cpf(admin.cpf).toDatabaseValue(),
    passwordHash,
    role: 'ADMIN',
}).onConflictDoNothing();

const [adminExistente] = await db.select({ role: users.role }).from(users).where(eq(users.email, admin.email)).limit(1);
if (adminExistente?.role !== 'ADMIN') {
    console.error('Não foi possível criar o administrador inicial: o e-mail ou CPF já está em uso. Configure dados ainda não cadastrados.');
    await pool.end();
    process.exit(1);
}

console.info(`Conta administrativa inicial verificada para ${admin.email}.`);
await pool.end();
