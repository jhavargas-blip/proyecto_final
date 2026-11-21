<?php

namespace App\Controllers;

use App\Models\Reserva;
use App\Models\Mesa;
use Exception;
use Illuminate\Database\Eloquent\Collection;
use Carbon\Carbon;

class ReservaController
{
    public function getAll(): Collection
    {
        return Reserva::with('mesa')->orderBy('fecha')->orderBy('hora')->get();
    }

    public function getById(int $id): Reserva
    {
        return Reserva::with('mesa')->findOrFail($id);
    }

    public function search(array $filters): Collection
    {
        $query = Reserva::with('mesa');
        
        if (!empty($filters['fecha'])) {
            $query->where('fecha', $filters['fecha']);
        }
        if (!empty($filters['nombre_cliente'])) {
            $query->where('nombre_cliente', 'like', "%{$filters['nombre_cliente']}%");
        }
        if (!empty($filters['estado'])) {
            $query->where('estado', $filters['estado']);
        }
        
        return $query->orderBy('fecha')->orderBy('hora')->get();
    }

    public function create(array $data): Reserva
    {
        $this->validateReservaData($data);
        
        $mesa = Mesa::findOrFail($data['mesa_id']);
        
        if ($mesa->estado === 'fuera_servicio') {
            throw new Exception("No se puede reservar una mesa fuera de servicio");
        }
        
        if ($data['cantidad_personas'] > $mesa->capacidad) {
            throw new Exception("La cantidad de personas ({$data['cantidad_personas']}) excede la capacidad de la mesa ({$mesa->capacidad})");
        }
        
        $fechaReserva = Carbon::parse($data['fecha']);
        if ($fechaReserva->lt(Carbon::today())) {
            throw new Exception("No se permiten reservas en fechas pasadas");
        }
        
        $conflicto = Reserva::where('mesa_id', $data['mesa_id'])
            ->where('fecha', $data['fecha'])
            ->where('hora', $data['hora'])
            ->where('estado', '!=', 'cancelada')
            ->exists();
            
        if ($conflicto) {
            throw new Exception("La mesa ya tiene una reserva para esa fecha y hora");
        }

        $reserva = new Reserva();
        $reserva->nombre_cliente = $data['nombre_cliente'];
        $reserva->telefono_cliente = $data['telefono_cliente'];
        $reserva->cantidad_personas = $data['cantidad_personas'];
        $reserva->fecha = $data['fecha'];
        $reserva->hora = $data['hora'];
        $reserva->observaciones = $data['observaciones'] ?? null;
        $reserva->estado = 'pendiente';
        $reserva->mesa_id = $data['mesa_id'];
        $reserva->save();
        
        $mesa->estado = 'reservada';
        $mesa->save();
        
        return $reserva->load('mesa');
    }

    public function update(int $id, array $data): Reserva
    {
        $reserva = Reserva::findOrFail($id);
        
        if (in_array($reserva->estado, ['finalizada', 'cancelada'])) {
            throw new Exception("No se puede modificar una reserva {$reserva->estado}");
        }
        
        if (isset($data['fecha'])) {
            $fechaReserva = Carbon::parse($data['fecha']);
            if ($fechaReserva->lt(Carbon::today())) {
                throw new Exception("No se permiten reservas en fechas pasadas");
            }
        }
        
        $mesaId = $data['mesa_id'] ?? $reserva->mesa_id;
        $fecha = $data['fecha'] ?? $reserva->fecha;
        $hora = $data['hora'] ?? $reserva->hora;
        
        if ($mesaId != $reserva->mesa_id || $fecha != $reserva->fecha || $hora != $reserva->hora) {
            $conflicto = Reserva::where('mesa_id', $mesaId)
                ->where('fecha', $fecha)
                ->where('hora', $hora)
                ->where('estado', '!=', 'cancelada')
                ->where('id', '!=', $id)
                ->exists();
                
            if ($conflicto) {
                throw new Exception("La mesa ya tiene una reserva para esa fecha y hora");
            }
        }
        
        if (isset($data['mesa_id']) && $data['mesa_id'] != $reserva->mesa_id) {
            $mesaNueva = Mesa::findOrFail($data['mesa_id']);
            if ($mesaNueva->estado === 'fuera_servicio') {
                throw new Exception("No se puede asignar una mesa fuera de servicio");
            }
            $cantidad = $data['cantidad_personas'] ?? $reserva->cantidad_personas;
            if ($cantidad > $mesaNueva->capacidad) {
                throw new Exception("La cantidad de personas excede la capacidad de la mesa");
            }
        } elseif (isset($data['cantidad_personas'])) {
            $mesaActual = Mesa::find($reserva->mesa_id);
            if ($data['cantidad_personas'] > $mesaActual->capacidad) {
                throw new Exception("La cantidad de personas excede la capacidad de la mesa");
            }
        }
        
        $reserva->nombre_cliente = $data['nombre_cliente'] ?? $reserva->nombre_cliente;
        $reserva->telefono_cliente = $data['telefono_cliente'] ?? $reserva->telefono_cliente;
        $reserva->cantidad_personas = $data['cantidad_personas'] ?? $reserva->cantidad_personas;
        $reserva->fecha = $data['fecha'] ?? $reserva->fecha;
        $reserva->hora = $data['hora'] ?? $reserva->hora;
        $reserva->observaciones = $data['observaciones'] ?? $reserva->observaciones;
        $reserva->estado = $data['estado'] ?? $reserva->estado;
        $reserva->mesa_id = $data['mesa_id'] ?? $reserva->mesa_id;
        $reserva->save();
        
        return $reserva->load('mesa');
    }

    public function cancel(int $id): Reserva
    {
        $reserva = Reserva::findOrFail($id);
        
        if ($reserva->estado === 'cancelada') {
            throw new Exception("La reserva ya está cancelada");
        }
        if ($reserva->estado === 'finalizada') {
            throw new Exception("No se puede cancelar una reserva finalizada");
        }
        
        $reserva->estado = 'cancelada';
        $reserva->save();
        
        $mesa = Mesa::find($reserva->mesa_id);
        if ($mesa) {
            $otrasReservas = Reserva::where('mesa_id', $mesa->id)
                ->where('estado', '!=', 'cancelada')
                ->where('id', '!=', $id)
                ->exists();
            if (!$otrasReservas) {
                $mesa->estado = 'disponible';
                $mesa->save();
            }
        }
        
        return $reserva->load('mesa');
    }

    public function delete(int $id): Reserva
    {
        $reserva = Reserva::findOrFail($id);
        $reserva->delete();
        return $reserva;
    }

    private function validateReservaData(array $data): void
    {
        $required = ['nombre_cliente', 'telefono_cliente', 'cantidad_personas', 'fecha', 'hora', 'mesa_id'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || $data[$field] === '') {
                throw new Exception("El campo {$field} es requerido");
            }
        }
        
        if ($data['cantidad_personas'] <= 0) {
            throw new Exception("La cantidad de personas debe ser mayor a cero");
        }
    }
}