<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Methode non autorisee.'], 405);
}

try {
    $pdo = pdo();
    ensure_contacts_table($pdo);
    $data = request_json();

    $name = clean_string($data['name'] ?? '', 140);
    $email = clean_string($data['email'] ?? '', 160);
    $phone = clean_string($data['phone'] ?? '', 40);
    $subject = clean_string($data['subject'] ?? 'Message depuis le site', 180);
    $message = trim((string) ($data['message'] ?? ''));

    if ($name === '' || $message === '') {
        json_response(['success' => false, 'message' => 'Le nom et le message sont obligatoires.'], 422);
    }

    if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['success' => false, 'message' => 'Adresse email invalide.'], 422);
    }

    $stmt = $pdo->prepare(
        'INSERT INTO contacts (name, email, phone, subject, message, status) VALUES (:name, :email, :phone, :subject, :message, :status)'
    );
    $stmt->execute([
        ':name' => $name,
        ':email' => $email !== '' ? $email : null,
        ':phone' => $phone !== '' ? $phone : null,
        ':subject' => $subject !== '' ? $subject : 'Message depuis le site',
        ':message' => mb_substr($message, 0, 5000),
        ':status' => 'new',
    ]);

    json_response([
        'success' => true,
        'message' => 'Message envoye avec succes.',
        'id' => (int) $pdo->lastInsertId(),
    ], 201);
} catch (Throwable $e) {
    if (APP_DEBUG) {
        json_response(['success' => false, 'message' => 'Impossible d enregistrer le message.', 'error' => $e->getMessage()], 500);
    }

    server_error_response('Impossible d enregistrer le message.');
}
