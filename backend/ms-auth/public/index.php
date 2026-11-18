<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/global/database_config.php';

$cors = require __DIR__ . '/../app/Middlewares/cors.php';

$app = AppFactory::create();

$cors($app);

// Rutas se cargarán aquí
// $auth_routers = require __DIR__ . '/../app/Presentation/Routers/endpoints.php';
// $auth_routers($app);

$app->get('/health', function (Request $request, Response $response, $args) {
    $response->getBody()->write(json_encode(['status' => 'ok', 'service' => 'ms-auth']));
    return $response->withHeader('Content-Type', 'application/json');
});

$app->run();