<?php

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\Factory\AppFactory;

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../app/global/database_config.php';

$cors = require __DIR__ . '/../app/Middlewares/cors.php';
$routes = require __DIR__ . '/../app/Presentation/Routers/endpoints.php';

$app = AppFactory::create();

$cors($app);

// Cargar rutas
$routes($app);

$app->run();