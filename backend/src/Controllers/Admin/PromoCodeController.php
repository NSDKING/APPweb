<?php
namespace Controllers\Admin;

use Core\Request;
use Core\Response;
use Middleware\AdminMiddleware;
use Models\PromoCode;

class PromoCodeController
{
    private PromoCode $model;

    public function __construct()
    {
        $this->model = new PromoCode();
    }

    // GET /api/admin/promo
    public function index(Request $request): void
    {
        AdminMiddleware::handle($request);
        Response::success($this->model->all());
    }

    // POST /api/admin/promo
    public function store(Request $request): void
    {
        AdminMiddleware::handle($request);
        $data = $request->json();

        if (empty($data['code']) || empty($data['discount_value'])) {
            Response::error('code et discount_value sont requis', 422);
            return;
        }

        if (!in_array($data['discount_type'] ?? '', ['percentage', 'fixed'], true)) {
            Response::error('discount_type doit être percentage ou fixed', 422);
            return;
        }

        if (($data['discount_type'] ?? '') === 'percentage' && (float)$data['discount_value'] > 100) {
            Response::error('La réduction en pourcentage ne peut pas dépasser 100%', 422);
            return;
        }

        $id = $this->model->create($data);
        if (!$id) { Response::error('Erreur lors de la création', 500); return; }

        Response::success(['id' => $id], 'Code promo créé', 201);
    }

    // DELETE /api/admin/promo/{id}
    public function destroy(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);
        $this->model->delete($id);
        Response::success(null, 'Code promo supprimé');
    }

    // PUT /api/admin/promo/{id}/toggle
    public function toggle(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);
        $this->model->toggle($id);
        Response::success(null, 'Statut mis à jour');
    }
}
