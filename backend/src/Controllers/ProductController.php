<?php
namespace Controllers;

use Core\Request;
use Core\Response;
use Models\Product;

class ProductController
{
    private Product $product;

    public function __construct()
    {
        $this->product = new Product();
    }

    public function index(Request $request): void
    {
        $filters = array_filter([
            'brand'  => $request->input('brand'),
            'gender' => $request->input('gender'),
            'type'   => $request->input('type'),
            'search' => $request->input('search'),
        ]);

        $products = $this->product->all($filters);
        Response::success($products);
    }

    public function show(Request $request, string $id): void
    {
        $product = $this->product->find((int)$id);

        if (!$product) {
            Response::error('Product not found', 404);
            return;
        }

        Response::success($product);
    }
}
