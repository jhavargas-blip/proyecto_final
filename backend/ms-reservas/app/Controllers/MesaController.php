<?php

namespace App\Controllers;

use App\Models\Mesa;
use Exception;
use Illuminate\Database\Eloquent\Collection;

class MesaController
{
    public function getAll(): Collection
    {
        return Mesa::orderBy('numero')->get();
    }

    public function getById(int $id): Mesa
    {
        return Mesa::findOrFail($id);
    }

    public function create(array $data): Mesa
    {
        if (Mesa::where('numero', $data['numero'])->exists()) {
            throw new Exception("La mesa con número {$data['numero']} ya existe");
        }
        
        if (!isset($data['capacidad']) || $data['capacidad'] <= 0) {
            throw new Exception("La capacidad debe ser mayor a cero");
        }

        $mesa = new Mesa();
        $mesa->numero = $data['numero'];
        $mesa->capacidad = $data['capacidad'];
        $mesa->estado = $data['estado'] ?? 'disponible';
        $mesa->save();
        
        return $mesa;
    }

    public function update(int $id, array $data): Mesa
    {
        $mesa = Mesa::findOrFail($id);
        
        if (isset($data['numero']) && $data['numero'] !== $mesa->numero) {
            if (Mesa::where('numero', $data['numero'])->exists()) {
                throw new Exception("La mesa con número {$data['numero']} ya existe");
            }
            $mesa->numero = $data['numero'];
        }
        
        if (isset($data['capacidad'])) {
            if ($data['capacidad'] <= 0) {
                throw new Exception("La capacidad debe ser mayor a cero");
            }
            $mesa->capacidad = $data['capacidad'];
        }
        
        if (isset($data['estado'])) {
            $estadosValidos = ['disponible', 'reservada', 'ocupada', 'fuera_servicio'];
            if (!in_array($data['estado'], $estadosValidos)) {
                throw new Exception("Estado inválido. Valores: " . implode(', ', $estadosValidos));
            }
            $mesa->estado = $data['estado'];
        }
        
        $mesa->save();
        return $mesa;
    }

    public function changeState(int $id, string $estado): Mesa
    {
        $estadosValidos = ['disponible', 'reservada', 'ocupada', 'fuera_servicio'];
        if (!in_array($estado, $estadosValidos)) {
            throw new Exception("Estado inválido. Valores: " . implode(', ', $estadosValidos));
        }
        
        $mesa = Mesa::findOrFail($id);
        $mesa->estado = $estado;
        $mesa->save();
        return $mesa;
    }

    public function delete(int $id): Mesa
    {
        $mesa = Mesa::findOrFail($id);
        $mesa->delete();
        return $mesa;
    }
}