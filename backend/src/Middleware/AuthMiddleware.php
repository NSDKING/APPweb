<?php
namespace Middleware;

use Core\JWT;
use Core\Request;
use Core\Response;

class AuthMiddleware
{
    public static function handle(Request $request): array
    {
        $token = $request->bearerToken();

        if (!$token) {
            Response::error('No token provided', 401);
        }

        $payload = JWT::decode($token);

        if (!$payload) {
            Response::error('Invalid or expired token', 401);
        }

        return $payload;
    }
}
