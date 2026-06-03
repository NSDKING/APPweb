<?php
namespace Controllers;

use Core\JWT;
use Core\Request;
use Core\Response;
use Models\Review;

class ReviewController
{
    private Review $model;

    public function __construct()
    {
        $this->model = new Review();
    }

    private function auth(Request $request): ?array
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        return JWT::decode($token) ?: null;
    }

    // GET /api/products/{id}/reviews
    public function index(Request $request, int $productId): void
    {
        try {
            $reviews = $this->model->findByProduct($productId);
            $average = $this->model->averageRating($productId);
            Response::success(['reviews' => $reviews, 'average' => $average, 'count' => count($reviews)]);
        } catch (\PDOException $e) {
            error_log('[ReviewController] ' . $e->getMessage());
            Response::success(['reviews' => [], 'average' => 0, 'count' => 0]);
        }
    }

    // POST /api/products/{id}/reviews
    public function store(Request $request, int $productId): void
    {
        $payload = $this->auth($request);
        if (!$payload) {
            Response::error('Connexion requise', 401);
            return;
        }

        $userId = (int)$payload['user_id'];
        $data   = $request->json();
        $rating = (int)($data['rating'] ?? 0);

        if ($rating < 1 || $rating > 5) {
            Response::error('La note doit être entre 1 et 5', 422);
            return;
        }

        if ($this->model->userReview($productId, $userId)) {
            Response::error('Vous avez déjà laissé un avis sur ce produit', 409);
            return;
        }

        $comment = isset($data['comment']) ? htmlspecialchars(trim($data['comment']), ENT_QUOTES, 'UTF-8') : null;

        try {
            $id = $this->model->create([
                'product_id' => $productId,
                'user_id'    => $userId,
                'rating'     => $rating,
                'comment'    => $comment,
            ]);
        } catch (\PDOException $e) {
            error_log('[ReviewController] ' . $e->getMessage());
            Response::error('Table manquante — exécutez migration_new_features.sql', 500);
            return;
        }

        if (!$id) {
            Response::error('Erreur lors de l\'enregistrement', 500);
            return;
        }

        Response::success(['id' => $id], 'Avis ajouté', 201);
    }

    // DELETE /api/reviews/{id}
    public function destroy(Request $request, int $id): void
    {
        $payload = $this->auth($request);
        if (!$payload) {
            Response::error('Connexion requise', 401);
            return;
        }

        $deleted = $this->model->delete($id, (int)$payload['user_id']);
        if (!$deleted) {
            Response::error('Avis introuvable ou accès refusé', 404);
            return;
        }

        Response::success(null, 'Avis supprimé');
    }
}
