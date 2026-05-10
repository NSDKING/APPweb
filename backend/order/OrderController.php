<?php

namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Models\Order;
use App\Models\OrderItem;

/**
 * OrderController
 * 
 * Gère la création et la récupération des commandes.
 * Route POST /api/orders  → createOrder()
 * Route GET  /api/orders  → getUserOrders()
 */
class OrderController
{
    private Order $orderModel;
    private OrderItem $orderItemModel;

    public function __construct()
    {
        $this->orderModel     = new Order();
        $this->orderItemModel = new OrderItem();
    }

    // ──────────────────────────────────────────────────────────
    // POST /api/orders
    // ──────────────────────────────────────────────────────────

    /**
     * Crée une commande + ses lignes de commande à partir des données
     * du formulaire de checkout et du panier envoyé par le frontend.
     *
     * Body JSON attendu :
     * {
     *   "shipping": { "nom": "...", "adresse": "..." },
     *   "payment":  { "carte_last4": "1234", "expiry": "12/27" },
     *   "cart":     [ { "product_id": 1, "quantity": 2, "price": 120.00 }, … ],
     *   "total_amount": 400.00
     * }
     */
    public function createOrder(Request $request, Response $response): void
    {
        // Authentification — $request->user est peuplé par AuthMiddleware
        $user = $request->user ?? null;

        $body = $request->getJson();

        // ── Validation minimale ────────────────────────────────
        $errors = [];

        if (empty($body['shipping']['adresse'])) {
            $errors[] = 'L\'adresse de livraison est requise.';
        }
        if (empty($body['cart']) || !is_array($body['cart'])) {
            $errors[] = 'Le panier est vide ou invalide.';
        }
        if (!isset($body['total_amount']) || $body['total_amount'] <= 0) {
            $errors[] = 'Le montant total est invalide.';
        }

        if (!empty($errors)) {
            $response->json(['message' => implode(' ', $errors)], 422);
            return;
        }

        // ── Nettoyage des données ──────────────────────────────
        $shippingAddress = htmlspecialchars(trim($body['shipping']['adresse']), ENT_QUOTES, 'UTF-8');
        $totalAmount     = round((float) $body['total_amount'], 2);
        $userId          = $user ? (int) $user['id'] : null;

        // ── Création de la commande ────────────────────────────
        try {
            $orderId = $this->orderModel->create([
                'user_id'          => $userId,
                'total_amount'     => $totalAmount,
                'shipping_address' => $shippingAddress,
                'payment_status'   => 'pending',
                'shipping_status'  => 'pending',
            ]);

            if (!$orderId) {
                throw new \RuntimeException('Échec de la création de la commande en base.');
            }

            // ── Insertion des lignes ───────────────────────────
            foreach ($body['cart'] as $item) {
                $productId = (int)   ($item['product_id'] ?? 0);
                $quantity  = max(1, (int) ($item['quantity']  ?? 1));
                $price     = round((float) ($item['price']     ?? 0), 2);

                if ($productId <= 0 || $price <= 0) continue;

                $this->orderItemModel->create([
                    'order_id'   => $orderId,
                    'product_id' => $productId,
                    'quantity'   => $quantity,
                    'price'      => $price,
                ]);
            }

            // ── Réponse succès ─────────────────────────────────
            $response->json([
                'message'  => 'Commande enregistrée avec succès.',
                'order_id' => $orderId,
            ], 201);

        } catch (\Exception $e) {
            error_log('[OrderController] ' . $e->getMessage());
            $response->json(['message' => 'Erreur interne. Veuillez réessayer.'], 500);
        }
    }

    // ──────────────────────────────────────────────────────────
    // GET /api/orders
    // ──────────────────────────────────────────────────────────

    /**
     * Retourne l'historique des commandes de l'utilisateur connecté.
     * Chaque commande inclut ses lignes (produits).
     */
    public function getUserOrders(Request $request, Response $response): void
    {
        $user = $request->user ?? null;

        if (!$user) {
            $response->json(['message' => 'Non authentifié.'], 401);
            return;
        }

        try {
            $orders = $this->orderModel->findByUser((int) $user['id']);

            // Enrichit chaque commande avec ses lignes
            foreach ($orders as &$order) {
                $order['items'] = $this->orderItemModel->findByOrder((int) $order['id']);
            }
            unset($order);

            $response->json(['orders' => $orders]);

        } catch (\Exception $e) {
            error_log('[OrderController] ' . $e->getMessage());
            $response->json(['message' => 'Impossible de récupérer les commandes.'], 500);
        }
    }
}
