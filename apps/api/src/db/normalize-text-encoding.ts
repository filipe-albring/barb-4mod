import { eq } from 'drizzle-orm';
import { db, pool } from './client.js';
import { barbers, products, services } from './schema.js';
import { normalizeLegacyEncoding } from '../domain/text/normalizeLegacyEncoding.js';

let updatedRecords = 0;

const productRows = await db.select({
    id: products.id,
    name: products.name,
    description: products.description,
    category: products.category,
}).from(products);

for (const product of productRows) {
    const name = normalizeLegacyEncoding(product.name);
    const description = normalizeLegacyEncoding(product.description);
    const category = normalizeLegacyEncoding(product.category);
    if (name !== product.name || description !== product.description || category !== product.category) {
        await db.update(products).set({ name, description, category }).where(eq(products.id, product.id));
        updatedRecords += 1;
    }
}

const serviceRows = await db.select({
    id: services.id,
    name: services.name,
    description: services.description,
}).from(services);

for (const service of serviceRows) {
    const name = normalizeLegacyEncoding(service.name);
    const description = normalizeLegacyEncoding(service.description);
    if (name !== service.name || description !== service.description) {
        await db.update(services).set({ name, description }).where(eq(services.id, service.id));
        updatedRecords += 1;
    }
}

const barberRows = await db.select({
    id: barbers.id,
    name: barbers.name,
    specialty: barbers.specialty,
}).from(barbers);

for (const barber of barberRows) {
    const name = normalizeLegacyEncoding(barber.name);
    const specialty = normalizeLegacyEncoding(barber.specialty);
    if (name !== barber.name || specialty !== barber.specialty) {
        await db.update(barbers).set({ name, specialty }).where(eq(barbers.id, barber.id));
        updatedRecords += 1;
    }
}

console.info(`Codificação normalizada em ${updatedRecords} registro(s) do catálogo.`);
await pool.end();
