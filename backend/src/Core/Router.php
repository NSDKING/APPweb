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
        Response::error('Not found', 404);
    }
}
