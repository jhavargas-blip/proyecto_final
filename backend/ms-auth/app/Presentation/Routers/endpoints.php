<?php

use App\Presentation\Repositories\AuthRepository;
use App\Middlewares\AuthMiddleware;
use Slim\App;
use Slim\Routing\RouteCollectorProxy;

return function (App $app) {
    // Rutas públicas
    $app->post('/login', [AuthRepository::class, 'login']);
    
    // Rutas protegidas
    $app->group('', function (RouteCollectorProxy $group) {
        $group->post('/logout', [AuthRepository::class, 'logout']);
        $group->get('/validate', [AuthRepository::class, 'validate']);
        $group->get('/me', [AuthRepository::class, 'me']);
    })->add(AuthMiddleware::class);

    // Health check
    $app->get('/health', function ($request, $response) {
        $response->getBody()->write(json_encode(['status' => 'ok', 'service' => 'ms-auth']));
        return $response->withHeader('Content-Type', 'application/json');
    });
};