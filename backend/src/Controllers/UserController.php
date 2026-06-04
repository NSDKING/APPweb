<?php
namespace Controllers;

use Core\Database;
use Core\JWT;
use Core\Request;
use Core\Response;
use Models\User;

class UserController
{
    private User $model;

    public function __construct()
    {
        $this->model = new User();
    }

    private function auth(Request $request): ?array
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        return JWT::decode($token) ?: null;
    }

    // GET /api/users/me
    public function me(Request $request): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        $user = $this->model->findById((int)$payload['user_id']);
        if (!$user) { Response::error('Utilisateur introuvable', 404); return; }

        Response::success($user);
    }

    // PUT /api/users/me
    public function update(Request $request): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        $data = $request->json();
        $update = [];

        if (isset($data['name'])) {
            $name = trim($data['name']);
            if (!$name) { Response::error('Le nom ne peut pas être vide', 422); return; }
            $update['name'] = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        }

        if (isset($data['adresse'])) {
            $update['adresse'] = htmlspecialchars(trim($data['adresse']), ENT_QUOTES, 'UTF-8');
        }

        if (!$update) { Response::error('Aucune donnée à mettre à jour', 422); return; }

        $this->model->update((int)$payload['user_id'], $update);
        $user = $this->model->findById((int)$payload['user_id']);
        Response::success($user, 'Profil mis à jour');
    }

    // PUT /api/users/me/password
    public function changePassword(Request $request): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        $data        = $request->json();
        $current     = $data['current_password'] ?? '';
        $newPassword = $data['new_password']      ?? '';

        if (!$current || !$newPassword) {
            Response::error('Mot de passe actuel et nouveau mot de passe requis', 422);
            return;
        }

        if (strlen($newPassword) < 8) {
            Response::error('Le nouveau mot de passe doit contenir au moins 8 caractères', 422);
            return;
        }

        if (!preg_match('/[A-Z]/', $newPassword)) {
            Response::error('Le nouveau mot de passe doit contenir au moins une majuscule', 422);
            return;
        }

        if (!preg_match('/[0-9]/', $newPassword)) {
            Response::error('Le nouveau mot de passe doit contenir au moins un chiffre', 422);
            return;
        }

        // Vérifier le mot de passe actuel
        $user = $this->model->findById((int)$payload['user_id']);
        if (!$user) { Response::error('Utilisateur introuvable', 404); return; }

        // Récupérer le hash complet
        $full = Database::getInstance()->prepare('SELECT password_hash FROM users WHERE id = ? LIMIT 1');
        $full->execute([$user['id']]);
        $row = $full->fetch();

        if (!password_verify($current, $row['password_hash'])) {
            Response::error('Mot de passe actuel incorrect', 401);
            return;
        }

        $this->model->updatePassword((int)$payload['user_id'], $newPassword);
        Response::success(null, 'Mot de passe modifié avec succès');
    }
}
