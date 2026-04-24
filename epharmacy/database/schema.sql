-- ============================================================
-- E-PHARMACY DATABASE SCHEMA
-- ============================================================

CREATE DATABASE IF NOT EXISTS epharmacy;
USE epharmacy;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(100)        NOT NULL,
  email         VARCHAR(150)        NOT NULL UNIQUE,
  password_hash VARCHAR(255)        NOT NULL,
  phone         VARCHAR(15),
  address       TEXT,
  role          ENUM('user','admin') NOT NULL DEFAULT 'user',
  is_active     TINYINT(1)          NOT NULL DEFAULT 1,
  created_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role  (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: retailers
-- ============================================================
CREATE TABLE retailers (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(150)        NOT NULL,
  email         VARCHAR(150)        NOT NULL UNIQUE,
  password_hash VARCHAR(255)        NOT NULL,
  phone         VARCHAR(15),
  store_name    VARCHAR(200)        NOT NULL,
  store_address TEXT,
  license_no    VARCHAR(100)        UNIQUE,
  is_approved   TINYINT(1)          NOT NULL DEFAULT 0,
  is_active     TINYINT(1)          NOT NULL DEFAULT 1,
  created_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email       (email),
  INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: medicines
-- ============================================================
CREATE TABLE medicines (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  retailer_id      INT UNSIGNED        NOT NULL,
  name             VARCHAR(200)        NOT NULL,
  salt_composition VARCHAR(500)        NOT NULL,
  manufacturer     VARCHAR(200)        NOT NULL,
  category         VARCHAR(100),
  description      TEXT,
  price            DECIMAL(10,2)       NOT NULL CHECK (price >= 0),
  mrp              DECIMAL(10,2)       NOT NULL CHECK (mrp >= 0),
  stock_qty        INT UNSIGNED        NOT NULL DEFAULT 0,
  unit             VARCHAR(20)         NOT NULL DEFAULT 'strip',
  requires_rx      TINYINT(1)          NOT NULL DEFAULT 0,
  image_url        VARCHAR(500),
  is_active        TINYINT(1)          NOT NULL DEFAULT 1,
  created_at       DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_med_retailer FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE CASCADE,
  INDEX idx_name             (name),
  INDEX idx_salt             (salt_composition(100)),
  INDEX idx_retailer         (retailer_id),
  INDEX idx_category         (category),
  FULLTEXT ft_name_salt      (name, salt_composition)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: medicine_alternatives
-- (self-referential: medicines sharing same salt)
-- ============================================================
CREATE TABLE medicine_alternatives (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  medicine_id    INT UNSIGNED NOT NULL,
  alt_medicine_id INT UNSIGNED NOT NULL,
  CONSTRAINT fk_alt_medicine  FOREIGN KEY (medicine_id)     REFERENCES medicines(id) ON DELETE CASCADE,
  CONSTRAINT fk_alt_target    FOREIGN KEY (alt_medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  UNIQUE KEY uq_pair (medicine_id, alt_medicine_id),
  INDEX idx_medicine    (medicine_id),
  INDEX idx_alt_medicine (alt_medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: prescriptions
-- ============================================================
CREATE TABLE prescriptions (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED        NOT NULL,
  file_url    VARCHAR(500)        NOT NULL,
  file_name   VARCHAR(255),
  status      ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  notes       TEXT,
  uploaded_at DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME,
  CONSTRAINT fk_presc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status  (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE orders (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED        NOT NULL,
  prescription_id INT UNSIGNED,
  status          ENUM('pending','confirmed','packed','shipped','delivered','cancelled')
                                      NOT NULL DEFAULT 'pending',
  total_amount    DECIMAL(10,2)       NOT NULL CHECK (total_amount >= 0),
  delivery_address TEXT               NOT NULL,
  payment_method  ENUM('cod','online') NOT NULL DEFAULT 'cod',
  payment_status  ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  notes           TEXT,
  placed_at       DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME            NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE RESTRICT,
  CONSTRAINT fk_order_presc FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status  (status),
  INDEX idx_placed  (placed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE order_items (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    INT UNSIGNED        NOT NULL,
  medicine_id INT UNSIGNED        NOT NULL,
  retailer_id INT UNSIGNED        NOT NULL,
  quantity    INT UNSIGNED        NOT NULL CHECK (quantity > 0),
  unit_price  DECIMAL(10,2)       NOT NULL CHECK (unit_price >= 0),
  subtotal    DECIMAL(10,2)       GENERATED ALWAYS AS (quantity * unit_price) STORED,
  CONSTRAINT fk_item_order    FOREIGN KEY (order_id)    REFERENCES orders(id)    ON DELETE CASCADE,
  CONSTRAINT fk_item_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE RESTRICT,
  CONSTRAINT fk_item_retailer FOREIGN KEY (retailer_id) REFERENCES retailers(id) ON DELETE RESTRICT,
  INDEX idx_order_id    (order_id),
  INDEX idx_medicine_id (medicine_id),
  INDEX idx_retailer_id (retailer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- TABLE: cart (persisted cart)
-- ============================================================
CREATE TABLE cart (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  medicine_id INT UNSIGNED NOT NULL,
  quantity    INT UNSIGNED NOT NULL DEFAULT 1 CHECK (quantity > 0),
  added_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  CONSTRAINT fk_cart_medicine FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_medicine (user_id, medicine_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- SAMPLE DATA
-- ============================================================

-- Admin user  (password: Admin@123)
INSERT INTO users (name, email, password_hash, phone, role) VALUES
('Super Admin', 'admin@epharmacy.com',
 '$2b$10$wQxGK1gOQ2T5Z5m4Y8K7NeHlL3pR9uV6cD0sJ1kN4mO8bP2tS7aXi', '9999999999', 'admin');

-- Retailers  (password: Retail@123)
INSERT INTO retailers (name, email, password_hash, phone, store_name, store_address, license_no, is_approved) VALUES
('Rajesh Sharma',   'rajesh@medplus.com',    '$2b$10$wQxGK1gOQ2T5Z5m4Y8K7NeHlL3pR9uV6cD0sJ1kN4mO8bP2tS7aXi', '9876543210', 'MedPlus Pharmacy',    'Connaught Place, New Delhi', 'DL-MED-001', 1),
('Priya Nair',      'priya@healthkart.com',  '$2b$10$wQxGK1gOQ2T5Z5m4Y8K7NeHlL3pR9uV6cD0sJ1kN4mO8bP2tS7aXi', '9876543211', 'HealthKart Pharmacy', 'Koramangala, Bangalore',     'KA-MED-002', 1),
('Amit Patel',      'amit@remedies.com',     '$2b$10$wQxGK1gOQ2T5Z5m4Y8K7NeHlL3pR9uV6cD0sJ1kN4mO8bP2tS7aXi', '9876543212', 'Remedies Store',      'Andheri West, Mumbai',       'MH-MED-003', 1);

-- Regular users  (password: User@123)
INSERT INTO users (name, email, password_hash, phone, address) VALUES
('Aman Verma',  'aman@gmail.com',   '$2b$10$5K3gOQ2T5Z5m4Y8K7NeHlL3pR9uV6cD0sJ1kN4mO8bP2tS7aXiWQx', '9123456789', 'Sector 21, Noida'),
('Sneha Gupta', 'sneha@gmail.com',  '$2b$10$5K3gOQ2T5Z5m4Y8K7NeHlL3pR9uV6cD0sJ1kN4mO8bP2tS7aXiWQx', '9234567890', 'Whitefield, Bangalore'),
('Karan Singh', 'karan@gmail.com',  '$2b$10$5K3gOQ2T5Z5m4Y8K7NeHlL3pR9uV6cD0sJ1kN4mO8bP2tS7aXiWQx', '9345678901', 'Bandra, Mumbai');

-- Medicines for retailer 1
INSERT INTO medicines (retailer_id, name, salt_composition, manufacturer, category, price, mrp, stock_qty, requires_rx) VALUES
(1, 'Paracetamol 500mg',    'Paracetamol 500mg',                  'Cipla',         'Analgesic',      12.50,  15.00, 200, 0),
(1, 'Dolo 650',             'Paracetamol 650mg',                  'Micro Labs',     'Analgesic',      30.00,  35.00, 150, 0),
(1, 'Calpol 500',           'Paracetamol 500mg',                  'GSK',            'Analgesic',      14.00,  17.00, 180, 0),
(1, 'Azithromycin 500mg',   'Azithromycin 500mg',                 'Sun Pharma',     'Antibiotic',     85.00, 100.00,  80, 1),
(1, 'Azee 500',             'Azithromycin 500mg',                 'Cipla',          'Antibiotic',     78.00,  95.00,  60, 1),
(1, 'Metformin 500mg',      'Metformin Hydrochloride 500mg',      'USV',            'Antidiabetic',   18.00,  22.00, 120, 1),
(1, 'Glycomet 500',         'Metformin Hydrochloride 500mg',      'USV',            'Antidiabetic',   20.00,  25.00, 100, 1),
(1, 'Pantoprazole 40mg',    'Pantoprazole Sodium 40mg',           'Alkem',          'Antacid',        35.00,  42.00,  90, 0),
(1, 'Pan 40',               'Pantoprazole Sodium 40mg',           'Alkem',          'Antacid',        38.00,  45.00,  70, 0),
(1, 'Vitamin D3 60000IU',   'Cholecalciferol 60000 IU',           'Mankind',        'Vitamin',        55.00,  65.00, 200, 0);

-- Medicines for retailer 2
INSERT INTO medicines (retailer_id, name, salt_composition, manufacturer, category, price, mrp, stock_qty, requires_rx) VALUES
(2, 'Cetirizine 10mg',      'Cetirizine Hydrochloride 10mg',      'Cipla',          'Antiallergic',   8.00,  10.00, 300, 0),
(2, 'Cetzine',              'Cetirizine Hydrochloride 10mg',      'Dr Reddys',      'Antiallergic',   9.50,  12.00, 250, 0),
(2, 'Amoxicillin 500mg',    'Amoxicillin 500mg',                  'GSK',            'Antibiotic',     65.00,  80.00,  50, 1),
(2, 'Mox 500',              'Amoxicillin 500mg',                  'Ranbaxy',        'Antibiotic',     55.00,  70.00,  75, 1),
(2, 'Atorvastatin 10mg',    'Atorvastatin Calcium 10mg',          'Sun Pharma',     'Antilipemic',    45.00,  55.00, 110, 1),
(2, 'Lipitor 10mg',         'Atorvastatin Calcium 10mg',          'Pfizer',         'Antilipemic',    85.00, 100.00,  40, 1),
(2, 'Omeprazole 20mg',      'Omeprazole 20mg',                    'Cipla',          'Antacid',        18.00,  22.00, 160, 0),
(2, 'Omez',                 'Omeprazole 20mg',                    'Dr Reddys',      'Antacid',        22.00,  28.00, 120, 0),
(2, 'Montelukast 10mg',     'Montelukast Sodium 10mg',            'Cipla',          'Antiasthmatic',  55.00,  65.00,  80, 1),
(2, 'Singulair 10mg',       'Montelukast Sodium 10mg',            'MSD',            'Antiasthmatic', 140.00, 160.00,  30, 1);

-- Medicines for retailer 3
INSERT INTO medicines (retailer_id, name, salt_composition, manufacturer, category, price, mrp, stock_qty, requires_rx) VALUES
(3, 'Ibuprofen 400mg',      'Ibuprofen 400mg',                    'Abbott',         'Analgesic',      22.00,  28.00, 180, 0),
(3, 'Brufen 400',           'Ibuprofen 400mg',                    'Abbott',         'Analgesic',      25.00,  30.00, 140, 0),
(3, 'Losartan 50mg',        'Losartan Potassium 50mg',            'Cipla',          'Antihypertensive',38.00, 45.00, 100, 1),
(3, 'Losar 50',             'Losartan Potassium 50mg',            'Sun Pharma',     'Antihypertensive',35.00, 42.00,  90, 1),
(3, 'Amlodipine 5mg',       'Amlodipine Besylate 5mg',            'Pfizer',         'Antihypertensive',12.00, 15.00, 200, 1),
(3, 'Amlong 5',             'Amlodipine Besylate 5mg',            'Micro Labs',     'Antihypertensive',10.00, 13.00, 220, 1),
(3, 'Multivitamin',         'Vitamin A,C,D,E,B-Complex,Zinc',     'Himalaya',       'Vitamin',        120.00,145.00, 300, 0),
(3, 'Pregabalin 75mg',      'Pregabalin 75mg',                    'Sun Pharma',     'Neuropathic',    95.00, 115.00,  60, 1),
(3, 'Lyrica 75mg',          'Pregabalin 75mg',                    'Pfizer',         'Neuropathic',   210.00, 250.00,  25, 1),
(3, 'Ranitidine 150mg',     'Ranitidine Hydrochloride 150mg',     'GSK',            'Antacid',        14.00,  18.00, 170, 0);

-- medicine_alternatives (same salt groups)
-- Paracetamol 500mg group: medicines 1 and 3
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (1, 3), (3, 1);
-- Azithromycin 500mg group: medicines 4 and 5
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (4, 5), (5, 4);
-- Metformin group: medicines 6 and 7
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (6, 7), (7, 6);
-- Pantoprazole group: medicines 8 and 9
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (8, 9), (9, 8);
-- Cetirizine group: medicines 11 and 12
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (11, 12), (12, 11);
-- Amoxicillin group: medicines 13 and 14
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (13, 14), (14, 13);
-- Atorvastatin group: medicines 15 and 16
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (15, 16), (16, 15);
-- Omeprazole group: medicines 17 and 18
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (17, 18), (18, 17);
-- Montelukast group: medicines 19 and 20
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (19, 20), (20, 19);
-- Ibuprofen group: medicines 21 and 22
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (21, 22), (22, 21);
-- Losartan group: medicines 23 and 24
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (23, 24), (24, 23);
-- Amlodipine group: medicines 25 and 26
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (25, 26), (26, 25);
-- Pregabalin group: medicines 28 and 29
INSERT INTO medicine_alternatives (medicine_id, alt_medicine_id) VALUES (28, 29), (29, 28);

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_medicine_detail AS
SELECT
  m.id,
  m.name,
  m.salt_composition,
  m.manufacturer,
  m.category,
  m.price,
  m.mrp,
  m.stock_qty,
  m.unit,
  m.requires_rx,
  m.image_url,
  m.is_active,
  r.store_name,
  r.id AS retailer_id
FROM medicines m
JOIN retailers r ON r.id = m.retailer_id
WHERE m.is_active = 1 AND r.is_active = 1 AND r.is_approved = 1;

CREATE OR REPLACE VIEW v_order_summary AS
SELECT
  o.id AS order_id,
  o.status,
  o.total_amount,
  o.payment_method,
  o.payment_status,
  o.placed_at,
  u.name  AS user_name,
  u.email AS user_email,
  COUNT(oi.id) AS item_count
FROM orders o
JOIN users      u  ON u.id  = o.user_id
JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id;
