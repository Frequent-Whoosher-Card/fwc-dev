-- =====================================================
-- FWC (Frequent Whoosher Card) System Database
-- Database Design and DDL Scripts
-- Using UUID for all primary keys
-- =====================================================

-- Create Database
CREATE DATABASE IF NOT EXISTS fwc_system 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE fwc_system;

-- Enable UUID generation function (MySQL 8.0+)
-- For older MySQL versions, use application-level UUID generation

-- =====================================================
-- 1. MASTER TABLES
-- =====================================================

-- Table: roles
-- Note: created_by, updated_by, deleted_by tidak bisa reference ke users karena users dibuat setelah roles
-- Foreign key akan ditambahkan setelah tabel users dibuat
CREATE TABLE IF NOT EXISTS roles (
    role_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    role_code VARCHAR(20) NOT NULL UNIQUE,
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by CHAR(36) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by CHAR(36) NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign keys after users table is created
-- ALTER TABLE roles 
-- ADD CONSTRAINT fk_roles_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
-- ADD CONSTRAINT fk_roles_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
-- ADD CONSTRAINT fk_roles_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL;

CREATE INDEX idx_roles_code ON roles(role_code);

-- Table: card_categories
CREATE TABLE IF NOT EXISTS card_categories (
    category_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    category_code VARCHAR(20) NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by CHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36) NULL,
    CONSTRAINT fk_categories_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_categories_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_categories_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: card_types
CREATE TABLE IF NOT EXISTS card_types (
    type_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    type_code VARCHAR(20) NOT NULL UNIQUE,
    type_name VARCHAR(100) NOT NULL,
    route_description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by CHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36) NULL,
    CONSTRAINT fk_types_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_types_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_types_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: card_products
CREATE TABLE IF NOT EXISTS card_products (
    card_product_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    category_id CHAR(36) NOT NULL,
    type_id CHAR(36) NOT NULL,
    total_quota INT NOT NULL COMMENT 'Total kuota untuk produk ini',
    masa_berlaku INT NOT NULL COMMENT 'Masa berlaku dalam hari',
    price DECIMAL(15,2) NOT NULL COMMENT 'Harga untuk produk ini',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by CHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36) NULL,
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES card_categories(category_id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_type FOREIGN KEY (type_id) REFERENCES card_types(type_id) ON DELETE RESTRICT,
    CONSTRAINT fk_products_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_products_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_products_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_category_type (category_id, type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_products_category ON card_products(category_id);
CREATE INDEX idx_products_type ON card_products(type_id);

-- Table: stations
CREATE TABLE IF NOT EXISTS stations (
    station_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    station_code VARCHAR(20) NOT NULL UNIQUE,
    station_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by CHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36) NULL,
    CONSTRAINT fk_stations_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_stations_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_stations_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: users
CREATE TABLE IF NOT EXISTS users (
    user_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    full_name VARCHAR(255) NOT NULL,
    nip VARCHAR(50) UNIQUE NULL COMMENT 'Nomor Induk Pegawai (opsional)',
    username VARCHAR(100) NOT NULL UNIQUE COMMENT 'Username untuk login',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Password hash untuk autentikasi',
    email VARCHAR(255),
    phone VARCHAR(20),
    role_id CHAR(36) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL COMMENT 'Waktu login terakhir',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by CHAR(36) NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by CHAR(36) NULL,
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36) NULL,
    CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT,
    CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_users_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_nip ON users(nip);
CREATE INDEX idx_username ON users(username);
CREATE INDEX idx_role_id ON users(role_id);

-- Add foreign keys for roles (after users table is created)
ALTER TABLE roles 
ADD CONSTRAINT fk_roles_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_roles_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
ADD CONSTRAINT fk_roles_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL;

-- =====================================================
-- 2. CORE TABLES
-- =====================================================

-- Table: members
CREATE TABLE IF NOT EXISTS members (
    member_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    member_name VARCHAR(255) NOT NULL,
    identity_number VARCHAR(50) NOT NULL UNIQUE,
    nationality VARCHAR(100) NOT NULL DEFAULT 'INDONESIA',
    email VARCHAR(255),
    phone VARCHAR(20),
    nipp_kai VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by CHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36) NULL,
    CONSTRAINT fk_members_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_members_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_members_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_identity_number ON members(identity_number);
CREATE INDEX idx_email ON members(email);
CREATE INDEX idx_phone ON members(phone);
CREATE INDEX idx_members_deleted_at ON members(deleted_at);

-- Table: cards
CREATE TABLE IF NOT EXISTS cards (
    card_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    serial_number VARCHAR(50) NOT NULL UNIQUE,
    member_id CHAR(36) NOT NULL,
    card_product_id CHAR(36) NOT NULL COMMENT 'Reference ke card_products untuk default',
    category_id CHAR(36) NOT NULL COMMENT 'Denormalized untuk query cepat',
    type_id CHAR(36) NOT NULL COMMENT 'Denormalized untuk query cepat',
    quota_ticket INT NOT NULL DEFAULT 0 COMMENT 'Sisa kuota yang masih bisa digunakan',
    total_quota INT NOT NULL COMMENT 'Total kuota awal (copy dari default atau override)',
    fw_price DECIMAL(15,2) NOT NULL COMMENT 'Harga kartu (copy dari default atau override)',
    purchase_date DATE NOT NULL,
    masa_berlaku INT NOT NULL COMMENT 'Masa berlaku dalam hari (copy dari default atau override)',
    expired_date DATE NOT NULL,
    status_card ENUM('Aktif', 'Non Aktif') NOT NULL DEFAULT 'Aktif',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by CHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36) NULL,
    CONSTRAINT fk_cards_member FOREIGN KEY (member_id) REFERENCES members(member_id) ON DELETE RESTRICT,
    CONSTRAINT fk_cards_product FOREIGN KEY (card_product_id) REFERENCES card_products(card_product_id) ON DELETE RESTRICT,
    CONSTRAINT fk_cards_category FOREIGN KEY (category_id) REFERENCES card_categories(category_id) ON DELETE RESTRICT,
    CONSTRAINT fk_cards_type FOREIGN KEY (type_id) REFERENCES card_types(type_id) ON DELETE RESTRICT,
    CONSTRAINT fk_cards_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_cards_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_cards_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_serial_number ON cards(serial_number);
CREATE INDEX idx_member_id ON cards(member_id);
CREATE INDEX idx_card_product_id ON cards(card_product_id);
CREATE INDEX idx_category_id ON cards(category_id);
CREATE INDEX idx_type_id ON cards(type_id);
CREATE INDEX idx_expired_date ON cards(expired_date);
CREATE INDEX idx_status_card ON cards(status_card);
CREATE INDEX idx_cards_deleted_at ON cards(deleted_at);

-- Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    card_id CHAR(36) NOT NULL,
    transaction_number VARCHAR(50) NOT NULL UNIQUE,
    operator_id CHAR(36) NOT NULL,
    station_id CHAR(36) NOT NULL,
    shift_date DATETIME NOT NULL,
    transaction_status ENUM('Success', 'Failed', 'Pending') NOT NULL DEFAULT 'Success',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by CHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by CHAR(36),
    deleted_at TIMESTAMP NULL,
    deleted_by CHAR(36) NULL,
    CONSTRAINT fk_transactions_card FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_operator FOREIGN KEY (operator_id) REFERENCES users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE RESTRICT,
    CONSTRAINT fk_transactions_created_by FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_transactions_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    CONSTRAINT fk_transactions_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_transaction_number ON transactions(transaction_number);
CREATE INDEX idx_card_id ON transactions(card_id);
CREATE INDEX idx_operator_id ON transactions(operator_id);
CREATE INDEX idx_station_id ON transactions(station_id);
CREATE INDEX idx_shift_date ON transactions(shift_date);

-- =====================================================
-- 3. SUPPORTING TABLES
-- =====================================================

-- Table: card_usage_logs
CREATE TABLE IF NOT EXISTS card_usage_logs (
    log_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    card_id CHAR(36) NOT NULL,
    quota_used INT NOT NULL DEFAULT 1,
    remaining_quota INT NOT NULL,
    usage_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NULL COMMENT 'System atau Gate ID yang membuat log',
    CONSTRAINT fk_usage_logs_card FOREIGN KEY (card_id) REFERENCES cards(card_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_card_id ON card_usage_logs(card_id);
CREATE INDEX idx_usage_date ON card_usage_logs(usage_date);

-- Table: card_inventory
CREATE TABLE IF NOT EXISTS card_inventory (
    inventory_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    category_id CHAR(36) NOT NULL,
    type_id CHAR(36) NOT NULL,
    station_id CHAR(36) NULL COMMENT 'NULL untuk inventory global, isi untuk inventory per stasiun',
    card_beredar INT NOT NULL DEFAULT 0,
    card_terjual_aktif INT NOT NULL DEFAULT 0,
    card_terjual_nonaktif INT NOT NULL DEFAULT 0,
    card_belum_terjual INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by CHAR(36) NULL,
    CONSTRAINT fk_inventory_category FOREIGN KEY (category_id) REFERENCES card_categories(category_id) ON DELETE RESTRICT,
    CONSTRAINT fk_inventory_type FOREIGN KEY (type_id) REFERENCES card_types(type_id) ON DELETE RESTRICT,
    CONSTRAINT fk_inventory_station FOREIGN KEY (station_id) REFERENCES stations(station_id) ON DELETE RESTRICT,
    CONSTRAINT fk_inventory_updated_by FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE KEY unique_category_type_station (category_id, type_id, station_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_category_type ON card_inventory(category_id, type_id);
CREATE INDEX idx_inventory_station ON card_inventory(station_id);

-- =====================================================
-- 4. INSERT MASTER DATA
-- =====================================================

-- Insert Roles (harus pertama karena users reference ke roles)
-- Note: UUID akan di-generate otomatis oleh DEFAULT (UUID())
INSERT INTO roles (role_id, role_code, role_name, description, created_by) VALUES
(UUID(), 'SUPERADMIN', 'Super Admin', 'Super administrator dengan akses penuh ke semua fitur sistem', NULL),
(UUID(), 'ADMIN', 'Admin', 'Administrator yang dapat mengelola master data, inventory, dan laporan', NULL),
(UUID(), 'PETUGAS', 'Petugas', 'Petugas yang dapat melakukan transaksi penjualan kartu', NULL)
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

-- Insert Card Categories
-- Note: UUID akan di-generate otomatis oleh DEFAULT (UUID())
INSERT INTO card_categories (category_id, category_code, category_name, description) VALUES
(UUID(), 'Gold', 'Gold', 'Kartu kategori Gold'),
(UUID(), 'Silver', 'Silver', 'Kartu kategori Silver'),
(UUID(), 'KAI', 'KAI', 'Kartu untuk karyawan KAI')
ON DUPLICATE KEY UPDATE category_name = VALUES(category_name);

-- Insert Card Types
-- Note: UUID akan di-generate otomatis oleh DEFAULT (UUID())
INSERT INTO card_types (type_id, type_code, type_name, route_description) VALUES
(UUID(), 'JaBan', 'Jakarta-Bandung', 'Rute Jakarta ke Bandung'),
(UUID(), 'JaKa', 'Jakarta-Karawang', 'Rute Jakarta ke Karawang'),
(UUID(), 'KaBan', 'Karawang-Bandung', 'Rute Karawang ke Bandung')
ON DUPLICATE KEY UPDATE type_name = VALUES(type_name);

-- Insert Card Products (quota, masa_berlaku, dan harga per kombinasi category + type)
-- Note: UUID akan di-generate otomatis oleh DEFAULT (UUID())
-- Format: (category_id, type_id, total_quota, masa_berlaku, price)
INSERT INTO card_products (card_product_id, category_id, type_id, total_quota, masa_berlaku, price) 
SELECT 
    UUID(),
    cat.category_id,
    ct.type_id,
    CASE 
        WHEN cat.category_code = 'Gold' THEN 10
        WHEN cat.category_code = 'Silver' THEN 6
        WHEN cat.category_code = 'KAI' THEN 4
        ELSE 0
    END AS total_quota,
    CASE 
        WHEN cat.category_code = 'Gold' THEN 60
        WHEN cat.category_code = 'Silver' THEN 30
        WHEN cat.category_code = 'KAI' THEN 30
        ELSE 0
    END AS masa_berlaku,
    CASE 
        WHEN cat.category_code = 'Gold' THEN 2000000
        WHEN cat.category_code = 'Silver' THEN 1350000
        WHEN cat.category_code = 'KAI' THEN 700000
        ELSE 0
    END AS price
FROM card_categories cat
CROSS JOIN card_types ct
WHERE cat.deleted_at IS NULL
  AND ct.deleted_at IS NULL
ON DUPLICATE KEY UPDATE 
    total_quota = VALUES(total_quota),
    masa_berlaku = VALUES(masa_berlaku),
    price = VALUES(price);

-- Insert Stations
-- Note: UUID akan di-generate otomatis oleh DEFAULT (UUID())
INSERT INTO stations (station_id, station_code, station_name, location) VALUES
(UUID(), 'Halim', 'Halim', 'Stasiun Halim')
ON DUPLICATE KEY UPDATE station_name = VALUES(station_name);

-- Insert Users (default role = PETUGAS, bisa diubah setelah superadmin dibuat)
-- Note: UUID akan di-generate otomatis oleh DEFAULT (UUID())
-- Note: Untuk user pertama, set role_id ke UUID role SUPERADMIN dan password_hash secara manual
-- Get role_id: SELECT role_id FROM roles WHERE role_code = 'SUPERADMIN';
-- Get PETUGAS role_id: SELECT role_id FROM roles WHERE role_code = 'PETUGAS';
INSERT INTO users (user_id, full_name, nip, username, password_hash, role_id) VALUES
(UUID(), 'Marcelino Kondoy', '499128', 'marcelino.kondoy', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Marriola Steven', '499096', 'marriola.steven', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Alliyah Saffanah Anggraeni Tjahjadi', '499089', 'alliyah.saffanah', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Aridhita Eltia Anggraeni', '499126', 'aridhita.anggraeni', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Deby Wildan Ramdani', '499127', 'deby.ramdani', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Desti Alia Rahma', '499108', 'desti.rahma', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Desvania Tri Crisna', '499109', 'desvania.crisna', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Marlina Sari', '499129', 'marlina.sari', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Siska Utari Agustina', '499215', 'siska.agustina', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Siti Lia Khofipah', '499118', 'siti.khofipah', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Yori Dela Lovenia', '499120', 'yori.lovenia', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Aldo Alfansah', '499193', 'aldo.alfansah', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Axel Dhiaulhaq', '499152', 'axel.dhiaulhaq', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Fajri Hidayat', '499110', 'fajri.hidayat', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Muhammad Haikal', '2401645', 'muhammad.haikal', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Royan Muhammad Firdaus', '2401652', 'royan.firdaus', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Reinaldy Arifin', '2404308', 'reinaldy.arifin', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Liza Ramadhini', NULL, 'liza.ramadhini', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'RAHEL OKTAVALERY', NULL, 'rahel.oktavalery', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'TASYA FADILLAH', NULL, 'tasya.fadillah', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Putri Ana', NULL, 'putri.ana', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Bunga Calista', NULL, 'bunga.calista', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Yayang Salsa Milia', NULL, 'yayang.milia', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Aisya Baheera Handoko', NULL, 'aisya.handoko', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Jilan', NULL, 'jilan', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'REGHYNA SUCI R', NULL, 'reghyna.suci', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1)),
(UUID(), 'Fibriyani Sandiva', NULL, 'fibriyani.sandiva', '', (SELECT role_id FROM roles WHERE role_code = 'PETUGAS' LIMIT 1))
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

-- Note: Set password_hash dan role_id untuk superadmin pertama secara manual
-- UPDATE users SET password_hash = '$2y$10$...', role_id = 1 WHERE username = 'superadmin';

-- Note: Set password_hash dan role_id untuk superadmin pertama secara manual
-- UPDATE users SET password_hash = '$2y$10$...', role_id = 1 WHERE username = 'superadmin';

-- =====================================================
-- 5. VIEWS
-- =====================================================

-- View: vw_card_summary
CREATE OR REPLACE VIEW vw_card_summary AS
SELECT 
    c.card_id,
    c.serial_number,
    m.member_name,
    m.identity_number,
    m.email,
    m.phone,
    cp.card_product_id,
    cat.category_name AS card_category,
    cat.category_code AS card_category_code,
    ct.type_name AS card_type,
    ct.type_code AS card_type_code,
    c.quota_ticket,
    c.total_quota,
    (c.total_quota - c.quota_ticket) AS quota_used,
    cp.total_quota AS product_total_quota,
    cp.masa_berlaku AS product_masa_berlaku,
    cp.price AS product_price,
    c.fw_price,
    c.purchase_date,
    c.expired_date,
    c.masa_berlaku,
    c.status_card,
    DATEDIFF(c.expired_date, CURDATE()) AS days_until_expiry,
    c.created_by,
    c.updated_by,
    c.created_at,
    c.updated_at
FROM cards c
INNER JOIN members m ON c.member_id = m.member_id
INNER JOIN card_products cp ON c.card_product_id = cp.card_product_id
INNER JOIN card_categories cat ON c.category_id = cat.category_id
INNER JOIN card_types ct ON c.type_id = ct.type_id
WHERE c.deleted_at IS NULL
  AND m.deleted_at IS NULL;

-- View: vw_transaction_detail
CREATE OR REPLACE VIEW vw_transaction_detail AS
SELECT 
    t.transaction_id,
    t.transaction_number,
    c.serial_number AS card_serial,
    m.member_name,
    m.identity_number,
    cp.card_product_id,
    cat.category_name AS card_category,
    ct.type_name AS card_type,
    u.full_name AS operator_name,
    u.nip AS operator_nip,
    r.role_name AS operator_role,
    s.station_name,
    s.station_code,
    t.shift_date,
    t.transaction_status,
    t.notes,
    t.created_at AS transaction_created_at,
    t.created_by,
    t.updated_by,
    t.updated_at
FROM transactions t
INNER JOIN cards c ON t.card_id = c.card_id
INNER JOIN members m ON c.member_id = m.member_id
INNER JOIN card_products cp ON c.card_product_id = cp.card_product_id
INNER JOIN card_categories cat ON c.category_id = cat.category_id
INNER JOIN card_types ct ON c.type_id = ct.type_id
INNER JOIN users u ON t.operator_id = u.user_id
INNER JOIN roles r ON u.role_id = r.role_id
INNER JOIN stations s ON t.station_id = s.station_id
WHERE t.deleted_at IS NULL
  AND c.deleted_at IS NULL
  AND m.deleted_at IS NULL;

-- View: vw_users_with_role
CREATE OR REPLACE VIEW vw_users_with_role AS
SELECT 
    u.user_id,
    u.full_name,
    u.nip,
    u.username,
    u.email,
    u.phone,
    r.role_id,
    r.role_code,
    r.role_name,
    r.description AS role_description,
    u.is_active,
    u.last_login,
    u.created_at,
    u.updated_at
FROM users u
INNER JOIN roles r ON u.role_id = r.role_id
WHERE u.deleted_at IS NULL
  AND r.deleted_at IS NULL;

-- View: vw_inventory_summary
CREATE OR REPLACE VIEW vw_inventory_summary AS
SELECT 
    COALESCE(s.station_name, 'GLOBAL') AS location,
    s.station_code,
    cat.category_code,
    cat.category_name,
    ct.type_code,
    ct.type_name,
    inv.card_beredar,
    inv.card_terjual_aktif,
    inv.card_terjual_nonaktif,
    (inv.card_terjual_aktif + inv.card_terjual_nonaktif) AS total_terjual,
    inv.card_belum_terjual,
    inv.last_updated,
    inv.updated_by
FROM card_inventory inv
INNER JOIN card_categories cat ON inv.category_id = cat.category_id
INNER JOIN card_types ct ON inv.type_id = ct.type_id
LEFT JOIN stations s ON inv.station_id = s.station_id;

-- =====================================================
-- 6. STORED PROCEDURES
-- =====================================================

DELIMITER //

-- Procedure: sp_update_card_inventory
-- Update inventory berdasarkan data kartu yang ada
CREATE PROCEDURE sp_update_card_inventory()
BEGIN
    -- Clear existing inventory
    DELETE FROM card_inventory;
    
    -- Insert/Update inventory from cards (global - station_id = NULL)
    INSERT INTO card_inventory (category_id, type_id, station_id, card_beredar, card_terjual_aktif, card_terjual_nonaktif, card_belum_terjual)
    SELECT 
        c.category_id,
        c.type_id,
        NULL AS station_id,
        COUNT(*) AS card_beredar,
        SUM(CASE WHEN c.status_card = 'Aktif' THEN 1 ELSE 0 END) AS card_terjual_aktif,
        SUM(CASE WHEN c.status_card = 'Non Aktif' THEN 1 ELSE 0 END) AS card_terjual_nonaktif,
        0 AS card_belum_terjual
    FROM cards c
    WHERE c.deleted_at IS NULL
    GROUP BY c.category_id, c.type_id
    ON DUPLICATE KEY UPDATE
        card_beredar = VALUES(card_beredar),
        card_terjual_aktif = VALUES(card_terjual_aktif),
        card_terjual_nonaktif = VALUES(card_terjual_nonaktif),
        last_updated = CURRENT_TIMESTAMP;
END //

-- Procedure: sp_get_card_by_serial
-- Get card information by serial number
CREATE PROCEDURE sp_get_card_by_serial(IN p_serial_number VARCHAR(50))
BEGIN
    SELECT 
        c.*,
        m.member_name,
        m.identity_number,
        m.email,
        m.phone,
        cp.total_quota AS product_total_quota,
        cp.masa_berlaku AS product_masa_berlaku,
        cp.price AS product_price,
        cat.category_name,
        ct.type_name
    FROM cards c
    INNER JOIN members m ON c.member_id = m.member_id
    INNER JOIN card_products cp ON c.card_product_id = cp.card_product_id
    INNER JOIN card_categories cat ON c.category_id = cat.category_id
    INNER JOIN card_types ct ON c.type_id = ct.type_id
    WHERE c.serial_number = p_serial_number
      AND c.deleted_at IS NULL;
END //

-- Procedure: sp_get_product_defaults
-- Get default values for a product (category + type)
CREATE PROCEDURE sp_get_product_defaults(
    IN p_category_code VARCHAR(20),
    IN p_type_code VARCHAR(20)
)
BEGIN
    SELECT 
        cp.*,
        cat.category_name,
        cat.category_code,
        ct.type_name,
        ct.type_code
    FROM card_products cp
    INNER JOIN card_categories cat ON cp.category_id = cat.category_id
    INNER JOIN card_types ct ON cp.type_id = ct.type_id
    WHERE cat.category_code = p_category_code
      AND ct.type_code = p_type_code
      AND cp.deleted_at IS NULL
      AND cp.is_active = TRUE
    LIMIT 1;
END //

-- Procedure: sp_create_card_from_product
-- Create card dengan mengambil default dari card_products
CREATE PROCEDURE sp_create_card_from_product(
    IN p_member_id CHAR(36),
    IN p_card_product_id CHAR(36),
    IN p_serial_number VARCHAR(50),
    IN p_purchase_date DATE,
    IN p_created_by CHAR(36)
)
BEGIN
    DECLARE v_total_quota INT;
    DECLARE v_masa_berlaku INT;
    DECLARE v_price DECIMAL(15,2);
    DECLARE v_category_id CHAR(36);
    DECLARE v_type_id CHAR(36);
    DECLARE v_expired_date DATE;
    
    -- Get defaults from product
    SELECT 
        total_quota,
        masa_berlaku,
        price,
        category_id,
        type_id
    INTO 
        v_total_quota,
        v_masa_berlaku,
        v_price,
        v_category_id,
        v_type_id
    FROM card_products
    WHERE card_product_id = p_card_product_id
      AND deleted_at IS NULL
      AND is_active = TRUE;
    
    -- Calculate expired date
    SET v_expired_date = DATE_ADD(p_purchase_date, INTERVAL v_masa_berlaku DAY);
    
    -- Insert card
    INSERT INTO cards (
        member_id,
        card_product_id,
        category_id,
        type_id,
        serial_number,
        quota_ticket,
        total_quota,
        fw_price,
        purchase_date,
        masa_berlaku,
        expired_date,
        status_card,
        created_by
    ) VALUES (
        p_member_id,
        p_card_product_id,
        v_category_id,
        v_type_id,
        p_serial_number,
        v_total_quota,  -- quota_ticket = total_quota saat baru
        v_total_quota,
        v_price,
        p_purchase_date,
        v_masa_berlaku,
        v_expired_date,
        'Aktif',
        p_created_by
    );
    
    SELECT LAST_INSERT_ID() AS card_id;
END //

-- Procedure: sp_update_card_quota
-- Update card quota after usage
CREATE PROCEDURE sp_update_card_quota(
    IN p_card_id CHAR(36),
    IN p_quota_used INT
)
BEGIN
    DECLARE v_current_quota INT;
    DECLARE v_new_quota INT;
    
    -- Get current quota
    SELECT quota_ticket INTO v_current_quota
    FROM cards
    WHERE card_id = p_card_id;
    
    -- Calculate new quota
    SET v_new_quota = v_current_quota - p_quota_used;
    
    -- Validate quota
    IF v_new_quota < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient quota';
    END IF;
    
    -- Update card quota
    UPDATE cards
    SET quota_ticket = v_new_quota
    WHERE card_id = p_card_id;
    
    -- Insert usage log
    INSERT INTO card_usage_logs (card_id, quota_used, remaining_quota, usage_date)
    VALUES (p_card_id, p_quota_used, v_new_quota, NOW());
    
    SELECT v_new_quota AS remaining_quota;
END //

DELIMITER ;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

DELIMITER //

-- Trigger: trg_cards_after_insert
-- Auto-update inventory after card insert
CREATE TRIGGER trg_cards_after_insert
AFTER INSERT ON cards
FOR EACH ROW
BEGIN
    CALL sp_update_card_inventory();
END //

-- Trigger: trg_cards_after_update
-- Auto-update inventory after card update
CREATE TRIGGER trg_cards_after_update
AFTER UPDATE ON cards
FOR EACH ROW
BEGIN
    IF OLD.status_card != NEW.status_card OR OLD.category_id != NEW.category_id OR OLD.type_id != NEW.type_id THEN
        CALL sp_update_card_inventory();
    END IF;
END //

-- Trigger: trg_cards_after_delete
-- Auto-update inventory after card delete
CREATE TRIGGER trg_cards_after_delete
AFTER DELETE ON cards
FOR EACH ROW
BEGIN
    CALL sp_update_card_inventory();
END //

DELIMITER ;

-- =====================================================
-- 8. SAMPLE QUERIES
-- =====================================================

-- Query: Get all active cards expiring in next 30 days
-- SELECT * FROM vw_card_summary 
-- WHERE status_card = 'Aktif' 
-- AND days_until_expiry BETWEEN 0 AND 30
-- ORDER BY expired_date;

-- Query: Get sales summary by user/operator
-- SELECT 
--     u.full_name AS operator_name,
--     COUNT(t.transaction_id) AS total_transactions,
--     SUM(c.fw_price) AS total_revenue
-- FROM transactions t
-- INNER JOIN users u ON t.operator_id = u.user_id
-- INNER JOIN cards c ON t.card_id = c.card_id
-- WHERE t.transaction_status = 'Success'
-- GROUP BY u.user_id, u.full_name
-- ORDER BY total_revenue DESC;

-- Query: Get cards by member
-- SELECT 
--     m.member_name,
--     m.identity_number,
--     COUNT(c.card_id) AS total_cards
-- FROM members m
-- LEFT JOIN cards c ON m.member_id = c.member_id
-- WHERE m.deleted_at IS NULL
-- GROUP BY m.member_id, m.member_name, m.identity_number;

-- Query: Get cards by category and type
-- SELECT 
--     cat.category_name,
--     ct.type_name,
--     COUNT(*) AS total_cards,
--     SUM(CASE WHEN c.status_card = 'Aktif' THEN 1 ELSE 0 END) AS active_cards,
--     SUM(CASE WHEN c.status_card = 'Non Aktif' THEN 1 ELSE 0 END) AS inactive_cards
-- FROM cards c
-- INNER JOIN card_categories cat ON c.category_id = cat.category_id
-- INNER JOIN card_types ct ON c.type_id = ct.type_id
-- GROUP BY cat.category_id, cat.category_name, ct.type_id, ct.type_name;

-- =====================================================
-- END OF SCRIPT
-- =====================================================

