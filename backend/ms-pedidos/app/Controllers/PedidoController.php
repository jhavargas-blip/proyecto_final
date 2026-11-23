<?php

namespace App\Controllers;

use App\Models\Pedido;
use App\Models\DetallePedido;
use App\Models\Mesa;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PedidoController
{
    public function getAll(): Collection
    {
        return Pedido::with(['detalles' => function ($q) {
            $q->orderBy('created_at');
        }])->orderBy('fecha', 'desc')->orderBy('hora', 'desc')->get();
    }

    public function getById(int $id): Pedido
    {
        return Pedido::with('detalles')->findOrFail($id);
    }

    public function search(array $filters): Collection
    {
        $query = Pedido::with('detalles');

        if (!empty($filters['estado'])) {
            $query->where('estado', $filters['estado']);
        }

        if (!empty($filters['mesa_id'])) {
            $query->where('mesa_id', $filters['mesa_id']);
        }

        if (!empty($filters['fecha'])) {
            $query->where('fecha', $filters['fecha']);
        }

        return $query->orderBy('fecha', 'desc')->orderBy('hora', 'desc')->get();
    }

    public function create(array $data): Pedido
    {
        $this->validatePedidoData($data);

        return DB::transaction(function () use ($data) {
            $mesa = Mesa::findOrFail($data['mesa_id']);
            
            if ($mesa->estado === 'disponible') {
                throw new Exception("No se puede crear pedido para una mesa disponible. Cambie el estado a 'ocupada' o 'reservada'");
            }

            $pedido = new Pedido();
            $pedido->mesa_id = $data['mesa_id'];
            $pedido->fecha = $data['fecha'] ?? date('Y-m-d');
            $pedido->hora = $data['hora'] ?? date('H:i:s');
            $pedido->subtotal = 0;
            $pedido->total = 0;
            $pedido->estado = 'pendiente';
            $pedido->save();

            if (!empty($data['productos']) && is_array($data['productos'])) {
                foreach ($data['productos'] as $item) {
                    $this->addProducto($pedido->id, $item);
                }
            }

            $this->recalculate($pedido);
            
            return $pedido->load('detalles');
        });
    }

    public function update(int $id, array $data): Pedido
    {
        $pedido = Pedido::findOrFail($id);

        if (in_array($pedido->estado, ['entregado', 'pagado', 'cancelado'])) {
            throw new Exception("No se puede modificar un pedido en estado {$pedido->estado}");
        }

        if (isset($data['mesa_id']) && $data['mesa_id'] != $pedido->mesa_id) {
            $mesa = Mesa::findOrFail($data['mesa_id']);
            if ($mesa->estado === 'disponible') {
                throw new Exception("No se puede asignar pedido a una mesa disponible");
            }
            $pedido->mesa_id = $data['mesa_id'];
        }

        if (isset($data['fecha'])) {
            $pedido->fecha = $data['fecha'];
        }
        if (isset($data['hora'])) {
            $pedido->hora = $data['hora'];
        }
        if (isset($data['estado'])) {
            $estadosValidos = ['pendiente', 'en_preparacion', 'entregado', 'pagado', 'cancelado'];
            if (!in_array($data['estado'], $estadosValidos)) {
                throw new Exception("Estado inválido. Valores: " . implode(', ', $estadosValidos));
            }
            $pedido->estado = $data['estado'];
        }

        $pedido->save();
        return $pedido->load('detalles');
    }

    public function changeState(int $id, string $estado): Pedido
    {
        $estadosValidos = ['pendiente', 'en_preparacion', 'entregado', 'pagado', 'cancelado'];
        if (!in_array($estado, $estadosValidos)) {
            throw new Exception("Estado inválido. Valores: " . implode(', ', $estadosValidos));
        }

        $pedido = Pedido::findOrFail($id);
        
        if ($pedido->estado === 'cancelado' && $estado !== 'cancelado') {
            throw new Exception("No se puede cambiar estado de un pedido cancelado");
        }
        if ($pedido->estado === 'pagado' && $estado !== 'pagado') {
            throw new Exception("No se puede cambiar estado de un pedido pagado");
        }

        $pedido->estado = $estado;
        $pedido->save();
        
        if ($estado === 'cancelado') {
            $mesa = Mesa::find($pedido->mesa_id);
            if ($mesa) {
                $otrosPedidos = Pedido::where('mesa_id', $mesa->id)
                    ->where('estado', 'not in', ['cancelado', 'pagado', 'entregado'])
                    ->where('id', '!=', $id)
                    ->exists();
                if (!$otrosPedidos) {
                    $mesa->estado = 'disponible';
                    $mesa->save();
                }
            }
        }

        return $pedido->load('detalles');
    }

    public function addProducto(int $pedidoId, array $data): DetallePedido
    {
        $pedido = Pedido::findOrFail($pedidoId);

        if (in_array($pedido->estado, ['entregado', 'pagado', 'cancelado'])) {
            throw new Exception("No se pueden agregar productos a un pedido en estado {$pedido->estado}");
        }

        if (!isset($data['producto_id']) || !isset($data['nombre_producto']) || !isset($data['cantidad']) || !isset($data['precio_unitario'])) {
            throw new Exception("Campos requeridos: producto_id, nombre_producto, cantidad, precio_unitario");
        }

        if ($data['cantidad'] < 1) {
            throw new Exception("La cantidad debe ser mayor o igual a 1");
        }

        $existing = DetallePedido::where('pedido_id', $pedidoId)
            ->where('producto_id', $data['producto_id'])
            ->first();

        if ($existing) {
            $existing->cantidad += $data['cantidad'];
            $existing->subtotal = $existing->cantidad * $existing->precio_unitario;
            $existing->save();
            $detalle = $existing;
        } else {
            $detalle = new DetallePedido();
            $detalle->pedido_id = $pedidoId;
            $detalle->producto_id = $data['producto_id'];
            $detalle->nombre_producto = $data['nombre_producto'];
            $detalle->cantidad = $data['cantidad'];
            $detalle->precio_unitario = $data['precio_unitario'];
            $detalle->subtotal = $data['cantidad'] * $data['precio_unitario'];
            $detalle->save();
        }

        $this->recalculate($pedido);

        return $detalle;
    }

    public function updateDetalle(int $pedidoId, int $detalleId, array $data): DetallePedido
    {
        $pedido = Pedido::findOrFail($pedidoId);

        if (in_array($pedido->estado, ['entregado', 'pagado', 'cancelado'])) {
            throw new Exception("No se pueden modificar productos en un pedido {$pedido->estado}");
        }

        $detalle = DetallePedido::where('pedido_id', $pedidoId)
            ->where('id', $detalleId)
            ->firstOrFail();

        if (isset($data['cantidad'])) {
            if ($data['cantidad'] < 1) {
                throw new Exception("La cantidad debe ser mayor o igual a 1");
            }
            $detalle->cantidad = $data['cantidad'];
            $detalle->subtotal = $detalle->cantidad * $detalle->precio_unitario;
            $detalle->save();
        }

        $this->recalculate($pedido);

        return $detalle->fresh();
    }

    public function removeDetalle(int $pedidoId, int $detalleId): bool
    {
        $pedido = Pedido::findOrFail($pedidoId);

        if (in_array($pedido->estado, ['entregado', 'pagado', 'cancelado'])) {
            throw new Exception("No se pueden quitar productos de un pedido {$pedido->estado}");
        }

        $detalle = DetallePedido::where('pedido_id', $pedidoId)
            ->where('id', $detalleId)
            ->firstOrFail();

        $detalle->delete();

        $this->recalculate($pedido);

        return true;
    }

    public function delete(int $id): Pedido
    {
        $pedido = Pedido::findOrFail($id);
        $pedido->delete();
        return $pedido;
    }

    private function recalculate(Pedido $pedido): void
    {
        $pedido->load('detalles');
        $subtotal = $pedido->detalles->sum('subtotal');
        $pedido->subtotal = $subtotal;
        $pedido->total = $subtotal; // sin impuestos por ahora
        $pedido->save();
    }

    private function validatePedidoData(array $data): void
    {
        if (!isset($data['mesa_id']) || empty($data['mesa_id'])) {
            throw new Exception("El campo mesa_id es requerido");
        }

        if (!isset($data['productos']) || !is_array($data['productos']) || count($data['productos']) === 0) {
            throw new Exception("El pedido debe tener al menos un producto");
        }

        foreach ($data['productos'] as $item) {
            if (!isset($item['producto_id']) || !isset($item['nombre_producto']) || !isset($item['cantidad']) || !isset($item['precio_unitario'])) {
                throw new Exception("Cada producto requiere: producto_id, nombre_producto, cantidad, precio_unitario");
            }
            if ($item['cantidad'] < 1) {
                throw new Exception("La cantidad debe ser mayor o igual a 1");
            }
            if ($item['precio_unitario'] <= 0) {
                throw new Exception("El precio unitario debe ser mayor a cero");
            }
        }
    }
}