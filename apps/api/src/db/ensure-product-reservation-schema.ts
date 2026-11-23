import { pool } from './client.js';

// The MySQL image runs init.sql only when its volume is first created.  Keep
// existing local volumes compatible when the reservation feature is added.
await pool.query(`
    CREATE TABLE IF NOT EXISTS product_reservations (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        customer_id VARCHAR(36) NOT NULL,
        payment_method ENUM('PIX', 'CASH', 'CARD') NOT NULL,
        status ENUM('RESERVED') NOT NULL DEFAULT 'RESERVED',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_product_reservations_customer
            FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

await pool.query(`
    CREATE TABLE IF NOT EXISTS product_reservation_items (
        reservation_id VARCHAR(36) NOT NULL,
        product_id VARCHAR(36) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        PRIMARY KEY (reservation_id, product_id),
        CONSTRAINT fk_product_reservation_items_reservation
            FOREIGN KEY (reservation_id) REFERENCES product_reservations(id) ON DELETE CASCADE,
        CONSTRAINT fk_product_reservation_items_product
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`);

await pool.end();
