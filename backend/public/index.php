<?php
declare(strict_types=1);

// Load .env
$env = parse_ini_file(dirname(__DIR__) . '/.env');
foreach ($env as $key => $value) {
    $_ENV[$key] = $value;
}

// Autoloader
spl_autoload_register(function (string $class): void {
    $base = dirname(__DIR__) . '/src/';
    $file = $base . str_replace('\\', '/', $class) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

// CORS headers
header('Access-Control-Allow-Origin: http://localhost');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

use Core\Router;
use Core\Request;
use Core\Response;

$router  = new Router();
$request = new Request();

// Health check
$router->get('/api/ping', function () {
    Response::success(['time' => date('c')], 'pong');
});

// Auth routes
$router->post('/api/auth/register', [\Controllers\AuthController::class, 'register']);
$router->post('/api/auth/login',    [\Controllers\AuthController::class, 'login']);
$router->post('/api/auth/logout',   [\Controllers\AuthController::class, 'logout']);

// Product routes
$router->get('/api/products',        [\Controllers\ProductController::class, 'index']);
$router->get('/api/products/{id}',   [\Controllers\ProductController::class, 'show']);

// Cart routes
$router->get('/api/cart',            [\Controllers\CartController::class, 'index']);
$router->post('/api/cart',           [\Controllers\CartController::class, 'add']);
$router->put('/api/cart/{id}',       [\Controllers\CartController::class, 'update']);
$router->delete('/api/cart/{id}',    [\Controllers\CartController::class, 'remove']);

// Order routes
$router->post('/api/orders',         [\Controllers\OrderController::class, 'store']);
$router->get('/api/orders',          [\Controllers\OrderController::class, 'index']);

$router->dispatch($request);
