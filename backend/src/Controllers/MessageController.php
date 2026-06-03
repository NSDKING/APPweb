<?php
namespace Controllers;

use Core\JWT;
use Core\Request;
use Core\Response;
use Models\Message;
use Models\User;

class MessageController
{
    private Message $model;

    public function __construct()
    {
        $this->model = new Message();
    }

    private function auth(Request $request): ?array
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        return JWT::decode($token) ?: null;
    }

    // GET /api/messages — boîte de réception
    public function inbox(Request $request): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        $messages = $this->model->inbox((int)$payload['user_id']);
        $unread   = $this->model->unreadCount((int)$payload['user_id']);
        Response::success(['messages' => $messages, 'unread' => $unread]);
    }

    // GET /api/messages/sent — messages envoyés
    public function sent(Request $request): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        Response::success($this->model->sent((int)$payload['user_id']));
    }

    // GET /api/messages/{id}
    public function show(Request $request, int $id): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        $msg = $this->model->findById($id);
        if (!$msg) { Response::error('Message introuvable', 404); return; }

        $userId = (int)$payload['user_id'];
        if ($msg['sender_id'] != $userId && $msg['receiver_id'] != $userId) {
            Response::error('Accès refusé', 403);
            return;
        }

        if ($msg['receiver_id'] == $userId) {
            $this->model->markRead($id, $userId);
        }

        Response::success($msg);
    }

    // POST /api/messages — envoyer un message
    public function store(Request $request): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        $data       = $request->json();
        $receiverId = (int)($data['receiver_id'] ?? 0);
        $subject    = trim($data['subject'] ?? '');
        $body       = trim($data['body'] ?? '');

        if (!$receiverId || !$subject || !$body) {
            Response::error('receiver_id, subject et body sont requis', 422);
            return;
        }

        $subject = htmlspecialchars($subject, ENT_QUOTES, 'UTF-8');
        $body    = htmlspecialchars($body, ENT_QUOTES, 'UTF-8');

        $id = $this->model->send((int)$payload['user_id'], $receiverId, $subject, $body);

        if (!$id) { Response::error('Erreur lors de l\'envoi', 500); return; }

        Response::success(['id' => $id], 'Message envoyé', 201);
    }

    // PUT /api/messages/{id}/read
    public function markRead(Request $request, int $id): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        $this->model->markRead($id, (int)$payload['user_id']);
        Response::success(null, 'Message marqué comme lu');
    }
}
