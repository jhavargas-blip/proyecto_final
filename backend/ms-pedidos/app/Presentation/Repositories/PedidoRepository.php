<?php

namespace App\Presentation\Repositories;

use App\Controllers\PedidoController;
use Exception;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class PedidoRepository
{
    private PedidoController $controller;

    public function __construct()
    {
        $this->controller = new PedidoController();
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
            $response->getBody()->write(json_encode(['error' => 'Pedido no encontrado']));
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
            $response->getBody()->write(json_encode(['error' => 'Pedido no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function changeState(Request $request, Response $response, $args): Response
    {
        try {
            $data = $request->getParsedBody();
            if (!isset($data['estado'])) {
                $response->getBody()->write(json_encode(['error' => 'El campo estado es requerido']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            $row = $this->controller->changeState((int)$args['id'], $data['estado']);
            $response->getBody()->write($row->toJson());
            return $response->withHeader('Content-Type', 'application/json');
        } catch (ModelNotFoundException $e) {
            $response->getBody()->write(json_encode(['error' => 'Pedido no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function addProducto(Request $request, Response $response, $args): Response
    {
        try {
            $data = $request->getParsedBody();
            $row = $this->controller->addProducto((int)$args['id'], $data);
            $response->getBody()->write($row->toJson());
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        } catch (ModelNotFoundException $e) {
            $response->getBody()->write(json_encode(['error' => 'Pedido no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function updateDetalle(Request $request, Response $response, $args): Response
    {
        try {
            $data = $request->getParsedBody();
            $row = $this->controller->updateDetalle((int)$args['id'], (int)$args['detalle_id'], $data);
            $response->getBody()->write($row->toJson());
            return $response->withHeader('Content-Type', 'application/json');
        } catch (ModelNotFoundException $e) {
            $response->getBody()->write(json_encode(['error' => 'Pedido o detalle no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }
    }

    public function removeDetalle(Request $request, Response $response, $args): Response
    {
        try {
            $result = $this->controller->removeDetalle((int)$args['id'], (int)$args['detalle_id']);
            $response->getBody()->write(json_encode(['success' => $result, 'message' => 'Producto eliminado del pedido']));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (ModelNotFoundException $e) {
            $response->getBody()->write(json_encode(['error' => 'Pedido o detalle no encontrado']));
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
            $response->getBody()->write(json_encode(['error' => 'Pedido no encontrado']));
            return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
        }
    }
}