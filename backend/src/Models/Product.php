<?php
namespace Models;

use Core\Database;

class Product
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function all(array $filters = []): array
    {
        $where  = [];
        $params = [];

        if (!empty($filters['brand'])) {
            $where[]  = 'brand = ?';
            $params[] = $filters['brand'];
        }
        if (!empty($filters['gender'])) {
            $where[]  = 'gender = ?';
            $params[] = $filters['gender'];
        }
        if (!empty($filters['type'])) {
            $where[]  = 'type = ?';
            $params[] = $filters['type'];
        }
        if (!empty($filters['search'])) {
            $where[]  = '(name LIKE ? OR description LIKE ?)';
            $params[] = '%' . $filters['search'] . '%';
            $params[] = '%' . $filters['search'] . '%';
        }

        $sql = 'SELECT * FROM products';
        if ($where) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY created_at DESC';

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM products WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
}
