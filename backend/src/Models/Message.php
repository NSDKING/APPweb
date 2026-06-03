<?php
namespace Models;

use Core\Database;

class Message
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function inbox(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT m.id, m.subject, m.message_body, m.read_status, m.sent_at,
                    u.name AS sender_name
             FROM InternalMessages m
             JOIN Users u ON m.sender_id = u.id
             WHERE m.receiver_id = ?
             ORDER BY m.sent_at DESC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function sent(int $userId): array
    {
        $stmt = $this->db->prepare(
            'SELECT m.id, m.subject, m.message_body, m.sent_at,
                    u.name AS receiver_name
             FROM InternalMessages m
             JOIN Users u ON m.receiver_id = u.id
             WHERE m.sender_id = ?
             ORDER BY m.sent_at DESC'
        );
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function send(int $senderId, int $receiverId, string $subject, string $body): int|false
    {
        $stmt = $this->db->prepare(
            'INSERT INTO InternalMessages (sender_id, receiver_id, subject, message_body)
             VALUES (:sender_id, :receiver_id, :subject, :body)'
        );
        $stmt->execute([
            ':sender_id'   => $senderId,
            ':receiver_id' => $receiverId,
            ':subject'     => $subject,
            ':body'        => $body,
        ]);
        $id = (int)$this->db->lastInsertId();
        return $id > 0 ? $id : false;
    }

    public function markRead(int $id, int $userId): bool
    {
        return $this->db->prepare(
            'UPDATE InternalMessages SET read_status = 1 WHERE id = ? AND receiver_id = ?'
        )->execute([$id, $userId]);
    }

    public function unreadCount(int $userId): int
    {
        $stmt = $this->db->prepare(
            'SELECT COUNT(*) FROM InternalMessages WHERE receiver_id = ? AND read_status = 0'
        );
        $stmt->execute([$userId]);
        return (int)$stmt->fetchColumn();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare(
            'SELECT m.*, s.name AS sender_name, r.name AS receiver_name
             FROM InternalMessages m
             JOIN Users s ON m.sender_id = s.id
             JOIN Users r ON m.receiver_id = r.id
             WHERE m.id = ? LIMIT 1'
        );
        $stmt->execute([$id]);
        return $stmt->fetch();
    }
}
