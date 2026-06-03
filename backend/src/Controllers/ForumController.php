<?php
namespace Controllers;

use Core\Database;
use Core\JWT;
use Core\Request;
use Core\Response;

class ForumController
{
    private \PDO $db;

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    private function auth(Request $request): ?array
    {
        $token = $request->bearerToken();
        if (!$token) return null;
        return JWT::decode($token) ?: null;
    }

    // GET /api/forum/categories
    public function categories(Request $request): void
    {
        $stmt = $this->db->query(
            'SELECT fc.id, fc.name, fc.description,
                    COUNT(DISTINCT ft.id) AS thread_count,
                    COUNT(DISTINCT fp.id) AS post_count
             FROM ForumCategories fc
             LEFT JOIN ForumThreads ft ON ft.category_id = fc.id
             LEFT JOIN ForumPosts fp ON fp.thread_id = ft.id
             GROUP BY fc.id
             ORDER BY fc.id'
        );
        Response::success($stmt->fetchAll());
    }

    // GET /api/forum/categories/{id}/threads
    public function threads(Request $request, int $categoryId): void
    {
        $stmt = $this->db->prepare(
            'SELECT ft.id, ft.title, ft.is_pinned, ft.is_locked, ft.created_at,
                    u.name AS author_name, u.id AS author_id,
                    COUNT(fp.id) AS reply_count,
                    MAX(fp.created_at) AS last_reply_at
             FROM ForumThreads ft
             JOIN Users u ON ft.user_id = u.id
             LEFT JOIN ForumPosts fp ON fp.thread_id = ft.id
             WHERE ft.category_id = :cid
             GROUP BY ft.id
             ORDER BY ft.is_pinned DESC, COALESCE(MAX(fp.created_at), ft.created_at) DESC'
        );
        $stmt->execute([':cid' => $categoryId]);
        Response::success($stmt->fetchAll());
    }

    // GET /api/forum/threads/{id}
    public function thread(Request $request, int $threadId): void
    {
        $payload = $this->auth($request);
        $userId  = $payload ? (int)$payload['user_id'] : 0;

        $tStmt = $this->db->prepare(
            'SELECT ft.*, u.name AS author_name, fc.name AS category_name, fc.id AS category_id
             FROM ForumThreads ft
             JOIN Users u ON ft.user_id = u.id
             JOIN ForumCategories fc ON ft.category_id = fc.id
             WHERE ft.id = ? LIMIT 1'
        );
        $tStmt->execute([$threadId]);
        $thread = $tStmt->fetch();

        if (!$thread) { Response::error('Fil introuvable', 404); return; }

        $pStmt = $this->db->prepare(
            'SELECT fp.id, fp.body, fp.is_edited, fp.created_at,
                    u.name AS author_name, u.id AS author_id,
                    COUNT(fpl.id) AS like_count,
                    MAX(CASE WHEN fpl.user_id = :uid THEN 1 ELSE 0 END) AS user_liked
             FROM ForumPosts fp
             JOIN Users u ON fp.user_id = u.id
             LEFT JOIN ForumPostLikes fpl ON fpl.post_id = fp.id
             WHERE fp.thread_id = :tid
             GROUP BY fp.id
             ORDER BY fp.created_at ASC'
        );
        $pStmt->execute([':tid' => $threadId, ':uid' => $userId]);
        $posts = $pStmt->fetchAll();

        Response::success(['thread' => $thread, 'posts' => $posts]);
    }

    // POST /api/forum/threads
    public function createThread(Request $request): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        $data       = $request->json();
        $categoryId = (int)($data['category_id'] ?? 0);
        $title      = trim($data['title'] ?? '');
        $body       = trim($data['body'] ?? '');

        if (!$categoryId || !$title || !$body) {
            Response::error('category_id, title et body sont requis', 422);
            return;
        }

        $title = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
        $body  = htmlspecialchars($body,  ENT_QUOTES, 'UTF-8');

        $stmt = $this->db->prepare(
            'INSERT INTO ForumThreads (category_id, user_id, title) VALUES (:cid, :uid, :title)'
        );
        $stmt->execute([':cid' => $categoryId, ':uid' => (int)$payload['user_id'], ':title' => $title]);
        $threadId = (int)$this->db->lastInsertId();

        $stmt2 = $this->db->prepare(
            'INSERT INTO ForumPosts (thread_id, user_id, body) VALUES (:tid, :uid, :body)'
        );
        $stmt2->execute([':tid' => $threadId, ':uid' => (int)$payload['user_id'], ':body' => $body]);

        Response::success(['thread_id' => $threadId], 'Fil créé', 201);
    }

    // POST /api/forum/threads/{id}/posts
    public function createPost(Request $request, int $threadId): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        $thread = $this->db->prepare('SELECT is_locked FROM ForumThreads WHERE id = ? LIMIT 1');
        $thread->execute([$threadId]);
        $t = $thread->fetch();
        if (!$t)            { Response::error('Fil introuvable', 404); return; }
        if ($t['is_locked']){ Response::error('Ce fil est verrouillé', 403); return; }

        $body = trim($request->json()['body'] ?? '');
        if (!$body) { Response::error('Le message ne peut pas être vide', 422); return; }

        $body = htmlspecialchars($body, ENT_QUOTES, 'UTF-8');

        $stmt = $this->db->prepare(
            'INSERT INTO ForumPosts (thread_id, user_id, body) VALUES (:tid, :uid, :body)'
        );
        $stmt->execute([':tid' => $threadId, ':uid' => (int)$payload['user_id'], ':body' => $body]);
        $postId = (int)$this->db->lastInsertId();

        Response::success(['post_id' => $postId], 'Réponse ajoutée', 201);
    }

    // POST /api/forum/posts/{id}/like
    public function likePost(Request $request, int $postId): void
    {
        $payload = $this->auth($request);
        if (!$payload) { Response::error('Connexion requise', 401); return; }

        $userId = (int)$payload['user_id'];

        $check = $this->db->prepare('SELECT id FROM ForumPostLikes WHERE post_id = ? AND user_id = ? LIMIT 1');
        $check->execute([$postId, $userId]);

        if ($check->fetch()) {
            $this->db->prepare('DELETE FROM ForumPostLikes WHERE post_id = ? AND user_id = ?')->execute([$postId, $userId]);
            Response::success(['liked' => false], 'Like retiré');
        } else {
            $this->db->prepare('INSERT INTO ForumPostLikes (post_id, user_id) VALUES (?, ?)')->execute([$postId, $userId]);
            Response::success(['liked' => true], 'Like ajouté');
        }
    }
}
