<?php
namespace Controllers;

use Core\JWT;
use Core\Request;
use Core\Response;
use Models\Favourite;

class FavouriteController
{
    private Favourite $model;

    public function __construct()
    {
        $this->model = new Favourite();
    }

    private function auth(Request $request): ?array
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        return JWT::decode($token) ?: null;
    }

    public function index(Request $request): void
    {
        $payload = $this->auth($request);
        if (!$payload) {
            Response::success([]);
            return;
        }
        try {
            Response::success($this->model->getByUser((int)$payload['user_id']));
        } catch (\PDOException $e) {
            Response::error('Table manquante — créez la table favourites en base: ' . $e->getMessage(), 500);
        }
    }

    public function store(Request $request): void
    {
        $payload = $this->auth($request);
        if (!$payload) {
            Response::error('Connexion requise', 401);
            return;
        }

        $productId = (int)($request->json()['product_id'] ?? 0);
        if (!$productId) {
            Response::error('product_id requis', 422);
            return;
        }

        try {
            $this->model->add((int)$payload['user_id'], $productId);
            Response::success(null, 'Ajouté aux favoris', 201);
        } catch (\PDOException $e) {
            Response::error('Table manquante — créez la table favourites en base: ' . $e->getMessage(), 500);
        }
    }

    public function destroy(Request $request, int $productId): void
    {
        $payload = $this->auth($request);
        if (!$payload) {
            Response::error('Connexion requise', 401);
            return;
        }

        try {
            $this->model->remove((int)$payload['user_id'], $productId);
            Response::success(null, 'Retiré des favoris');
        } catch (\PDOException $e) {
            Response::error('Table manquante — créez la table favourites en base: ' . $e->getMessage(), 500);
        }
    }
}
