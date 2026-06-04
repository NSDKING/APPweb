<?php
namespace Models;

use Core\Database;

class OrderItem
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function create(array $data): int|false
    {
        $stmt = $this->db->prepare(
            'INSERT INTO OrderItems (order_id, product_id, quantity, price)
             VALUES (:order_id, :product_id, :quantity, :price)'
        );
        $stmt->execute([
            ':order_id'   => $data['order_id'],
            ':product_id' => $data['product_id'],
            ':quantity'   => $data['quantity'],
            ':price'      => $data['price'],
        ]);
        $id = (int)$this->db->lastInsertId();
        return $id > 0 ? $id : false;
    }

    public function findByOrder(int $orderId): array
    {
        $stmt = $this->db->prepare(
            'SELECT oi.*, p.name AS product_name, p.img_url, p.brand
             FROM OrderItems oi
             LEFT JOIN Products p ON oi.product_id = p.id
             WHERE oi.order_id = :oid'
        );
        $stmt->execute([':oid' => $orderId]);
        return $stmt->fetchAll();
    }
}
