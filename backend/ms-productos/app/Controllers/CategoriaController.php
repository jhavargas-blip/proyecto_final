<?php

namespace App\Controllers;

use App\Models\Categoria;
use Exception;
use Illuminate\Database\Eloquent\Collection;

class CategoriaController
{
    public function getAll(): Collection
    {
        return Categoria::withCount('productos')->orderBy('nombre')->get();
    }

    public function getById(int $id): Categoria
    {
        return Categoria::with('productos')->findOrFail($id);
    }

    public function create(array $data): Categoria
    {
        if (!isset($data['nombre']) || trim($data['nombre']) === '') {
            throw new Exception("El nombre de la categoría es requerido");
        }

        if (Categoria::where('nombre', $data['nombre'])->exists()) {
            throw new Exception("La categoría {$data['nombre']} ya existe");
        }

        $categoria = new Categoria();
        $categoria->nombre = $data['nombre'];
        $categoria->descripcion = $data['descripcion'] ?? null;
        $categoria->save();

        return $categoria;
    }

    public function update(int $id, array $data): Categoria
    {
        $categoria = Categoria::findOrFail($id);

        if (isset($data['nombre']) && $data['nombre'] !== $categoria->nombre) {
            if (trim($data['nombre']) === '') {
                throw new Exception("El nombre no puede estar vacío");
            }
            if (Categoria::where('nombre', $data['nombre'])->exists()) {
                throw new Exception("La categoría {$data['nombre']} ya existe");
            }
            $categoria->nombre = $data['nombre'];
        }

        if (isset($data['descripcion'])) {
            $categoria->descripcion = $data['descripcion'];
        }

        $categoria->save();
        return $categoria;
    }

    public function delete(int $id): Categoria
    {
        $categoria = Categoria::findOrFail($id);

        if ($categoria->productos()->count() > 0) {
            throw new Exception("No se puede eliminar la categoría porque tiene productos asociados");
        }

        $categoria->delete();
        return $categoria;
    }
}