<?php

use App\Presentation\Repositories\PedidoRepository;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function (App $app) {
    // Pedidos
    $app->get('/pedidos', [PedidoRepository::class, 'all']);
    $app->get('/pedidos/buscar', [PedidoRepository::class, 'search']);
    $app->get('/pedidos/{id}', [PedidoRepository::class, 'get']);
    $app->post('/pedidos', [PedidoRepository::class, 'create']);
    $app->put('/pedidos/{id}', [PedidoRepository::class, 'update']);
    $app->patch('/pedidos/{id}/estado', [PedidoRepository::class, 'changeState']);
    $app->delete('/pedidos/{id}', [PedidoRepository::class, 'delete']);

    // Detalles de pedido (productos)
    $app->post('/pedidos/{id}/productos', [PedidoRepository::class, 'addProducto']);
    $app->put('/pedidos/{id}/productos/{detalle_id}', [PedidoRepository::class, 'updateDetalle']);
    $app->delete('/pedidos/{id}/productos/{detalle_id}', [PedidoRepository::class, 'removeDetalle']);

    // Health check
    $app->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['status' => 'ok', 'service' => 'ms-pedidos']));
        return $response->withHeader('Content-Type', 'application/json');
    });
};