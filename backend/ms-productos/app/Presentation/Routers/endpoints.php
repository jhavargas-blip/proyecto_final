<?php

use App\Presentation\Repositories\CategoriaRepository;
use App\Presentation\Repositories\ProductoRepository;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function (App $app) {
    // Categorías
    $app->get('/categorias', [CategoriaRepository::class, 'all']);
    $app->get('/categorias/{id}', [CategoriaRepository::class, 'get']);
    $app->post('/categorias', [CategoriaRepository::class, 'create']);
    $app->put('/categorias/{id}', [CategoriaRepository::class, 'update']);
    $app->delete('/categorias/{id}', [CategoriaRepository::class, 'delete']);

    // Productos
    $app->get('/productos', [ProductoRepository::class, 'all']);
    $app->get('/productos/buscar', [ProductoRepository::class, 'search']);
    $app->get('/productos/{id}', [ProductoRepository::class, 'get']);
    $app->post('/productos', [ProductoRepository::class, 'create']);
    $app->put('/productos/{id}', [ProductoRepository::class, 'update']);
    $app->delete('/productos/{id}', [ProductoRepository::class, 'delete']);

    // Health check
    $app->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['status' => 'ok', 'service' => 'ms-productos']));
        return $response->withHeader('Content-Type', 'application/json');
    });
};