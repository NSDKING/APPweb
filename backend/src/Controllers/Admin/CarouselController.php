<?php
namespace Controllers\Admin;

use Core\Request;
use Core\Response;
use Middleware\AdminMiddleware;
use Models\CarouselSlide;

class CarouselController
{
    private CarouselSlide $model;

    public function __construct()
    {
        $this->model = new CarouselSlide();
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

        if (empty($data['title'])) {
            Response::error('title is required', 422);
            return;
        }

        $id    = $this->model->create($data);
        $slide = $this->model->find($id);
        Response::success($slide, 'Slide created', 201);
    }

    public function update(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);

        if (!$this->model->find($id)) {
            Response::error('Slide not found', 404);
            return;
        }

        $data = $request->json();
        if (empty($data['title'])) {
            Response::error('title is required', 422);
            return;
        }

        $this->model->update($id, $data);
        Response::success($this->model->find($id), 'Slide updated');
    }

    public function destroy(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);

        if (!$this->model->find($id)) {
            Response::error('Slide not found', 404);
            return;
        }

        $this->model->delete($id);
        Response::success(null, 'Slide deleted');
    }

    public function move(Request $request, int $id): void
    {
        AdminMiddleware::handle($request);
        $data = $request->json();
        $direction = $data['direction'] ?? '';

        if (!in_array($direction, ['up', 'down'])) {
            Response::error('direction must be up or down', 422);
            return;
        }

        $this->model->move($id, $direction);
        Response::success($this->model->all(), 'Slide moved');
    }
}
