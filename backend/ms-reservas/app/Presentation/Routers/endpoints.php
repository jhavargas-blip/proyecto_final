<?php

use App\Presentation\Repositories\MesaRepository;
use App\Presentation\Repositories\ReservaRepository;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function (App $app) {
    // Mesas
    $app->get('/mesas', [MesaRepository::class, 'all']);
    $app->get('/mesas/{id}', [MesaRepository::class, 'get']);
    $app->post('/mesas', [MesaRepository::class, 'create']);
    $app->put('/mesas/{id}', [MesaRepository::class, 'update']);
    $app->patch('/mesas/{id}/estado', [MesaRepository::class, 'changeState']);
    $app->delete('/mesas/{id}', [MesaRepository::class, 'delete']);

    // Reservas
    $app->get('/reservas', [ReservaRepository::class, 'all']);
    $app->get('/reservas/buscar', [ReservaRepository::class, 'search']);
    $app->get('/reservas/{id}', [ReservaRepository::class, 'get']);
    $app->post('/reservas', [ReservaRepository::class, 'create']);
    $app->put('/reservas/{id}', [ReservaRepository::class, 'update']);
    $app->patch('/reservas/{id}/cancelar', [ReservaRepository::class, 'cancel']);
    $app->delete('/reservas/{id}', [ReservaRepository::class, 'delete']);

    // Health check
    $app->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['status' => 'ok', 'service' => 'ms-reservas']));
        return $response->withHeader('Content-Type', 'application/json');
    });
};