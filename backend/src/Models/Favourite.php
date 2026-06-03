<?php
namespace Models;

use Core\Database;

class Favourite
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function getByUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT p.id, p.name, p.brand, p.price, p.sale_price, p.img_url
             FROM favourites f
             JOIN products p ON f.product_id = p.id
             WHERE f.user_id = ?
             ORDER BY f.created_at DESC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function getProductIds(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT product_id FROM favourites WHERE user_id = ?'
        );
        $stmt->execute([$userId]);
        return array_column($stmt->fetchAll(), 'product_id');
    }

    public function add(int $userId, int $productId): void
    {
        $stmt = $this->db->prepare(
            'INSERT IGNORE INTO favourites (user_id, product_id) VALUES (?, ?)'
        );
        $stmt->execute([$userId, $productId]);
    }

    public function remove(int $userId, int $productId): void
    {
        $stmt = $this->db->prepare(
            'DELETE FROM favourites WHERE user_id = ? AND product_id = ?'
        );
        $stmt->execute([$userId, $productId]);
    }
}
