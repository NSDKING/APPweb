<?php
namespace Models;

use Core\Database;

class CarouselSlide
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    public function all(): array
    {
        return $this->db
            ->query('SELECT id, title, subtitle, description, image_url AS image, button_text AS buttonText, link, position FROM carousel_slides ORDER BY position ASC')
            ->fetchAll();
    }

    public function find(int $id): array|false
    {
        $stmt = $this->db->prepare('SELECT id, title, subtitle, description, image_url AS image, button_text AS buttonText, link, position FROM carousel_slides WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create(array $data): int
    {
        $position = (int)$this->db->query('SELECT COALESCE(MAX(position), -1) + 1 FROM carousel_slides')->fetchColumn();
        $stmt = $this->db->prepare('INSERT INTO carousel_slides (title, subtitle, description, image_url, button_text, link, position) VALUES (?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([
            $data['title'],
            $data['subtitle'] ?? '',
            $data['description'] ?? '',
            $data['image'] ?? '',
            $data['buttonText'] ?? '',
            $data['link'] ?? '',
            $position,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): void
    {
        $stmt = $this->db->prepare('UPDATE carousel_slides SET title=?, subtitle=?, description=?, image_url=?, button_text=?, link=? WHERE id=?');
        $stmt->execute([
            $data['title'],
            $data['subtitle'] ?? '',
            $data['description'] ?? '',
            $data['image'] ?? '',
            $data['buttonText'] ?? '',
            $data['link'] ?? '',
            $id,
        ]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM carousel_slides WHERE id = ?');
        $stmt->execute([$id]);
        $this->resequence();
    }

    public function move(int $id, string $direction): void
    {
        $slides = $this->db->query('SELECT id, position FROM carousel_slides ORDER BY position ASC')->fetchAll();
        $index  = array_search($id, array_column($slides, 'id'));

        if ($index === false) return;

        $swapIndex = $direction === 'up' ? $index - 1 : $index + 1;
        if ($swapIndex < 0 || $swapIndex >= count($slides)) return;

        $stmt = $this->db->prepare('UPDATE carousel_slides SET position = ? WHERE id = ?');
        $stmt->execute([$slides[$swapIndex]['position'], $slides[$index]['id']]);
        $stmt->execute([$slides[$index]['position'], $slides[$swapIndex]['id']]);
    }

    private function resequence(): void
    {
        $slides = $this->db->query('SELECT id FROM carousel_slides ORDER BY position ASC')->fetchAll();
        $stmt   = $this->db->prepare('UPDATE carousel_slides SET position = ? WHERE id = ?');
        foreach ($slides as $i => $slide) {
            $stmt->execute([$i, $slide['id']]);
        }
    }
}
