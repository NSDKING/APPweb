<?php
namespace Controllers;

use Core\JWT;
use Core\Request;
use Core\Response;
use Models\Order;
use Models\OrderItem;

class OrderController
{
    private Order $orderModel;
    private OrderItem $orderItemModel;

    public function __construct()
    {
        $this->orderModel     = new Order();
        $this->orderItemModel = new OrderItem();
    }

    private function auth(Request $request): ?array
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        return JWT::decode($token) ?: null;
    }

    // POST /api/orders
    public function store(Request $request): void
    {
        $payload = $this->auth($request);
        $body    = $request->json();

        $errors = [];
        if (empty($body['shipping']['adresse'])) $errors[] = 'L\'adresse de livraison est requise.';
        if (empty($body['cart']) || !is_array($body['cart'])) $errors[] = 'Le panier est vide.';
        if (empty($body['total_amount']) || $body['total_amount'] <= 0) $errors[] = 'Montant invalide.';

        if ($errors) { Response::error(implode(' ', $errors), 422); return; }

        $shippingAddress = htmlspecialchars(trim($body['shipping']['adresse']), ENT_QUOTES, 'UTF-8');
        $totalAmount     = round((float)$body['total_amount'], 2);
        $userId          = $payload ? (int)$payload['user_id'] : null;

        try {
            $orderId = $this->orderModel->create([
                'user_id'          => $userId,
                'total_amount'     => $totalAmount,
                'shipping_address' => $shippingAddress,
                'payment_status'   => 'pending',
                'shipping_status'  => 'pending',
            ]);

            if (!$orderId) throw new \RuntimeException('Échec création commande.');

            foreach ($body['cart'] as $item) {
                $productId = (int)($item['product_id'] ?? 0);
                $quantity  = max(1, (int)($item['quantity'] ?? 1));
                $price     = round((float)($item['price'] ?? 0), 2);
                if ($productId <= 0 || $price <= 0) continue;
                $this->orderItemModel->create([
                    'order_id'   => $orderId,
                    'product_id' => $productId,
                    'quantity'   => $quantity,
                    'price'      => $price,
                ]);
            }

            Response::success(['order_id' => $orderId], 'Commande enregistrée.', 201);
        } catch (\Exception $e) {
            error_log('[OrderController] ' . $e->getMessage());
            Response::error('Erreur interne.', 500);
        }
    }

    // GET /api/orders
    public function index(Request $request): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        try {
            $orders = $this->orderModel->findByUser((int)$payload['user_id']);
            foreach ($orders as &$order) {
                $order['items'] = $this->orderItemModel->findByOrder((int)$order['id']);
            }
            unset($order);
            Response::success(['orders' => $orders]);
        } catch (\Exception $e) {
            error_log('[OrderController] ' . $e->getMessage());
            Response::error('Impossible de récupérer les commandes.', 500);
        }
    }
}
