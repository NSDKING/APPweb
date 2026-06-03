<?php
namespace Controllers;

use Core\Mailer;
use Core\Request;
use Core\Response;
use Core\JWT;
use Models\User;
use Models\PasswordReset;

class AuthController
{
    private User $user;
    private PasswordReset $passwordReset;

    public function __construct()
    {
        $this->user          = new User();
        $this->passwordReset = new PasswordReset();
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

    public function forgotPassword(Request $request): void
    {
        $email = trim($request->input('email', ''));

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Response::error('Adresse email invalide');
            return;
        }

        $user = $this->user->findByEmail($email);

        // Always return success to prevent email enumeration
        if (!$user) {
            Response::success(null, 'Si ce compte existe, un lien a été envoyé.');
            return;
        }

        $token    = $this->passwordReset->create($email);
        $appUrl   = $_ENV['APP_URL'] ?? 'http://localhost';
        $resetUrl = $appUrl . '/pages/auth/forget_passsword.html?token=' . $token;

        $sent = $this->sendResetEmail($email, $user['name'], $resetUrl);

        // En développement ou si l'envoi échoue : retourner l'URL directement
        $data = null;
        if (!$sent || ($_ENV['APP_ENV'] ?? 'production') !== 'production') {
            $data = ['reset_url' => $resetUrl];
        }

        Response::success($data, 'Si ce compte existe, un lien a été envoyé.');
    }

    public function resetPassword(Request $request): void
    {
        $token    = trim($request->input('token', ''));
        $password = $request->input('password', '');

        if (!$token || !$password) {
            Response::error('Token et mot de passe requis');
            return;
        }

        if (strlen($password) < 8) {
            Response::error('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        $reset = $this->passwordReset->findValid($token);

        if (!$reset) {
            Response::error('Lien invalide ou expiré', 400);
            return;
        }

        $user = $this->user->findByEmail($reset['email']);
        if (!$user) {
            Response::error('Compte introuvable', 404);
            return;
        }

        $this->user->updatePassword($user['id'], $password);
        $this->passwordReset->markUsed($token);

        Response::success(null, 'Mot de passe mis à jour. Vous pouvez vous connecter.');
    }

    private function sendResetEmail(string $to, string $name, string $resetUrl): bool
    {
        $subject = 'Réinitialisation de votre mot de passe — ShoeBox';
        $html    = Mailer::resetPasswordHtml($name, $resetUrl);
        return Mailer::send($to, $subject, $html);
    }
}
