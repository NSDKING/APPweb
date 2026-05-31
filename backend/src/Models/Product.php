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

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO products (name, brand, description, price, sale_price, img_url, category, stock, is_new, is_promo)
             VALUES (:name, :brand, :description, :price, :sale_price, :img_url, :category, :stock, :is_new, :is_promo)'
        );
        $stmt->execute([
            ':name'        => $data['name'],
            ':brand'       => $data['brand']       ?? '',
            ':description' => $data['description'] ?? '',
            ':price'       => $data['price'],
            ':sale_price'  => $data['sale_price']  ?? null,
            ':img_url'     => $data['img_url']      ?? '',
            ':category'    => $data['category']    ?? '',
            ':stock'       => $data['stock']        ?? 0,
            ':is_new'      => isset($data['is_new'])   ? (int)(bool)$data['is_new']   : 0,
            ':is_promo'    => isset($data['is_promo'])  ? (int)(bool)$data['is_promo']  : 0,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $fields = [];
        $params = [];
        $allowed = ['name','brand','description','price','sale_price','img_url','category','stock','is_new','is_promo'];

        foreach ($allowed as $col) {
            if (array_key_exists($col, $data)) {
                $fields[] = "$col = :$col";
                $params[":$col"] = in_array($col, ['is_new','is_promo'])
                    ? (int)(bool)$data[$col]
                    : $data[$col];
            }
        }

        if (!$fields) return false;

        $params[':id'] = $id;
        $stmt = $this->db->prepare('UPDATE products SET ' . implode(', ', $fields) . ' WHERE id = :id');
        return $stmt->execute($params);
    }

    public function delete(int $id): bool
    {
        $stmt = $this->db->prepare('DELETE FROM products WHERE id = ?');
        return $stmt->execute([$id]);
    }
}
