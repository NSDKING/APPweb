<?php
namespace Controllers\Admin;

use Core\Request;
use Core\Response;
use Middleware\AdminMiddleware;
use Models\User;

class UserController
{
    private User $model;

    public function __construct()
    {
        $this->model = new User();
    }

    public function index(Request $request): void
    {
        AdminMiddleware::handle($request);
        Response::success($this->model->all());
    }

    public function setRole(Request $request, int $id): void
    {
        $admin = AdminMiddleware::handle($request);
        $data  = $request->json();
        $role  = $data['role'] ?? '';

        if (!in_array($role, ['user', 'admin'])) {
            Response::error('role must be "user" or "admin"', 422);
            return;
        }

        if ((int)($admin['sub'] ?? 0) === $id) {
            Response::error('Cannot change your own role', 403);
            return;
        }

        if (!$this->model->findById($id)) {
            Response::error('User not found', 404);
            return;
        }

        $this->model->setRole($id, $role);
        Response::success(['id' => $id, 'role' => $role], 'Role updated');
    }
}
