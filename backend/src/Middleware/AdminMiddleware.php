<?php
namespace Middleware;

use Core\JWT;
use Core\Request;
use Core\Response;

class AdminMiddleware
{
    public static function handle(Request $request): array
    {
        $token = $request->bearerToken();

        if (!$token) {
            Response::error('Authentication required', 401);
            exit;
        }

        $payload = JWT::decode($token);

        if (!$payload) {
            Response::error('Invalid or expired token', 401);
            exit;
        }

        if (($payload['role'] ?? '') !== 'admin') {
            Response::error('Admin access required', 403);
            exit;
        }

        return $payload;
    }
}
