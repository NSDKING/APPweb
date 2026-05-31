<?php
namespace Controllers;

use Core\Request;
use Core\Response;
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
        Response::success($this->model->all());
    }
}
