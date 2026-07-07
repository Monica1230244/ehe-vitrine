<?php
declare(strict_types=1);

$externalConfig = dirname(__DIR__, 2) . '/ehe-config.php';
if (is_file($externalConfig)) {
    require $externalConfig;
}

defined('DB_HOST') || define('DB_HOST', '127.0.0.1');
defined('DB_NAME') || define('DB_NAME', 'ehe_store');
defined('DB_USER') || define('DB_USER', 'root');
defined('DB_PASS') || define('DB_PASS', '');
defined('DB_CHARSET') || define('DB_CHARSET', 'utf8mb4');
defined('APP_DEBUG') || define('APP_DEBUG', false);

function json_response(array $payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function server_error_response(string $message = 'Erreur serveur.'): void
{
    json_response(['success' => false, 'message' => $message], 500);
}

function csrf_token(): string
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }

    return (string) $_SESSION['csrf_token'];
}

function verify_csrf(): void
{
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }

    $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $posted = $_POST['csrf_token'] ?? '';
    $token = $header !== '' ? $header : $posted;

    if ($token === '' || empty($_SESSION['csrf_token']) || !hash_equals((string) $_SESSION['csrf_token'], (string) $token)) {
        json_response(['success' => false, 'message' => 'Session expiree. Rechargez la page.'], 419);
    }
}

function pdo(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);

    return $pdo;
}

function ensure_contacts_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS contacts (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(140) NOT NULL,
            email VARCHAR(160) NULL,
            phone VARCHAR(40) NULL,
            subject VARCHAR(180) NULL,
            message TEXT NOT NULL,
            status ENUM('new', 'read', 'answered') NOT NULL DEFAULT 'new',
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
}

function slugify_php(string $value): string
{
    $value = iconv('UTF-8', 'ASCII//TRANSLIT', $value) ?: $value;
    $value = strtolower($value);
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
    $value = trim($value, '-');
    return $value !== '' ? $value : 'item-' . time();
}

function column_exists(PDO $pdo, string $table, string $column): bool
{
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table AND COLUMN_NAME = :column"
    );
    $stmt->execute([':table' => $table, ':column' => $column]);
    return (int) $stmt->fetchColumn() > 0;
}

