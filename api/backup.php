<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

session_start();

if (!isset($_SESSION['admin_user'])) {
    json_response(['success' => false, 'message' => 'Connexion admin requise.'], 401);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['success' => false, 'message' => 'Methode non autorisee.'], 405);
}

verify_csrf();

try {
    $pdo = pdo();
    $tables = ['users', 'categories', 'products', 'product_images', 'contacts', 'orders', 'order_items', 'login_attempts'];
    $out = "-- Sauvegarde EHE\n-- Date: " . date('Y-m-d H:i:s') . "\n\nSET FOREIGN_KEY_CHECKS=0;\n\n";

    foreach ($tables as $table) {
        $exists = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = :table");
        $exists->execute([':table' => $table]);
        if ((int) $exists->fetchColumn() === 0) {
            continue;
        }

        $create = $pdo->query("SHOW CREATE TABLE `$table`")->fetch();
        $out .= "DROP TABLE IF EXISTS `$table`;\n";
        $out .= $create['Create Table'] . ";\n\n";

        $rows = $pdo->query("SELECT * FROM `$table`")->fetchAll();
        foreach ($rows as $row) {
            $columns = array_map(fn($column) => "`$column`", array_keys($row));
            $values = array_map(fn($value) => $value === null ? 'NULL' : $pdo->quote((string) $value), array_values($row));
            $out .= "INSERT INTO `$table` (" . implode(', ', $columns) . ") VALUES (" . implode(', ', $values) . ");\n";
        }
        $out .= "\n";
    }

    $out .= "SET FOREIGN_KEY_CHECKS=1;\n";
    $backupDir = dirname(__DIR__) . '/backups';
    if (!is_dir($backupDir)) {
        mkdir($backupDir, 0775, true);
    }
    $htaccess = $backupDir . '/.htaccess';
    if (!is_file($htaccess)) {
        file_put_contents($htaccess, "Require all denied\n");
    }

    $filename = 'ehe_backup_' . date('Ymd_His') . '.sql';
    file_put_contents($backupDir . '/' . $filename, $out);

    json_response(['success' => true, 'message' => 'Sauvegarde creee.', 'file' => 'backups/' . $filename]);
} catch (Throwable $e) {
    if (APP_DEBUG) {
        json_response(['success' => false, 'message' => 'Sauvegarde impossible.', 'error' => $e->getMessage()], 500);
    }

    server_error_response('Sauvegarde impossible.');
}
