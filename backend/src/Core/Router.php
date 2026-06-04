<?php
namespace Core;

class Router
{
    private array $routes = [];

    public function get(string $path, array|callable $handler): void
    {
        $this->routes[] = ['GET', $path, $handler];
    }

    public function post(string $path, array|callable $handler): void
    {
        $this->routes[] = ['POST', $path, $handler];
    }

    public function put(string $path, array|callable $handler): void
    {
        $this->routes[] = ['PUT', $path, $handler];
    }

    public function delete(string $path, array|callable $handler): void
    {
        $this->routes[] = ['DELETE', $path, $handler];
    }

    public function dispatch(Request $request): void
    {
        foreach ($this->routes as [$method, $path, $handler]) {
            $pattern = preg_replace('/\{[^}]+\}/', '([^/]+)', $path);
            $pattern = '#^' . $pattern . '$#';

            if ($request->method === $method && preg_match($pattern, $request->uri, $matches)) {
                array_shift($matches);
                if (is_callable($handler)) {
                    call_user_func_array($handler, [$request, ...$matches]);
                } else {
                    [$class, $method] = $handler;
                    $controller = new $class();
                    $controller->$method($request, ...$matches);
                }
                return;
            }
        }
        // For non-API GET requests, try to serve the corresponding frontend HTML file
        if ($request->method === 'GET' && !str_starts_with($request->uri, '/api/')) {
            $frontendDir = realpath(dirname(__DIR__, 3) . '/frontend');
            if ($frontendDir) {
                $filePath = realpath($frontendDir . $request->uri);
                if ($filePath && str_starts_with($filePath, $frontendDir) && is_file($filePath)) {
                    $ext = strtolower(pa
                    thinfo($filePath, PATHINFO_EXTENSION));
                    $mimes = [
                        'html' => 'text/html; charset=UTF-8',
                        'css'  => 'text/css',
                        'js'   => 'application/javascript',
                        'png'  => 'image/png',
                        'jpg'  => 'image/jpeg',
                        'jpeg' => 'image/jpeg',
                        'svg'  => 'image/svg+xml',
                        'ico'  => 'image/x-icon',
                        'woff' => 'font/woff',
                        'woff2'=> 'font/woff2',
                    ];
                    header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
                    readfile($filePath);
                    exit;
                }
                // Fallback: serve frontend index.html for root requests
                if ($request->uri === '/') {
                    $indexPath = $frontendDir . '/index.html';
                    if (file_exists($indexPath)) {
                        header('Content-Type: text/html; charset=UTF-8');
                        readfile($indexPath);
                        exit;
                    }
                }
            }
        }

        Response::error('Not found', 404);
    }
}
