<?php

namespace App\Controllers;

use App\Models\User;
use Exception;
use Illuminate\Support\Str;

class AuthController
{
    public function login(string $identifier, string $password): array
    {
        $user = User::where(function ($query) use ($identifier) {
                $query->where('usuario', $identifier)
                      ->orWhere('correo', $identifier);
            })
            ->where('estado', 'activo')
            ->first();

        if (!$user || $user->contrasena !== $password) {
            throw new Exception('Credenciales inválidas');
        }

        $token = Str::random(60);
        $user->token = $token;
        $user->sesion_activa = true;
        $user->save();

        return [
            'id' => $user->id,
            'nombre' => $user->nombre,
            'correo' => $user->correo,
            'usuario' => $user->usuario,
            'rol' => $user->rol,
            'token' => $token
        ];
    }

    public function logout(string $token): bool
    {
        $user = User::where('token', $token)->first();
        if ($user) {
            $user->token = null;
            $user->sesion_activa = false;
            $user->save();
            return true;
        }
        return false;
    }

    public function validate(string $token): array
    {
        $user = User::where('token', $token)
            ->where('sesion_activa', true)
            ->where('estado', 'activo')
            ->first();

        if (!$user) {
            throw new Exception('Token inválido o expirado');
        }

        return [
            'valid' => true,
            'user' => [
                'id' => $user->id,
                'nombre' => $user->nombre,
                'correo' => $user->correo,
                'usuario' => $user->usuario,
                'rol' => $user->rol
            ]
        ];
    }

    public function me(string $token): array
    {
        return $this->validate($token);
    }
}