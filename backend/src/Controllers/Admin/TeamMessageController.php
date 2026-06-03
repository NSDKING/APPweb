<?php
namespace Controllers\Admin;

use Core\Database;
use Core\JWT;
use Core\Request;
use Core\Response;
use Middleware\AdminMiddleware;

class TeamMessageController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // GET /api/admin/team-messages
    public function index(Request $request): void
    {
        AdminMiddleware::handle($request);

        $stmt = $this->db->query(
            'SELECT m.id, m.content, m.created_at, u.name AS sender_name, u.id AS sender_id
             FROM TeamMessages m
             JOIN Users u ON m.sender_id = u.id
             ORDER BY m.created_at ASC
             LIMIT 200'
        );
        Response::success($stmt->fetchAll());
    }

    // POST /api/admin/team-messages
    public function store(Request $request): void
    {
        AdminMiddleware::handle($request);

        $token   = $request->bearerToken();
        $payload = $token ? JWT::decode($token) : null;
        if (!$payload) { Response::error('Non authentifié', 401); return; }

        $content = trim($request->json()['content'] ?? '');
        if (!$content) { Response::error('Message vide', 422); return; }

        $content = htmlspecialchars($content, ENT_QUOTES, 'UTF-8');

        $stmt = $this->db->prepare(
            'INSERT INTO TeamMessages (sender_id, content) VALUES (:sid, :content)'
        );
        $stmt->execute([':sid' => (int)$payload['user_id'], ':content' => $content]);

        $id = (int)$this->db->lastInsertId();

        // Retourner le message avec le nom de l'expéditeur
        $row = $this->db->prepare(
            'SELECT m.id, m.content, m.created_at, u.name AS sender_name, u.id AS sender_id
             FROM TeamMessages m JOIN Users u ON m.sender_id = u.id WHERE m.id = ?'
        );
        $row->execute([$id]);
        Response::success($row->fetch(), 'Message envoyé', 201);
    }
}
