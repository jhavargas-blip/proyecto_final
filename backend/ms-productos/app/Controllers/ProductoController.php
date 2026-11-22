<?php

namespace App\Controllers;

use App\Models\Producto;
use App\Models\Categoria;
use Exception;
use Illuminate\Database\Eloquent\Collection;

class ProductoController
{
    public function getAll(): Collection
    {
        return Producto::with('categoria')->orderBy('nombre')->get();
    }

    public function getById(int $id): Producto
    {
        return Producto::with('categoria')->findOrFail($id);
    }

    public function search(array $filters): Collection
    {
        $query = Producto::with('categoria');

        if (!empty($filters['categoria_id'])) {
            $query->where('categoria_id', $filters['categoria_id']);
        }

        if (isset($filters['disponible'])) {
            $disponible = filter_var($filters['disponible'], FILTER_VALIDATE_BOOLEAN);
            $query->where('disponible', $disponible);
        }

        if (!empty($filters['nombre'])) {
            $query->where('nombre', 'like', "%{$filters['nombre']}%");
        }

        return $query->orderBy('nombre')->get();
    }

    public function create(array $data): Producto
    {
        $this->validateProductoData($data);

        if (Producto::where('nombre', $data['nombre'])->exists()) {
            throw new Exception("El producto {$data['nombre']} ya existe");
        }

        Categoria::findOrFail($data['categoria_id']);

        $producto = new Producto();
        $producto->nombre = $data['nombre'];
        $producto->descripcion = $data['descripcion'] ?? null;
        $producto->precio = $data['precio'];
        $producto->disponible = $data['disponible'] ?? true;
        $producto->categoria_id = $data['categoria_id'];
        $producto->save();

        return $producto->load('categoria');
    }

    public function update(int $id, array $data): Producto
    {
        $producto = Producto::findOrFail($id);

        if (isset($data['nombre']) && $data['nombre'] !== $producto->nombre) {
            if (trim($data['nombre']) === '') {
                throw new Exception("El nombre no puede estar vacío");
            }
            if (Producto::where('nombre', $data['nombre'])->exists()) {
                throw new Exception("El producto {$data['nombre']} ya existe");
            }
            $producto->nombre = $data['nombre'];
        }

        if (isset($data['descripcion'])) {
            $producto->descripcion = $data['descripcion'];
        }

        if (isset($data['precio'])) {
            if ($data['precio'] <= 0) {
                throw new Exception("El precio debe ser mayor a cero");
            }
            $producto->precio = $data['precio'];
        }

        if (isset($data['disponible'])) {
            $producto->disponible = filter_var($data['disponible'], FILTER_VALIDATE_BOOLEAN);
        }

        if (isset($data['categoria_id'])) {
            Categoria::findOrFail($data['categoria_id']);
            $producto->categoria_id = $data['categoria_id'];
        }

        $producto->save();
        return $producto->load('categoria');
    }

    public function delete(int $id): Producto
    {
        $producto = Producto::findOrFail($id);
        $producto->delete();
        return $producto;
    }

    private function validateProductoData(array $data): void
    {
        $required = ['nombre', 'precio', 'categoria_id'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                throw new Exception("El campo {$field} es requerido");
            }
        }

        if ($data['precio'] <= 0) {
            throw new Exception("El precio debe ser mayor a cero");
        }
    }
}