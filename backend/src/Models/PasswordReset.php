<?php
namespace Models;

use Core\Database;

class PasswordReset
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create(string $email): string
    {
        // Remove old tokens for this email
        $stmt = $this->db->prepare('DELETE FROM password_resets WHERE email = ?');
        $stmt->execute([$email]);

        $token     = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + 3600); // 1 hour

        $stmt = $this->db->prepare(
            'INSERT INTO password_resets (email, token, expires_at) VALUES (?, ?, ?)'
        );
        $stmt->execute([$email, $token, $expiresAt]);

        return $token;
    }

    public function findValid(string $token): array|false
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM password_resets
             WHERE token = ? AND used = 0 AND expires_at > NOW()'
        );
        $stmt->execute([$token]);
        return $stmt->fetch();
    }

    public function markUsed(string $token): void
    {
        $stmt = $this->db->prepare('UPDATE password_resets SET used = 1 WHERE token = ?');
        $stmt->execute([$token]);
    }
}
