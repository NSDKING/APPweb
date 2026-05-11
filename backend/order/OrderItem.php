<?php

namespace App\Models;

use App\Core\Database;

/**
 * Model OrderItem
 * 
 * Gère les lignes de commande (table OrderItems).
 */
class OrderItem
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Insère une ligne de commande.
     *
     * @param array $data { order_id, product_id, quantity, price }
     */
    public function create(array $data): int|false
    {
        $stmt = $this->db->prepare(
            "INSERT INTO OrderItems (order_id, product_id, quantity, price)
             VALUES (:order_id, :product_id, :quantity, :price)"
        );
        $stmt->execute([
            ':order_id'   => $data['order_id'],
            ':product_id' => $data['product_id'],
            ':quantity'   => $data['quantity'],
            ':price'      => $data['price'],
        ]);

        $id = (int) $this->db->lastInsertId();
        return $id > 0 ? $id : false;
    }

    /**
     * Retourne toutes les lignes d'une commande, avec les infos produit.
     */
    public function findByOrder(int $orderId): array
    {
        $stmt = $this->db->prepare(
            "SELECT oi.*, p.name AS product_name, p.img_url
             FROM OrderItems oi
             LEFT JOIN Products p ON p.id = oi.product_id
             WHERE oi.order_id = :oid"
        );
        $stmt->execute([':oid' => $orderId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }
}
