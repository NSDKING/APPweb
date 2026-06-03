<?php
namespace Controllers\Admin;

use Core\Request;
use Core\Response;
use Middleware\AdminMiddleware;
use Models\Product;

class ProductController
{
    private Product $model;

    public function __construct()
    {
        $this->model = new Product();
    }

    public function index(Request $request): void
    {
        AdminMiddleware::handle($request);
        Response::success($this->model->all());
    }

    public function store(Request $request): void
    {
        AdminMiddleware::handle($request);
        $data = $request->json();

        if (empty($data['name']) || empty($data['price'])) {
            Response::error('name and price are required', 422);
            return;
        }

        $id      = $this->model->create($data);
        $product = $this->model->find($id);
        Response::success($product, 'Product created', 201);
    }

    public function update(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);
        $data = $request->json();

        if (!$this->model->find($id)) {
            Response::error('Product not found', 404);
            return;
        }

        $this->model->update($id, $data);
        Response::success($this->model->find($id), 'Product updated');
    }

    public function destroy(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);

        if (!$this->model->find($id)) {
            Response::error('Product not found', 404);
            return;
        }

        $this->model->delete($id);
        Response::success(null, 'Product deleted');
    }
}
