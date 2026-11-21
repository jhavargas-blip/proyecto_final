<?php

namespace App\Presentation\Repositories;

use App\Controllers\ReservaController;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class ReservaRepository
{
    private ReservaController $controller;

    public function __construct()
    {
        $this->controller = new ReservaController();
    }

    public function all(Request $request, Response $response, $args): Response
    {
        $rows = $this->controller->getAll();
        $response->getBody()->write($rows->toJson());
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function get(Request $request, Response $response, $args): Response
    {
        try {
            $row = $this->controller->getById((int)$args['id']);
            $response->getBody()->write($row->toJson());
            return $response->withHeader('Content-Type', 'application/json');
        } catch (ModelNotFoundException $e) {
            $response->getBody()->write(json_encode(['error' => 'Reserva no encontrada']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
    }

    public function search(Request $request, Response $response, $args): Response
    {
        $filters = $request->getQueryParams();
        $rows = $this->controller->search($filters);
        $response->getBody()->write($rows->toJson());
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function create(Request $request, Response $response, $args): Response
    {
        try {
            $data = $request->getParsedBody();
            $row = $this->controller->create($data);
            $response->getBody()->write($row->toJson());
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function update(Request $request, Response $response, $args): Response
    {
        try {
            $data = $request->getParsedBody();
            $row = $this->controller->update((int)$args['id'], $data);
            $response->getBody()->write($row->toJson());
            return $response->withHeader('Content-Type', 'application/json');
        } catch (ModelNotFoundException $e) {
            $response->getBody()->write(json_encode(['error' => 'Reserva no encontrada']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function cancel(Request $request, Response $response, $args): Response
    {
        try {
            $row = $this->controller->cancel((int)$args['id']);
            $response->getBody()->write($row->toJson());
            return $response->withHeader('Content-Type', 'application/json');
        } catch (ModelNotFoundException $e) {
            $response->getBody()->write(json_encode(['error' => 'Reserva no encontrada']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function delete(Request $request, Response $response, $args): Response
    {
        try {
            $row = $this->controller->delete((int)$args['id']);
            $response->getBody()->write($row->toJson());
            return $response->withHeader('Content-Type', 'application/json');
        } catch (ModelNotFoundException $e) {
            $response->getBody()->write(json_encode(['error' => 'Reserva no encontrada']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
    }
}