<?php
declare(strict_types=1);
ini_set('display_errors', '0');
ini_set('html_errors', '0');
error_reporting(E_ALL);

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
$router->post('/api/auth/register',         [\Controllers\AuthController::class, 'register']);
$router->post('/api/auth/login',            [\Controllers\AuthController::class, 'login']);
$router->post('/api/auth/logout',           [\Controllers\AuthController::class, 'logout']);
$router->post('/api/auth/forgot-password',  [\Controllers\AuthController::class, 'forgotPassword']);
$router->post('/api/auth/reset-password',   [\Controllers\AuthController::class, 'resetPassword']);

// Product routes
$router->get('/api/products',        [\Controllers\ProductController::class, 'index']);
$router->get('/api/products/{id}',   [\Controllers\ProductController::class, 'show']);

// Carousel routes (public)
$router->get('/api/carousel', [\Controllers\CarouselController::class, 'index']);

// Favourite routes
$router->get('/api/favourites',                [\Controllers\FavouriteController::class, 'index']);
$router->post('/api/favourites',               [\Controllers\FavouriteController::class, 'store']);
$router->delete('/api/favourites/{productId}', [\Controllers\FavouriteController::class, 'destroy']);

// Cart routes
$router->get('/api/cart',            [\Controllers\CartController::class, 'index']);
$router->post('/api/cart',           [\Controllers\CartController::class, 'add']);
$router->put('/api/cart/{id}',       [\Controllers\CartController::class, 'update']);
$router->delete('/api/cart/{id}',    [\Controllers\CartController::class, 'remove']);

// Order routes
$router->post('/api/orders',         [\Controllers\OrderController::class, 'store']);
$router->get('/api/orders',          [\Controllers\OrderController::class, 'index']);

// Admin routes
$router->get('/api/admin/products',           [\Controllers\Admin\ProductController::class, 'index']);
$router->post('/api/admin/products',          [\Controllers\Admin\ProductController::class, 'store']);
$router->put('/api/admin/products/{id}',      [\Controllers\Admin\ProductController::class, 'update']);
$router->delete('/api/admin/products/{id}',   [\Controllers\Admin\ProductController::class, 'destroy']);
$router->get('/api/admin/users',              [\Controllers\Admin\UserController::class, 'index']);
$router->put('/api/admin/users/{id}/role',    [\Controllers\Admin\UserController::class, 'setRole']);

// Admin carousel routes
$router->get('/api/admin/carousel',              [\Controllers\Admin\CarouselController::class, 'index']);
$router->post('/api/admin/carousel',             [\Controllers\Admin\CarouselController::class, 'store']);
$router->put('/api/admin/carousel/{id}',         [\Controllers\Admin\CarouselController::class, 'update']);
$router->delete('/api/admin/carousel/{id}',      [\Controllers\Admin\CarouselController::class, 'destroy']);
$router->put('/api/admin/carousel/{id}/move',    [\Controllers\Admin\CarouselController::class, 'move']);

// Review routes
$router->get('/api/products/{id}/reviews',    [\Controllers\ReviewController::class, 'index']);
$router->post('/api/products/{id}/reviews',   [\Controllers\ReviewController::class, 'store']);
$router->delete('/api/reviews/{id}',          [\Controllers\ReviewController::class, 'destroy']);

// Promo code routes
$router->post('/api/promo/validate',          [\Controllers\PromoCodeController::class, 'validate']);

// Message routes
$router->get('/api/messages',                 [\Controllers\MessageController::class, 'inbox']);
$router->get('/api/messages/sent',            [\Controllers\MessageController::class, 'sent']);
$router->get('/api/messages/{id}',            [\Controllers\MessageController::class, 'show']);
$router->post('/api/messages',                [\Controllers\MessageController::class, 'store']);
$router->put('/api/messages/{id}/read',       [\Controllers\MessageController::class, 'markRead']);

// Admin promo routes
$router->get('/api/admin/promo',              [\Controllers\Admin\PromoCodeController::class, 'index']);
$router->post('/api/admin/promo',             [\Controllers\Admin\PromoCodeController::class, 'store']);
$router->delete('/api/admin/promo/{id}',      [\Controllers\Admin\PromoCodeController::class, 'destroy']);
$router->put('/api/admin/promo/{id}/toggle',  [\Controllers\Admin\PromoCodeController::class, 'toggle']);

// Admin forum routes
$router->get('/api/admin/forum/categories',           [\Controllers\Admin\ForumController::class, 'categories']);
$router->post('/api/admin/forum/categories',          [\Controllers\Admin\ForumController::class, 'storeCategory']);
$router->delete('/api/admin/forum/categories/{id}',   [\Controllers\Admin\ForumController::class, 'destroyCategory']);
$router->get('/api/admin/forum/threads',              [\Controllers\Admin\ForumController::class, 'threads']);
$router->put('/api/admin/forum/threads/{id}/pin',     [\Controllers\Admin\ForumController::class, 'pin']);
$router->put('/api/admin/forum/threads/{id}/lock',    [\Controllers\Admin\ForumController::class, 'lock']);
$router->delete('/api/admin/forum/threads/{id}',      [\Controllers\Admin\ForumController::class, 'destroyThread']);
$router->delete('/api/admin/forum/posts/{id}',        [\Controllers\Admin\ForumController::class, 'destroyPost']);

$router->dispatch($request);
