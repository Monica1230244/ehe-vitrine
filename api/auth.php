<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

session_start();

try {
    $pdo = pdo();
    ensure_default_admin($pdo);
    $action = $_GET['action'] ?? $_POST['action'] ?? '';

    if ($action === 'status') {
        json_response([
            'success' => true,
            'authenticated' => isset($_SESSION['admin_user']),
            'user' => $_SESSION['admin_user'] ?? null,
            'csrfToken' => csrf_token(),
        ]);
    }

    if ($action === 'login') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['success' => false, 'message' => 'Methode non autorisee.'], 405);
        }

        $data = request_json();
        $email = clean_string($data['email'] ?? '', 160);
        $password = (string) ($data['password'] ?? '');

        if ($email === '' || $password === '') {
            json_response(['success' => false, 'message' => 'Email et mot de passe obligatoires.'], 422);
        }

        if (login_is_limited($pdo, $email)) {
            json_response(['success' => false, 'message' => 'Trop de tentatives. Reessayez dans 15 minutes.'], 429);
        }

        $stmt = $pdo->prepare("SELECT id, name, email, password, role FROM users WHERE email = :email AND role = 'admin' LIMIT 1");
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, (string) $user['password'])) {
            record_login_attempt($pdo, $email);
            json_response(['success' => false, 'message' => 'Identifiants incorrects.'], 401);
        }

        clear_login_attempts($pdo, $email);
        session_regenerate_id(true);
        csrf_token();
        $_SESSION['admin_user'] = [
            'id' => (int) $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role'],
        ];

        json_response(['success' => true, 'user' => $_SESSION['admin_user']]);
    }

    if ($action === 'logout') {
        verify_csrf();
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], (bool) $params['secure'], (bool) $params['httponly']);
        }
        session_destroy();
        json_response(['success' => true]);
    }

    if ($action === 'change_password') {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            json_response(['success' => false, 'message' => 'Methode non autorisee.'], 405);
        }

        if (!isset($_SESSION['admin_user'])) {
            json_response(['success' => false, 'message' => 'Connexion requise.'], 401);
        }

        verify_csrf();
        $data = request_json();
        $currentPassword = (string) ($data['current_password'] ?? '');
        $newPassword = (string) ($data['new_password'] ?? '');
        $confirmPassword = (string) ($data['confirm_password'] ?? '');

        if (strlen($newPassword) < 6) {
            json_response(['success' => false, 'message' => 'Le nouveau mot de passe doit contenir au moins 6 caracteres.'], 422);
        }

        if ($newPassword !== $confirmPassword) {
            json_response(['success' => false, 'message' => 'La confirmation ne correspond pas.'], 422);
        }

        $stmt = $pdo->prepare("SELECT id, password FROM users WHERE id = :id AND role = 'admin' LIMIT 1");
        $stmt->execute([':id' => (int) $_SESSION['admin_user']['id']]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($currentPassword, (string) $user['password'])) {
            json_response(['success' => false, 'message' => 'Mot de passe actuel incorrect.'], 401);
        }

        $stmt = $pdo->prepare("UPDATE users SET password = :password WHERE id = :id");
        $stmt->execute([
            ':password' => password_hash($newPassword, PASSWORD_DEFAULT),
            ':id' => (int) $user['id'],
        ]);

        json_response(['success' => true, 'message' => 'Mot de passe modifie.']);
    }

    json_response(['success' => false, 'message' => 'Action inconnue.'], 400);
} catch (Throwable $e) {
    if (APP_DEBUG) {
        json_response(['success' => false, 'message' => 'Erreur serveur.', 'error' => $e->getMessage()], 500);
    }

    server_error_response();
}
