import { buildApp } from './app.js';
import { pool } from './db/client.js';

const porta = Number(process.env.API_PORT ?? 3333);
const host = process.env.API_HOST ?? '0.0.0.0';
const app = await buildApp();

try {
    await pool.query('SELECT 1');
    await app.listen({ port: porta, host });
} catch (error) {
    app.log.error(error, 'A API não pôde iniciar');
    await pool.end();
    process.exit(1);
}

const encerrar = async (): Promise<void> => {
    await app.close();
    await pool.end();
};

process.once('SIGINT', () => void encerrar());
process.once('SIGTERM', () => void encerrar());
