<?php

namespace App\Models;

use App\Core\Database;

/**
 * Model Order
 * 
 * Gère les opérations CRUD sur la table Orders.
 */
class Order
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Crée une nouvelle commande et retourne son ID.
     *
     * @param array $data {
     *   user_id, total_amount, shipping_address,
     *   payment_status, shipping_status
     * }
     */
    public function create(array $data): int|false
    {
        $sql = "INSERT INTO Orders
                    (user_id, total_amount, shipping_address, payment_status, shipping_status)
                VALUES
                    (:user_id, :total_amount, :shipping_address, :payment_status, :shipping_status)";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':user_id'          => $data['user_id']          ?? null,
            ':total_amount'     => $data['total_amount'],
            ':shipping_address' => $data['shipping_address'],
            ':payment_status'   => $data['payment_status']   ?? 'pending',
            ':shipping_status'  => $data['shipping_status']  ?? 'pending',
        ]);

        $id = (int) $this->db->lastInsertId();
        return $id > 0 ? $id : false;
    }

    /**
     * Retourne toutes les commandes d'un utilisateur, plus récentes en premier.
     */
    public function findByUser(int $userId): array
    {
        $stmt = $this->db->prepare(
            "SELECT * FROM Orders WHERE user_id = :uid ORDER BY created_at DESC"
        );
        $stmt->execute([':uid' => $userId]);
        return $stmt->fetchAll(\PDO::FETCH_ASSOC);
    }

    /**
     * Retourne une commande par son ID.
     */
    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare("SELECT * FROM Orders WHERE id = :id LIMIT 1");
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(\PDO::FETCH_ASSOC);
    }

    /**
     * Met à jour le statut de paiement d'une commande.
     */
    public function updatePaymentStatus(int $orderId, string $status): bool
    {
        $allowed = ['pending', 'paid', 'failed'];
        if (!in_array($status, $allowed, true)) return false;

        $stmt = $this->db->prepare(
            "UPDATE Orders SET payment_status = :status WHERE id = :id"
        );
        return $stmt->execute([':status' => $status, ':id' => $orderId]);
    }

    /**
     * Met à jour le statut de livraison d'une commande.
     */
    public function updateShippingStatus(int $orderId, string $status): bool
    {
        $allowed = ['pending', 'shipped', 'delivered', 'canceled'];
        if (!in_array($status, $allowed, true)) return false;

        $stmt = $this->db->prepare(
            "UPDATE Orders SET shipping_status = :status WHERE id = :id"
        );
        return $stmt->execute([':status' => $status, ':id' => $orderId]);
    }
}
