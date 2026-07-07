<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

session_start();

function require_admin_messages(): void
{
    if (!isset($_SESSION['admin_user'])) {
        json_response(['success' => false, 'message' => 'Connexion admin requise.'], 401);
    }
}

try {
    $pdo = pdo();
    ensure_contacts_table($pdo);

    if ($_SERVER['REQUEST_METHOD'] === 'PATCH' || $_SERVER['REQUEST_METHOD'] === 'POST') {
        require_admin_messages();
        verify_csrf();
        $data = request_json();
        $id = (int) ($data['id'] ?? 0);
        $status = clean_string($data['status'] ?? 'read', 20);
        $allowed = ['new', 'read', 'answered'];

        if ($id <= 0 || !in_array($status, $allowed, true)) {
            json_response(['success' => false, 'message' => 'Requete invalide.'], 422);
        }

        $stmt = $pdo->prepare('UPDATE contacts SET status = :status WHERE id = :id');
        $stmt->execute([':status' => $status, ':id' => $id]);
        json_response(['success' => true]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        json_response(['success' => false, 'message' => 'Methode non autorisee.'], 405);
    }

    require_admin_messages();

    $stmt = $pdo->query(
        "SELECT id, name, email, phone, subject, message, status, created_at
         FROM contacts
         ORDER BY created_at DESC, id DESC
         LIMIT 100"
    );
    $messages = $stmt->fetchAll();

    json_response([
        'success' => true,
        'count' => count($messages),
        'messages' => $messages,
    ]);
} catch (Throwable $e) {
    if (APP_DEBUG) {
        json_response(['success' => false, 'message' => 'Impossible de recuperer les messages.', 'error' => $e->getMessage()], 500);
    }

    server_error_response('Impossible de recuperer les messages.');
}
