import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
pool.on('error', (error: Error) => console.error('Erro inesperado no pool PostgreSQL:', error));

export const db = drizzle(pool, { schema });
export { pool };
