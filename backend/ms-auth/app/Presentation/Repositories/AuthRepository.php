<?php

namespace App\Presentation\Repositories;

use App\Controllers\AuthController;
use Exception;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

class AuthRepository
{
    private AuthController $controller;

    public function __construct()
    {
        $this->controller = new AuthController();
    }

    public function login(Request $request, Response $response, $args): Response
    {
        $data = $request->getParsedBody();
        
        if (!isset($data['identifier']) || !isset($data['password'])) {
            $response->getBody()->write(json_encode(['error' => 'Usuario/correo y contraseña requeridos']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $result = $this->controller->login($data['identifier'], $data['password']);
            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['error' => $e->getMessage()]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }

    public function logout(Request $request, Response $response, $args): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        $token = str_replace('Bearer ', '', $authHeader);

        if (empty($token)) {
            $response->getBody()->write(json_encode(['error' => 'Token requerido']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        $result = $this->controller->logout($token);
        $response->getBody()->write(json_encode(['message' => 'Sesión cerrada correctamente']));
        return $response->withHeader('Content-Type', 'application/json');
    }

    public function validate(Request $request, Response $response, $args): Response
    {
        $authHeader = $request->getHeaderLine('Authorization');
        $token = str_replace('Bearer ', '', $authHeader);

        if (empty($token)) {
            $response->getBody()->write(json_encode(['valid' => false, 'error' => 'Token requerido']));
            return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
        }

        try {
            $result = $this->controller->validate($token);
            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json');
        } catch (Exception $e) {
            $response->getBody()->write(json_encode(['valid' => false, 'error' => $e->getMessage()]));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }
    }

    public function me(Request $request, Response $response, $args): Response
    {
        $user = $request->getAttribute('user');
        
        if (!$user) {
            $response->getBody()->write(json_encode(['error' => 'No autenticado']));
            return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
        }

        $response->getBody()->write(json_encode(['user' => $user]));
        return $response->withHeader('Content-Type', 'application/json');
    }
}