<?php
namespace Core;

class JWT
{
    private static function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64urlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }

    public static function encode(array $payload): string
    {
        $secret  = $_ENV['JWT_SECRET'] ?? 'secret';
        $expiry  = (int)($_ENV['JWT_EXPIRY'] ?? 86400);

        $header  = self::base64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload['exp'] = time() + $expiry;
        $payload = self::base64url(json_encode($payload));
        $sig     = self::base64url(hash_hmac('sha256', "$header.$payload", $secret, true));

        return "$header.$payload.$sig";
    }

    public static function decode(string $token): ?array
    {
        $secret = $_ENV['JWT_SECRET'] ?? 'secret';
        $parts  = explode('.', $token);

        if (count($parts) !== 3) return null;

        [$header, $payload, $sig] = $parts;
        $expected = self::base64url(hash_hmac('sha256', "$header.$payload", $secret, true));

        if (!hash_equals($expected, $sig)) return null;

        $data = json_decode(self::base64urlDecode($payload), true);

        if (!$data || $data['exp'] < time()) return null;

        return $data;
    }
}
