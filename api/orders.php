<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

session_start();

function require_admin_for_orders(): void
{
    if (!isset($_SESSION['admin_user'])) {
        json_response(['success' => false, 'message' => 'Connexion admin requise.'], 401);
    }
}

function list_orders(PDO $pdo): array
{
    $orders = $pdo->query(
        "SELECT id, order_number, customer_name, customer_phone, customer_address,
                total_amount, status, whatsapp_message, created_at
         FROM orders
         ORDER BY created_at DESC, id DESC
         LIMIT 100"
    )->fetchAll();

    $stmt = $pdo->prepare(
        "SELECT product_name, size_label, color_name, quantity, unit_price, total_price
         FROM order_items WHERE order_id = :order_id ORDER BY id"
    );

    foreach ($orders as &$order) {
        $stmt->execute([':order_id' => $order['id']]);
        $order['items'] = $stmt->fetchAll();
    }

    return $orders;
}

try {
    $pdo = pdo();
    ensure_order_tables($pdo);
    $method = $_SERVER['REQUEST_METHOD'];

    if ($method === 'GET') {
        require_admin_for_orders();
        json_response(['success' => true, 'orders' => list_orders($pdo)]);
    }

    if ($method === 'POST') {
        $data = request_json();
        $items = $data['items'] ?? [];
        if (!is_array($items) || count($items) === 0) {
            json_response(['success' => false, 'message' => 'Panier vide.'], 422);
        }

        $total = 0;
        foreach ($items as $item) {
            $total += ((float) ($item['price'] ?? 0)) * ((int) ($item['quantity'] ?? 1));
        }

        $orderNumber = 'EHE-' . date('Ymd-His') . '-' . random_int(100, 999);
        $customerName = clean_string($data['customer_name'] ?? 'Client WhatsApp', 140);
        $customerPhone = clean_string($data['customer_phone'] ?? '', 40);
        $customerAddress = clean_string($data['customer_address'] ?? '', 255);
        $whatsappMessage = (string) ($data['whatsapp_message'] ?? '');

        $pdo->beginTransaction();
        $stmt = $pdo->prepare(
            "INSERT INTO orders (order_number, customer_name, customer_phone, customer_address, total_amount, status, whatsapp_message)
             VALUES (:order_number, :customer_name, :customer_phone, :customer_address, :total_amount, 'pending', :whatsapp_message)"
        );
        $stmt->execute([
            ':order_number' => $orderNumber,
            ':customer_name' => $customerName,
            ':customer_phone' => $customerPhone,
            ':customer_address' => $customerAddress !== '' ? $customerAddress : null,
            ':total_amount' => $total,
            ':whatsapp_message' => $whatsappMessage,
        ]);
        $orderId = (int) $pdo->lastInsertId();

        $itemStmt = $pdo->prepare(
            "INSERT INTO order_items (order_id, product_name, size_label, color_name, quantity, unit_price, total_price)
             VALUES (:order_id, :product_name, :size_label, :color_name, :quantity, :unit_price, :total_price)"
        );
        foreach ($items as $item) {
            $qty = max(1, (int) ($item['quantity'] ?? 1));
            $price = (float) ($item['price'] ?? 0);
            $itemStmt->execute([
                ':order_id' => $orderId,
                ':product_name' => clean_string($item['name'] ?? 'Produit', 180),
                ':size_label' => clean_string($item['size'] ?? '-', 20),
                ':color_name' => clean_string($item['color'] ?? '', 80),
                ':quantity' => $qty,
                ':unit_price' => $price,
                ':total_price' => $price * $qty,
            ]);
        }
        $pdo->commit();

        json_response(['success' => true, 'order_number' => $orderNumber, 'id' => $orderId], 201);
    }

    if ($method === 'PATCH' || $method === 'PUT') {
        require_admin_for_orders();
        verify_csrf();
        $data = request_json();
        $id = (int) ($data['id'] ?? 0);
        $status = clean_string($data['status'] ?? 'confirmed', 20);
        $allowed = ['pending', 'confirmed', 'preparing', 'delivered', 'cancelled'];
        if ($id <= 0 || !in_array($status, $allowed, true)) {
            json_response(['success' => false, 'message' => 'Statut invalide.'], 422);
        }
        $stmt = $pdo->prepare("UPDATE orders SET status = :status WHERE id = :id");
        $stmt->execute([':status' => $status, ':id' => $id]);
        json_response(['success' => true, 'orders' => list_orders($pdo)]);
    }

    json_response(['success' => false, 'message' => 'Methode non autorisee.'], 405);
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    if (APP_DEBUG) {
        json_response(['success' => false, 'message' => 'Erreur commande.', 'error' => $e->getMessage()], 500);
    }

    server_error_response('Erreur commande.');
}
