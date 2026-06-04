<?php
namespace Models;

use Core\Database;

class Order
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create(array $data): int|false
    {
        $stmt = $this->db->prepare(
            'INSERT INTO Orders (user_id, total_amount, shipping_address, payment_status, shipping_status)
             VALUES (:user_id, :total_amount, :shipping_address, :payment_status, :shipping_status)'
        );
        $stmt->execute([
            ':user_id'          => $data['user_id']          ?? null,
            ':total_amount'     => $data['total_amount'],
            ':shipping_address' => $data['shipping_address'],
            ':payment_status'   => $data['payment_status']   ?? 'pending',
            ':shipping_status'  => $data['shipping_status']  ?? 'pending',
        ]);
        $id = (int)$this->db->lastInsertId();
        return $id > 0 ? $id : false;
    }

    public function findByUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM Orders WHERE user_id = :uid ORDER BY created_at DESC'
        );
        $stmt->execute([':uid' => $userId]);
        return $stmt->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare('SELECT * FROM Orders WHERE id = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    public function updateShippingStatus(int $orderId, string $status): bool
    {
        $allowed = ['pending', 'shipped', 'delivered', 'canceled'];
        if (!in_array($status, $allowed, true)) return false;
        $stmt = $this->db->prepare('UPDATE Orders SET shipping_status = :s WHERE id = :id');
        return $stmt->execute([':s' => $status, ':id' => $orderId]);
    }

    public function updatePaymentStatus(int $orderId, string $status): bool
    {
        $allowed = ['pending', 'paid', 'failed'];
        if (!in_array($status, $allowed, true)) return false;
        $stmt = $this->db->prepare('UPDATE Orders SET payment_status = :s WHERE id = :id');
        return $stmt->execute([':s' => $status, ':id' => $orderId]);
    }

    public function all(): array
    {
        $stmt = $this->db->query(
            'SELECT o.*, u.name AS user_name, u.email AS user_email
             FROM Orders o LEFT JOIN Users u ON o.user_id = u.id
             ORDER BY o.created_at DESC'
        );
        return $stmt->fetchAll();
    }
}
