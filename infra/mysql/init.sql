-- Inicialização do Banco de Dados Barbearia Prime (MySQL 8.0)
CREATE DATABASE IF NOT EXISTS `barbearia` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `barbearia`;

-- 1. Tabela de Usuários (Autenticação, Clientes, Funcionários e Administradores)
CREATE TABLE IF NOT EXISTS `users` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(254) NOT NULL UNIQUE,
    `cpf` VARCHAR(11) NOT NULL UNIQUE,
    `password_hash` TEXT NOT NULL,
    `role` ENUM('CUSTOMER', 'EMPLOYEE', 'ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tabela de Sessões de Refresh Token
CREATE TABLE IF NOT EXISTS `refresh_sessions` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL UNIQUE,
    `expires_at` TIMESTAMP NOT NULL,
    `revoked_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_refresh_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. CRUD 1: Tabela de Barbeiros (Profissionais)
CREATE TABLE IF NOT EXISTS `barbers` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `cpf` VARCHAR(11) NOT NULL UNIQUE,
    `phone` VARCHAR(20) NOT NULL,
    `specialty` VARCHAR(100) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. CRUD 2: Tabela de Serviços
CREATE TABLE IF NOT EXISTS `services` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL DEFAULT '',
    `price` DECIMAL(10, 2) NOT NULL,
    `duration_minutes` INT NOT NULL DEFAULT 30,
    `active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. CRUD 3: Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS `appointments` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `customer_id` VARCHAR(36) NOT NULL,
    `barber_id` VARCHAR(36) NOT NULL,
    `starts_at` TIMESTAMP NOT NULL,
    `status` ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'SCHEDULED',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_appointments_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_appointments_barber` FOREIGN KEY (`barber_id`) REFERENCES `barbers` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Tabela Associativa: Serviços do Agendamento (Relacionamento N:N)
CREATE TABLE IF NOT EXISTS `appointment_services` (
    `appointment_id` VARCHAR(36) NOT NULL,
    `service_id` VARCHAR(36) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (`appointment_id`, `service_id`),
    CONSTRAINT `fk_appserv_appointment` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_appserv_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. CRUD 4: Tabela de Produtos da Barbearia
CREATE TABLE IF NOT EXISTS `products` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(255) NOT NULL DEFAULT '',
    `category` VARCHAR(60) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `stock` INT NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Reservas de produtos para retirada e pagamento presencial
CREATE TABLE IF NOT EXISTS `product_reservations` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `customer_id` VARCHAR(36) NOT NULL,
    `payment_method` ENUM('PIX', 'CASH', 'CARD') NOT NULL,
    `status` ENUM('RESERVED') NOT NULL DEFAULT 'RESERVED',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_product_reservations_customer` FOREIGN KEY (`customer_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_reservation_items` (
    `reservation_id` VARCHAR(36) NOT NULL,
    `product_id` VARCHAR(36) NOT NULL,
    `quantity` INT NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (`reservation_id`, `product_id`),
    CONSTRAINT `fk_product_reservation_items_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `product_reservations` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_product_reservation_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carga inicial de dados de demonstração da barbearia
INSERT IGNORE INTO `barbers` (`id`, `name`, `cpf`, `phone`, `specialty`, `active`) VALUES
('b001-uuid-barber-carlos-oliveira', 'Carlos Oliveira', '12345678901', '(11) 98765-4321', 'Corte Degradê e Fade', TRUE),
('b002-uuid-barber-rafael-santos', 'Rafael Santos', '23456789012', '(11) 97654-3210', 'Barba Terapia e Navalhado', TRUE),
('b003-uuid-barber-marcos-souza', 'Marcos Souza', '34567890123', '(11) 96543-2109', 'Corte Clássico e Tesoura', TRUE);

INSERT IGNORE INTO `services` (`id`, `name`, `description`, `price`, `duration_minutes`, `active`) VALUES
('s001-uuid-service-corte-cabelo', 'Corte de Cabelo Masculino', 'Corte moderno ou clássico com lavagem e finalização com pomada premium.', 45.00, 35, TRUE),
('s002-uuid-service-barba-completa', 'Barba Terapia Completa', 'Alinhamento na navalha, toalha quente, hidratação de fios e loção pós-barba.', 35.00, 30, TRUE),
('s003-uuid-service-combo-corte-barba', 'Combo Cabelo + Barba', 'Serviço completo de corte e barba com acabamento impecável.', 70.00, 60, TRUE),
('s004-uuid-service-sobrancelha', 'Design de Sobrancelha na Navalha', 'Alinhamento e limpeza facial.', 20.00, 15, TRUE);

INSERT IGNORE INTO `products` (`id`, `name`, `description`, `category`, `price`, `stock`, `active`) VALUES
('p001-uuid-product-pomada-matte', 'Pomada Efeito Matte 100g', 'Alta fixação sem brilho para finalização de penteados.', 'Cabelo', 42.00, 25, TRUE),
('p002-uuid-product-oleo-barba', 'Óleo Hidratante para Barba 30ml', 'Fragrância amadeirada com óleo de argan e jojoba.', 'Barba', 38.50, 18, TRUE),
('p003-uuid-product-shampoo-anticaspa', 'Shampoo Mentolado Refrescante 250ml', 'Limpeza profunda e controle de oleosidade capilar.', 'Cuidado Capilar', 35.00, 14, TRUE),
('p004-uuid-product-balm-pos-barba', 'Balm Pós-Barba Refrescante 120g', 'Acalma a pele e previne irritações pós-lâmina.', 'Barba', 29.90, 20, TRUE);
