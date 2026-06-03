<?php
namespace Models;

use Core\Database;

class PromoCode
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByCode(string $code): array|false
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM PromoCodes WHERE code = ? AND is_active = 1 LIMIT 1'
        );
        $stmt->execute([strtoupper(trim($code))]);
        return $stmt->fetch();
    }

    public function all(): array
    {
        return $this->db->query('SELECT * FROM PromoCodes ORDER BY created_at DESC')->fetchAll();
    }

    public function create(array $data): int|false
    {
        $stmt = $this->db->prepare(
            'INSERT INTO PromoCodes (code, discount_type, discount_value, min_order_amount, max_uses, expires_at)
             VALUES (:code, :discount_type, :discount_value, :min_order_amount, :max_uses, :expires_at)'
        );
        $stmt->execute([
            ':code'             => strtoupper(trim($data['code'])),
            ':discount_type'    => $data['discount_type']    ?? 'percentage',
            ':discount_value'   => $data['discount_value'],
            ':min_order_amount' => $data['min_order_amount'] ?? 0,
            ':max_uses'         => $data['max_uses']         ?? null,
            ':expires_at'       => $data['expires_at']       ?? null,
        ]);
        $id = (int)$this->db->lastInsertId();
        return $id > 0 ? $id : false;
    }

    public function incrementUsage(int $id): void
    {
        $this->db->prepare('UPDATE PromoCodes SET used_count = used_count + 1 WHERE id = ?')
                 ->execute([$id]);
    }

    public function delete(int $id): bool
    {
        return $this->db->prepare('DELETE FROM PromoCodes WHERE id = ?')->execute([$id]);
    }

    public function toggle(int $id): bool
    {
        return $this->db->prepare(
            'UPDATE PromoCodes SET is_active = NOT is_active WHERE id = ?'
        )->execute([$id]);
    }
}
