<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    protected $table = 'usuarios';
    protected $primaryKey = 'id';
    public $timestamps = true;
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';

    protected $fillable = [
        'nombre', 'correo', 'usuario', 'contrasena', 'rol', 
        'token', 'sesion_activa', 'estado'
    ];

    protected $hidden = ['contrasena', 'token'];

    protected $casts = [
        'sesion_activa' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}