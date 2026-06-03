<?php
namespace Controllers\Admin;

use Core\Database;
use Core\Request;
use Core\Response;
use Middleware\AdminMiddleware;

class ForumController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    // GET /api/admin/forum/categories
    public function categories(Request $request): void
    {
        AdminMiddleware::handle($request);
        $stmt = $this->db->query(
            'SELECT fc.*, COUNT(ft.id) AS thread_count
             FROM ForumCategories fc
             LEFT JOIN ForumThreads ft ON ft.category_id = fc.id
             GROUP BY fc.id ORDER BY fc.id'
        );
        Response::success($stmt->fetchAll());
    }

    // POST /api/admin/forum/categories
    public function storeCategory(Request $request): void
    {
        AdminMiddleware::handle($request);
        $data = $request->json();
        $name = trim($data['name'] ?? '');

        if (!$name) { Response::error('name requis', 422); return; }

        $name = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
        $desc = htmlspecialchars(trim($data['description'] ?? ''), ENT_QUOTES, 'UTF-8');

        $stmt = $this->db->prepare(
            'INSERT INTO ForumCategories (name, description) VALUES (:name, :description)'
        );
        $stmt->execute([':name' => $name, ':description' => $desc ?: null]);
        Response::success(['id' => (int)$this->db->lastInsertId()], 'Catégorie créée', 201);
    }

    // DELETE /api/admin/forum/categories/{id}
    public function destroyCategory(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);
        $this->db->prepare('DELETE FROM ForumCategories WHERE id = ?')->execute([$id]);
        Response::success(null, 'Catégorie supprimée');
    }

    // GET /api/admin/forum/threads
    public function threads(Request $request): void
    {
        AdminMiddleware::handle($request);
        $stmt = $this->db->query(
            'SELECT ft.id, ft.title, ft.is_pinned, ft.is_locked, ft.created_at,
                    u.name AS author, fc.name AS category
             FROM ForumThreads ft
             JOIN Users u ON ft.user_id = u.id
             JOIN ForumCategories fc ON ft.category_id = fc.id
             ORDER BY ft.created_at DESC
             LIMIT 100'
        );
        Response::success($stmt->fetchAll());
    }

    // PUT /api/admin/forum/threads/{id}/pin
    public function pin(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);
        $this->db->prepare(
            'UPDATE ForumThreads SET is_pinned = NOT is_pinned WHERE id = ?'
        )->execute([$id]);
        Response::success(null, 'Statut épinglé mis à jour');
    }

    // PUT /api/admin/forum/threads/{id}/lock
    public function lock(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);
        $this->db->prepare(
            'UPDATE ForumThreads SET is_locked = NOT is_locked WHERE id = ?'
        )->execute([$id]);
        Response::success(null, 'Statut verrouillé mis à jour');
    }

    // DELETE /api/admin/forum/threads/{id}
    public function destroyThread(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);
        $this->db->prepare('DELETE FROM ForumThreads WHERE id = ?')->execute([$id]);
        Response::success(null, 'Fil supprimé');
    }

    // DELETE /api/admin/forum/posts/{id}
    public function destroyPost(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);
        $this->db->prepare('DELETE FROM ForumPosts WHERE id = ?')->execute([$id]);
        Response::success(null, 'Publication supprimée');
    }
}
