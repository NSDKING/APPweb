<?php
namespace Controllers;

use Core\Request;
use Core\Response;
use Core\JWT;
use Models\User;

class AuthController
{
    private User $user;

    public function __construct()
    {
        $this->user = new User();
    }

    public function register(Request $request): void
    {
        $name     = trim($request->input('name', ''));
        $email    = trim($request->input('email', ''));
        $password = $request->input('password', '');
        $adresse  = trim($request->input('adresse', ''));

        if (!$name || !$email || !$password) {
            Response::error('Name, email and password are required');
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email address');
            return;
        }

        if (strlen($password) < 8) {
            Response::error('Password must be at least 8 characters');
            return;
        }

        if ($this->user->findByEmail($email)) {
            Response::error('Email already in use', 409);
            return;
        }

        $id    = $this->user->create($name, $email, $password, $adresse);
        $token = JWT::encode(['user_id' => $id, 'role' => 'customer']);

        Response::success(['token' => $token, 'role' => 'customer'], 'Account created', 201);
    }

    public function login(Request $request): void
    {
        $email    = trim($request->input('email', ''));
        $password = $request->input('password', '');

        if (!$email || !$password) {
            Response::error('Email and password are required');
            return;
        }

        $user = $this->user->findByEmail($email);

        if (!$user || !password_verify($password, $user['password_hash'])) {
            Response::error('Invalid credentials', 401);
            return;
        }

        $token = JWT::encode(['user_id' => $user['id'], 'role' => $user['role']]);

        Response::success([
            'token' => $token,
            'user'  => [
                'id'    => $user['id'],
                'name'  => $user['name'],
                'email' => $user['email'],
                'role'  => $user['role'],
            ],
        ], 'Login successful');
    }

    public function logout(Request $request): void
    {
        // JWT is stateless — client just discards the token
        Response::success(null, 'Logged out');
    }
}
