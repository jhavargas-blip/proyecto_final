# ms-reservas - Microservicio de Mesas y Reservas

## Base URL
```
http://localhost/proyecto_final/backend/ms-reservas/public
```

## Endpoints

### Health Check
```http
GET /health
```
**Response:** `200 OK`
```json
{
  "status": "ok",
  "service": "ms-reservas"
}
```

---

## MESAS

### Listar todas
```http
GET /mesas
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "numero": "MESA-1",
    "capacidad": 2,
    "estado": "disponible",
    "created_at": "2026-11-17T10:00:00",
    "updated_at": "2026-11-17T10:00:00"
  }
]
```

### Obtener una mesa
```http
GET /mesas/{id}
Authorization: Bearer {token}
```

### Crear mesa
```http
POST /mesas
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "numero": "MESA-5",
  "capacidad": 4,
  "estado": "disponible"
}
```

**Validaciones:**
- `numero` único
- `capacidad` > 0

### Actualizar mesa
```http
PUT /mesas/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "capacidad": 6,
  "estado": "disponible"
}
```

### Cambiar estado de mesa
```http
PATCH /mesas/{id}/estado
Authorization: Bearer {token}
Content-Type: application/json
```

**Estados válidos:** `disponible`, `reservada`, `ocupada`, `fuera_servicio`

```json
{
  "estado": "fuera_servicio"
}
```

### Eliminar mesa
```http
DELETE /mesas/{id}
Authorization: Bearer {token}
```

---

## RESERVAS

### Listar todas
```http
GET /reservas
Authorization: Bearer {token}
```

### Buscar reservas
```http
GET /reservas/buscar?fecha=2026-06-10&nombre_cliente=Carlos&estado=confirmada
Authorization: Bearer {token}
```

**Parámetros opcionales:**
- `fecha` (YYYY-MM-DD)
- `nombre_cliente` (búsqueda parcial)
- `estado` (pendiente|confirmada|cancelada|finalizada)

### Obtener una reserva
```http
GET /reservas/{id}
Authorization: Bearer {token}
```

### Crear reserva
```http
POST /reservas
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "nombre_cliente": "Juan Perez",
  "telefono_cliente": "3001112233",
  "cantidad_personas": 4,
  "fecha": "2026-06-15",
  "hora": "20:00:00",
  "mesa_id": 2,
  "observaciones": "Cumpleaños"
}
```

**Validaciones:**
- Fecha no pasada
- Mesa no está `fuera_servicio`
- Capacidad mesa >= personas
- No doble reserva misma mesa/fecha/hora
- Estados: `pendiente` (default)

### Actualizar reserva
```http
PUT /reservas/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "fecha": "2026-06-16",
  "hora": "21:00:00",
  "mesa_id": 3,
  "cantidad_personas": 2,
  "observaciones": "Cambio de mesa",
  "estado": "confirmada"
}
```

**Estados válidos:** `pendiente`, `confirmada`, `cancelada`, `finalizada`
*No se puede modificar si está `finalizada` o `cancelada`*

### Cancelar reserva
```http
PATCH /reservas/{id}/cancelar
Authorization: Bearer {token}
```

*Libera la mesa si no hay otras reservas activas*

### Eliminar reserva
```http
DELETE /reservas/{id}
Authorization: Bearer {token}
```

---

## Datos de Prueba

### Mesas
| ID | Número | Capacidad | Estado |
|----|--------|-----------|--------|
| 1 | MESA-1 | 2 | disponible |
| 2 | MESA-2 | 4 | disponible |
| 3 | MESA-3 | 6 | disponible |
| 4 | MESA-4 | 8 | disponible |

### Reservas
| ID | Cliente | Teléfono | Personas | Fecha | Hora | Mesa | Estado |
|----|---------|----------|----------|-------|------|------|--------|
| 1 | Carlos Ramirez | 3001234567 | 4 | 2026-06-10 | 19:00 | MESA-2 | confirmada |

---

## Base de Datos
- **Database:** `ms_reservas_db`
- **Tablas:** `mesas`, `reservas`

---

## Ejemplos cURL

```bash
# Listar mesas
curl -X GET http://localhost/proyecto_final/backend/ms-reservas/public/mesas \
  -H "Authorization: Bearer TU_TOKEN"

# Crear mesa
curl -X POST http://localhost/proyecto_final/backend/ms-reservas/public/mesas \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"numero":"MESA-5","capacidad":6}'

# Buscar reservas por fecha
curl -X GET "http://localhost/proyecto_final/backend/ms-reservas/public/reservas/buscar?fecha=2026-06-10" \
  -H "Authorization: Bearer TU_TOKEN"

# Crear reserva
curl -X POST http://localhost/proyecto_final/backend/ms-reservas/public/reservas \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre_cliente":"Ana Gomez","telefono_cliente":"3009998877","cantidad_personas":2,"fecha":"2026-06-20","hora":"19:30:00","mesa_id":1}'

# Cancelar reserva
curl -X PATCH http://localhost/proyecto_final/backend/ms-reservas/public/reservas/1/cancelar \
  -H "Authorization: Bearer TU_TOKEN"
```