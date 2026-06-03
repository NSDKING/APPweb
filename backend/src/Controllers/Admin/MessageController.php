<?php
namespace Controllers\Admin;

use Core\Database;
use Core\Request;
use Core\Response;
use Middleware\AdminMiddleware;

class MessageController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // GET /api/admin/messages
    public function index(Request $request): void
    {
        AdminMiddleware::handle($request);

        $stmt = $this->db->query(
            'SELECT m.id, m.subject, m.message_body, m.read_status, m.sent_at,
                    s.name AS sender_name, r.name AS receiver_name
             FROM InternalMessages m
             JOIN Users s ON m.sender_id = s.id
             JOIN Users r ON m.receiver_id = r.id
             ORDER BY m.sent_at DESC
             LIMIT 200'
        );
        Response::success($stmt->fetchAll());
    }
}
