<?php
namespace Models;

use Core\Database;

class Review
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function findByProduct(int $productId): array
    {
        $stmt = $this->db->prepare(
            'SELECT r.id, r.rating, r.comment, r.created_at, u.name AS user_name
             FROM ProductReviews r
             JOIN Users u ON r.user_id = u.id
             WHERE r.product_id = ?
             ORDER BY r.created_at DESC'
        );
        $stmt->execute([$productId]);
        return $stmt->fetchAll();
    }

    public function averageRating(int $productId): float
    {
        $stmt = $this->db->prepare(
            'SELECT AVG(rating) AS avg FROM ProductReviews WHERE product_id = ?'
        );
        $stmt->execute([$productId]);
        $row = $stmt->fetch();
        return round((float)($row['avg'] ?? 0), 1);
    }

    public function userReview(int $productId, int $userId): array|false
    {
        $stmt = $this->db->prepare(
            'SELECT * FROM ProductReviews WHERE product_id = ? AND user_id = ? LIMIT 1'
        );
        $stmt->execute([$productId, $userId]);
        return $stmt->fetch();
    }

    public function create(array $data): int|false
    {
        $stmt = $this->db->prepare(
            'INSERT INTO ProductReviews (product_id, user_id, rating, comment)
             VALUES (:product_id, :user_id, :rating, :comment)'
        );
        $stmt->execute([
            ':product_id' => $data['product_id'],
            ':user_id'    => $data['user_id'],
            ':rating'     => $data['rating'],
            ':comment'    => $data['comment'] ?? null,
        ]);
        $id = (int)$this->db->lastInsertId();
        return $id > 0 ? $id : false;
    }

    public function update(int $id, int $userId, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE ProductReviews SET rating = :rating, comment = :comment
             WHERE id = :id AND user_id = :user_id'
        );
        return $stmt->execute([
            ':rating'  => $data['rating'],
            ':comment' => $data['comment'] ?? null,
            ':id'      => $id,
            ':user_id' => $userId,
        ]);
    }

    public function delete(int $id, int $userId): bool
    {
        $stmt = $this->db->prepare(
            'DELETE FROM ProductReviews WHERE id = ? AND user_id = ?'
        );
        return $stmt->execute([$id, $userId]);
    }
}
