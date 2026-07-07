<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

session_start();

function require_admin(): void
{
    if (!isset($_SESSION['admin_user'])) {
        json_response(['success' => false, 'message' => 'Connexion admin requise.'], 401);
    }
}

function product_payload(PDO $pdo): array
{
    $stmt = $pdo->query(
        "SELECT p.id, p.name, p.slug, p.description, p.short_description, p.base_price AS price,
                p.stock_quantity AS stock, p.availability_status, p.status, p.is_featured, c.name AS category,
                p.available_sizes AS sizes, p.available_colors AS colors,
                COALESCE((SELECT image_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order, id LIMIT 1), 'assets/hero-ehe.png') AS image
         FROM products p
         INNER JOIN categories c ON c.id = p.category_id
         WHERE p.status <> 'archived'
         ORDER BY p.created_at DESC, p.id DESC"
    );

    return $stmt->fetchAll();
}

function find_product(PDO $pdo, int $id, string $slug): ?array
{
    if ($id > 0) {
        $stmt = $pdo->prepare(
            "SELECT p.id, p.name, p.slug, p.description, p.short_description, p.base_price AS price,
                    p.stock_quantity AS stock, p.availability_status, p.status, p.is_featured, c.name AS category,
                    p.available_sizes AS sizes, p.available_colors AS colors,
                    COALESCE((SELECT image_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order, id LIMIT 1), 'assets/hero-ehe.png') AS image
             FROM products p
             INNER JOIN categories c ON c.id = p.category_id
             WHERE p.id = :id AND p.status <> 'archived'
             LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
    } else {
        $stmt = $pdo->prepare(
            "SELECT p.id, p.name, p.slug, p.description, p.short_description, p.base_price AS price,
                    p.stock_quantity AS stock, p.availability_status, p.status, p.is_featured, c.name AS category,
                    p.available_sizes AS sizes, p.available_colors AS colors,
                    COALESCE((SELECT image_path FROM product_images pi WHERE pi.product_id = p.id ORDER BY sort_order, id LIMIT 1), 'assets/hero-ehe.png') AS image
             FROM products p
             INNER JOIN categories c ON c.id = p.category_id
             WHERE p.slug = :slug AND p.status <> 'archived'
             LIMIT 1"
        );
        $stmt->execute([':slug' => $slug]);
    }

    $product = $stmt->fetch();
    return $product ?: null;
}

function save_uploaded_image(string $field): ?string
{
    if (!isset($_FILES[$field]) || $_FILES[$field]['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }

    if ($_FILES[$field]['error'] !== UPLOAD_ERR_OK) {
        json_response(['success' => false, 'message' => 'Upload image impossible.'], 422);
    }

    if ($_FILES[$field]['size'] > 4 * 1024 * 1024) {
        json_response(['success' => false, 'message' => 'Image trop lourde. Maximum 4 Mo.'], 422);
    }

    $tmp = $_FILES[$field]['tmp_name'];
    $info = getimagesize($tmp);
    if (!$info) {
        json_response(['success' => false, 'message' => 'Le fichier choisi n est pas une image valide.'], 422);
    }

    $extensions = [
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG => 'png',
        IMAGETYPE_WEBP => 'webp',
        IMAGETYPE_GIF => 'gif',
    ];
    $type = $info[2];
    if (!isset($extensions[$type])) {
        json_response(['success' => false, 'message' => 'Formats acceptes : JPG, PNG, WEBP, GIF.'], 422);
    }

    $uploadDir = dirname(__DIR__) . '/uploads/products';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0775, true);
    }

    $filename = 'product-' . date('YmdHis') . '-' . bin2hex(random_bytes(4)) . '.' . $extensions[$type];
    $target = $uploadDir . '/' . $filename;
    if (!move_uploaded_file($tmp, $target)) {
        json_response(['success' => false, 'message' => 'Impossible d enregistrer l image.'], 500);
    }

    return 'uploads/products/' . $filename;
}

try {
    $pdo = pdo();
    ensure_catalog_tables($pdo);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        $id = (int) ($_GET['id'] ?? 0);
        $slug = clean_string($_GET['slug'] ?? '', 200);
        if ($id > 0 || $slug !== '') {
            $product = find_product($pdo, $id, $slug);
            if (!$product) {
                json_response(['success' => false, 'message' => 'Produit introuvable.'], 404);
            }
            json_response(['success' => true, 'product' => $product]);
        }
        json_response(['success' => true, 'products' => product_payload($pdo)]);
    }

    require_admin();

    if ($method === 'POST') {
        verify_csrf();
        $id = (int) ($_POST['id'] ?? 0);
        $name = clean_string($_POST['name'] ?? '', 180);
        $category = clean_string($_POST['category'] ?? 'Mocassins', 120);
        $description = trim((string) ($_POST['description'] ?? ''));
        $price = (float) ($_POST['price'] ?? 0);
        $stock = (int) ($_POST['stock'] ?? 0);
        $sizes = clean_string($_POST['sizes'] ?? '39,40,41,42,43,44', 160);
        $colors = clean_string($_POST['colors'] ?? 'Noir,Marron', 160);
        $availabilityStatus = clean_string($_POST['availability_status'] ?? 'in_stock', 30);
        $allowedAvailability = ['in_stock', 'made_to_order', 'out_of_stock'];
        if (!in_array($availabilityStatus, $allowedAvailability, true)) {
            $availabilityStatus = 'in_stock';
        }

        if ($name === '' || $description === '' || $price <= 0) {
            json_response(['success' => false, 'message' => 'Nom, description et prix sont obligatoires.'], 422);
        }

        $categoryId = ensure_category($pdo, $category);
        $imagePath = save_uploaded_image('image');

        if ($id > 0) {
            $stmt = $pdo->prepare(
                "UPDATE products
                 SET category_id = :category_id, name = :name, short_description = :short_description,
                     description = :description, base_price = :price, stock_quantity = :stock,
                     available_sizes = :sizes, available_colors = :colors,
                     availability_status = :availability_status, status = 'active'
                 WHERE id = :id"
            );
            $stmt->execute([
                ':category_id' => $categoryId,
                ':name' => $name,
                ':short_description' => mb_substr($description, 0, 255),
                ':description' => $description,
                ':price' => $price,
                ':stock' => $stock,
                ':sizes' => $sizes,
                ':colors' => $colors,
                ':availability_status' => $availabilityStatus,
                ':id' => $id,
            ]);

            if ($imagePath) {
                $pdo->prepare("DELETE FROM product_images WHERE product_id = :id")->execute([':id' => $id]);
                $stmt = $pdo->prepare("INSERT INTO product_images (product_id, image_path, alt_text, sort_order) VALUES (:product_id, :image_path, :alt_text, 1)");
                $stmt->execute([':product_id' => $id, ':image_path' => $imagePath, ':alt_text' => $name]);
            }
        } else {
            $baseSlug = slugify_php($name);
            $slug = $baseSlug;
            $i = 2;
            while (true) {
                $stmt = $pdo->prepare("SELECT id FROM products WHERE slug = :slug LIMIT 1");
                $stmt->execute([':slug' => $slug]);
                if (!$stmt->fetch()) {
                    break;
                }
                $slug = $baseSlug . '-' . $i++;
            }

            $stmt = $pdo->prepare(
                "INSERT INTO products (category_id, name, slug, short_description, description, base_price, stock_quantity, available_sizes, available_colors, availability_status, status, is_featured)
                 VALUES (:category_id, :name, :slug, :short_description, :description, :price, :stock, :sizes, :colors, :availability_status, 'active', 1)"
            );
            $stmt->execute([
                ':category_id' => $categoryId,
                ':name' => $name,
                ':slug' => $slug,
                ':short_description' => mb_substr($description, 0, 255),
                ':description' => $description,
                ':price' => $price,
                ':stock' => $stock,
                ':sizes' => $sizes,
                ':colors' => $colors,
                ':availability_status' => $availabilityStatus,
            ]);
            $id = (int) $pdo->lastInsertId();
            $stmt = $pdo->prepare("INSERT INTO product_images (product_id, image_path, alt_text, sort_order) VALUES (:product_id, :image_path, :alt_text, 1)");
            $stmt->execute([':product_id' => $id, ':image_path' => $imagePath ?: 'assets/hero-ehe.png', ':alt_text' => $name]);
        }

        json_response(['success' => true, 'products' => product_payload($pdo)]);
    }

    if ($method === 'DELETE') {
        verify_csrf();
        $id = (int) ($_GET['id'] ?? 0);
        if ($id <= 0) {
            json_response(['success' => false, 'message' => 'Produit invalide.'], 422);
        }
        $stmt = $pdo->prepare("UPDATE products SET status = 'archived' WHERE id = :id");
        $stmt->execute([':id' => $id]);
        json_response(['success' => true, 'products' => product_payload($pdo)]);
    }

    json_response(['success' => false, 'message' => 'Methode non autorisee.'], 405);
} catch (Throwable $e) {
    if (APP_DEBUG) {
        json_response(['success' => false, 'message' => 'Erreur catalogue.', 'error' => $e->getMessage()], 500);
    }

    server_error_response('Erreur catalogue.');
}
