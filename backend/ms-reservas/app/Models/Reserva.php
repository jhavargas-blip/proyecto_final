<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reserva extends Model
{
    protected $table = 'reservas';
    protected $primaryKey = 'id';
    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'nombre_cliente', 'telefono_cliente', 'cantidad_personas',
        'fecha', 'hora', 'observaciones', 'estado', 'mesa_id'
    ];

    protected $casts = [
        'cantidad_personas' => 'integer',
        'fecha' => 'date',
        'hora' => 'time',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function mesa()
    {
        return $this->belongsTo(Mesa::class, 'mesa_id');
    }
}