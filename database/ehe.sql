CREATE DATABASE IF NOT EXISTS ehe_store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ehe_store;

CREATE TABLE users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  phone VARCHAR(40) NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE categories (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  slug VARCHAR(140) NOT NULL UNIQUE,
  description TEXT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  short_description VARCHAR(255) NULL,
  description TEXT NULL,
  material VARCHAR(120) NULL,
  base_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('draft', 'active', 'archived') NOT NULL DEFAULT 'active',
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE product_images (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  alt_text VARCHAR(180) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE sizes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  label VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE colors (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  hex_code VARCHAR(20) NULL
);

CREATE TABLE product_variants (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT UNSIGNED NOT NULL,
  size_id BIGINT UNSIGNED NOT NULL,
  color_id BIGINT UNSIGNED NOT NULL,
  sku VARCHAR(120) NOT NULL UNIQUE,
  price DECIMAL(12, 2) NOT NULL,
  stock_quantity INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_variants_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_variants_size FOREIGN KEY (size_id) REFERENCES sizes(id),
  CONSTRAINT fk_variants_color FOREIGN KEY (color_id) REFERENCES colors(id)
);

CREATE TABLE carts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  session_id VARCHAR(120) NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE cart_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  cart_id BIGINT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_cart_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id)
);

CREATE TABLE orders (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(40) NOT NULL UNIQUE,
  customer_name VARCHAR(140) NOT NULL,
  customer_phone VARCHAR(40) NOT NULL,
  customer_address VARCHAR(255) NULL,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status ENUM('pending', 'confirmed', 'preparing', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
  whatsapp_message TEXT NULL,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_variant_id BIGINT UNSIGNED NULL,
  product_name VARCHAR(180) NOT NULL,
  size_label VARCHAR(20) NOT NULL,
  color_name VARCHAR(80) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(12, 2) NOT NULL,
  total_price DECIMAL(12, 2) NOT NULL,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_variant FOREIGN KEY (product_variant_id) REFERENCES product_variants(id) ON DELETE SET NULL
);

CREATE TABLE contacts (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  email VARCHAR(160) NULL,
  phone VARCHAR(40) NULL,
  subject VARCHAR(180) NULL,
  message TEXT NOT NULL,
  status ENUM('new', 'read', 'answered') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE testimonials (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(140) NOT NULL,
  rating TINYINT UNSIGNED NOT NULL DEFAULT 5,
  message TEXT NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (name, email, phone, password, role) VALUES
('Administrateur EHE', 'admin@ehe.local', '+22900000000', '$2y$10$replace_with_real_hash', 'admin');

INSERT INTO categories (name, slug, description) VALUES
('Hommes', 'hommes', 'Chaussures artisanales pour hommes'),
('Femmes', 'femmes', 'Chaussures artisanales pour femmes'),
('Enfants', 'enfants', 'Modeles confortables pour enfants'),
('Sandales', 'sandales', 'Sandales en cuir'),
('Mocassins', 'mocassins', 'Mocassins elegants'),
('Chaussures de ville', 'chaussures-de-ville', 'Modeles habilles pour le quotidien'),
('Chaussures de ceremonie', 'chaussures-de-ceremonie', 'Pieces premium pour evenements');

INSERT INTO sizes (label) VALUES
('39'), ('40'), ('41'), ('42'), ('43'), ('44');

INSERT INTO colors (name, hex_code) VALUES
('Noir', '#111827'),
('Marron', '#8D5F3D'),
('Dore', '#D4AF37');

INSERT INTO products (category_id, name, slug, short_description, description, material, base_price, is_featured) VALUES
(5, 'Mocassin Noir Prestige', 'mocassin-noir-prestige', 'Cuir poli et couture main', 'Mocassin elegant pour ville et ceremonie.', 'Cuir', 18000, 1),
(4, 'Sandale Marron Atelier', 'sandale-marron-atelier', 'Sandale artisanale confortable', 'Sandale marron avec brides en cuir et semelle robuste.', 'Cuir', 12000, 1),
(7, 'Derby Cuir Ceremony', 'derby-cuir-ceremony', 'Chaussure habillee premium', 'Derby elegant pour mariage, reunion et reception.', 'Cuir', 22000, 1);

INSERT INTO product_images (product_id, image_path, alt_text, sort_order) VALUES
(1, 'assets/hero-ehe.png', 'Mocassin Noir Prestige', 1),
(2, 'assets/hero-ehe.png', 'Sandale Marron Atelier', 1),
(3, 'assets/hero-ehe.png', 'Derby Cuir Ceremony', 1);

INSERT INTO product_variants (product_id, size_id, color_id, sku, price, stock_quantity) VALUES
(1, 4, 1, 'EHE-MOC-NOI-42', 18000, 12),
(2, 2, 2, 'EHE-SAN-MAR-40', 12000, 18),
(3, 4, 1, 'EHE-DER-NOI-42', 22000, 7);

INSERT INTO testimonials (customer_name, rating, message) VALUES
('Kevin A.', 5, 'La finition est propre et la commande WhatsApp a ete rapide.'),
('Nadia K.', 5, 'Le rendu etait chic et confortable toute la journee.'),
('Serge M.', 5, 'Belle qualite pour le prix.');
