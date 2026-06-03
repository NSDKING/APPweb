<?php
namespace Controllers;

use Core\Request;
use Core\Response;
use Models\PromoCode;

class PromoCodeController
{
    private PromoCode $model;

    public function __construct()
    {
        $this->model = new PromoCode();
    }

    // POST /api/promo/validate
    public function validate(Request $request): void
    {
        $data = $request->json();
        $code = trim($data['code'] ?? '');

        if (!$code) {
            Response::error('Code requis', 422);
            return;
        }

        $promo = $this->model->findByCode($code);

        if (!$promo) {
            Response::error('Code invalide ou expiré', 404);
            return;
        }

        if ($promo['expires_at'] && strtotime($promo['expires_at']) < time()) {
            Response::error('Ce code a expiré', 410);
            return;
        }

        if ($promo['max_uses'] !== null && $promo['used_count'] >= $promo['max_uses']) {
            Response::error('Ce code a atteint son nombre maximum d\'utilisations', 410);
            return;
        }

        $orderAmount = (float)($data['order_amount'] ?? 0);
        if ($orderAmount < (float)$promo['min_order_amount']) {
            Response::error(
                'Montant minimum requis : ' . number_format((float)$promo['min_order_amount'], 2) . ' €',
                422
            );
            return;
        }

        Response::success([
            'id'             => $promo['id'],
            'code'           => $promo['code'],
            'discount_type'  => $promo['discount_type'],
            'discount_value' => $promo['discount_value'],
        ], 'Code valide');
    }
}
