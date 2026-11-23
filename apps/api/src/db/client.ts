import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema.js';

const connectionUri = process.env.DATABASE_URL ?? 'mysql://barbearia:barbearia_dev@localhost:3306/barbearia';

export const pool = mysql.createPool(connectionUri);

export const db = drizzle(pool, { schema, mode: 'default' });
