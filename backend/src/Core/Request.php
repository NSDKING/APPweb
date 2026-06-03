<?php
namespace Core;

class Request
{
    public string $method;
    public string $uri;
    private array $body;

    public function __construct()
    {
        $this->method = strtoupper($_SERVER['REQUEST_METHOD']);
        $this->uri    = strtok($_SERVER['REQUEST_URI'], '?');
        $this->body   = $this->parseBody();
    }

    private function parseBody(): array
    {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (str_contains($contentType, 'application/json')) {
            return json_decode(file_get_contents('php://input'), true) ?? [];
        }
        return $_POST;
    }

    public function input(string $key, mixed $default = null): mixed
    {
        return $this->body[$key] ?? $_GET[$key] ?? $default;
    }

    public function all(): array
    {
        return array_merge($_GET, $this->body);
    }

    public function json(): array
    {
        return $this->body;
    }

    public function bearerToken(): ?string
    {
        // Apache peut renommer l'en-tête après un rewrite (.htaccess)
        $header = $_SERVER['HTTP_AUTHORIZATION']
               ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
               ?? '';

        // Fallback via apache_request_headers() si disponible
        if (!$header && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            $header  = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        }

        if (preg_match('/Bearer\s+(.+)/i', $header, $m)) {
            return $m[1];
        }
        return null;
    }
}