function ensure_catalog_tables(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS categories (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            slug VARCHAR(140) NOT NULL UNIQUE,
            description TEXT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS products (
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
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );

    if (!column_exists($pdo, 'products', 'stock_quantity')) {
        $pdo->exec("ALTER TABLE products ADD stock_quantity INT NOT NULL DEFAULT 0");
    }
    if (!column_exists($pdo, 'products', 'available_sizes')) {
        $pdo->exec("ALTER TABLE products ADD available_sizes VARCHAR(160) NOT NULL DEFAULT '39,40,41,42,43,44'");
    }
    if (!column_exists($pdo, 'products', 'available_colors')) {
        $pdo->exec("ALTER TABLE products ADD available_colors VARCHAR(160) NOT NULL DEFAULT 'Noir,Marron'");
    }
    if (!column_exists($pdo, 'products', 'availability_status')) {
        $pdo->exec("ALTER TABLE products ADD availability_status ENUM('in_stock', 'made_to_order', 'out_of_stock') NOT NULL DEFAULT 'in_stock'");
    }

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS product_images (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            product_id BIGINT UNSIGNED NOT NULL,
            image_path VARCHAR(255) NOT NULL,
            alt_text VARCHAR(180) NULL,
            sort_order INT NOT NULL DEFAULT 0,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );

    $defaults = ['Hommes', 'Femmes', 'Enfants', 'Sandales', 'Mocassins', 'Chaussures de ville', 'Chaussures de ceremonie'];
    $stmt = $pdo->prepare("INSERT IGNORE INTO categories (name, slug) VALUES (:name, :slug)");
    foreach ($defaults as $name) {
        $stmt->execute([':name' => $name, ':slug' => slugify_php($name)]);
    }

    $count = (int) $pdo->query("SELECT COUNT(*) FROM products")->fetchColumn();
    if ($count === 0) {
        $seed = [
            ['Mocassin Noir Prestige', 'Mocassins', 18000, 12, 'Cuir poli, couture main, silhouette habillee.'],
            ['Sandale Marron Atelier', 'Sandales', 12000, 18, 'Confort leger, brides cuir et semelle robuste.'],
            ['Derby Cuir Ceremony', 'Chaussures de ceremonie', 22000, 7, 'Ligne elegante pour mariage, reunion et reception.'],
        ];
        foreach ($seed as [$name, $category, $price, $stock, $description]) {
            $categoryId = ensure_category($pdo, $category);
            $stmt = $pdo->prepare(
                "INSERT INTO products (category_id, name, slug, short_description, description, base_price, stock_quantity, available_sizes, available_colors, availability_status, status, is_featured)
                 VALUES (:category_id, :name, :slug, :short_description, :description, :base_price, :stock_quantity, '39,40,41,42,43,44', 'Noir,Marron', 'in_stock', 'active', 1)"
            );
            $stmt->execute([
                ':category_id' => $categoryId,
                ':name' => $name,
                ':slug' => slugify_php($name),
                ':short_description' => $description,
                ':description' => $description,
                ':base_price' => $price,
                ':stock_quantity' => $stock,
            ]);
            $productId = (int) $pdo->lastInsertId();
            $img = $pdo->prepare("INSERT INTO product_images (product_id, image_path, alt_text, sort_order) VALUES (:product_id, 'assets/hero-ehe.png', :alt_text, 1)");
            $img->execute([':product_id' => $productId, ':alt_text' => $name]);
        }
    }

    $pdo->exec(
        "UPDATE products
         SET stock_quantity = CASE
             WHEN name = 'Mocassin Noir Prestige' THEN 12
             WHEN name = 'Sandale Marron Atelier' THEN 18
             WHEN name = 'Derby Cuir Ceremony' THEN 7
             ELSE stock_quantity
         END
         WHERE stock_quantity = 0
           AND name IN ('Mocassin Noir Prestige', 'Sandale Marron Atelier', 'Derby Cuir Ceremony')"
    );
}

function ensure_category(PDO $pdo, string $name): int
{
    $name = clean_string($name, 120);
    $slug = slugify_php($name);
    $stmt = $pdo->prepare("SELECT id FROM categories WHERE slug = :slug LIMIT 1");
    $stmt->execute([':slug' => $slug]);
    $id = $stmt->fetchColumn();

    if ($id) {
        return (int) $id;
    }

    $stmt = $pdo->prepare("INSERT INTO categories (name, slug) VALUES (:name, :slug)");
    $stmt->execute([':name' => $name, ':slug' => $slug]);
    return (int) $pdo->lastInsertId();
}

function ensure_order_tables(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS orders (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            order_number VARCHAR(40) NOT NULL UNIQUE,
            customer_name VARCHAR(140) NOT NULL,
            customer_phone VARCHAR(40) NULL,
            customer_address VARCHAR(255) NULL,
            total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
            status ENUM('pending', 'confirmed', 'preparing', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
            whatsapp_message TEXT NULL,
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );

    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS order_items (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            order_id BIGINT UNSIGNED NOT NULL,
            product_variant_id BIGINT UNSIGNED NULL,
            product_name VARCHAR(180) NOT NULL,
            size_label VARCHAR(20) NOT NULL,
            color_name VARCHAR(80) NOT NULL DEFAULT '',
            quantity INT NOT NULL DEFAULT 1,
            unit_price DECIMAL(12, 2) NOT NULL,
            total_price DECIMAL(12, 2) NOT NULL,
            CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
}

function ensure_users_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS users (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(160) NOT NULL UNIQUE,
            phone VARCHAR(40) NULL,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin', 'customer') NOT NULL DEFAULT 'customer',
            created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
}

function ensure_login_attempts_table(PDO $pdo): void
{
    $pdo->exec(
        "CREATE TABLE IF NOT EXISTS login_attempts (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(160) NOT NULL,
            ip_address VARCHAR(64) NOT NULL,
            attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX login_attempt_lookup (email, ip_address, attempted_at)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    );
}

function login_is_limited(PDO $pdo, string $email): bool
{
    ensure_login_attempts_table($pdo);
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $stmt = $pdo->prepare(
        "SELECT COUNT(*) FROM login_attempts
         WHERE email = :email AND ip_address = :ip AND attempted_at > (NOW() - INTERVAL 15 MINUTE)"
    );
    $stmt->execute([':email' => $email, ':ip' => $ip]);
    return (int) $stmt->fetchColumn() >= 5;
}

function record_login_attempt(PDO $pdo, string $email): void
{
    ensure_login_attempts_table($pdo);
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $stmt = $pdo->prepare("INSERT INTO login_attempts (email, ip_address) VALUES (:email, :ip)");
    $stmt->execute([':email' => $email, ':ip' => $ip]);
}

function clear_login_attempts(PDO $pdo, string $email): void
{
    ensure_login_attempts_table($pdo);
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $stmt = $pdo->prepare("DELETE FROM login_attempts WHERE email = :email AND ip_address = :ip");
    $stmt->execute([':email' => $email, ':ip' => $ip]);
}

function ensure_default_admin(PDO $pdo): void
{
    ensure_users_table($pdo);

    $stmt = $pdo->prepare("SELECT id, password FROM users WHERE email = :email AND role = 'admin' LIMIT 1");
    $stmt->execute([':email' => 'admin@ehe.local']);
    $defaultAdmin = $stmt->fetch();

    if ($defaultAdmin && str_contains((string) $defaultAdmin['password'], 'replace_with_real_hash')) {
        $stmt = $pdo->prepare("UPDATE users SET password = :password WHERE id = :id");
        $stmt->execute([
            ':password' => password_hash('admin123', PASSWORD_DEFAULT),
            ':id' => (int) $defaultAdmin['id'],
        ]);
        return;
    }

    if ($defaultAdmin) {
        return;
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    $stmt->execute();

    if ($stmt->fetch()) {
        return;
    }

    $stmt = $pdo->prepare(
        "INSERT INTO users (name, email, password, role) VALUES (:name, :email, :password, 'admin')"
    );
    $stmt->execute([
        ':name' => 'Administrateur EHE',
        ':email' => 'admin@ehe.local',
        ':password' => password_hash('admin123', PASSWORD_DEFAULT),
    ]);
}

function request_json(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '', true);

    if (!is_array($data)) {
        return $_POST;
    }

    return $data;
}

function clean_string(mixed $value, int $limit = 255): string
{
    $text = trim((string) $value);
    $text = preg_replace('/\s+/', ' ', $text) ?? '';
    return mb_substr($text, 0, $limit);
}
