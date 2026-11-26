# ms-pedidos - Microservicio de Pedidos

## Base URL
```
http://localhost/proyecto_final/backend/ms-pedidos/public
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
  "service": "ms-pedidos"
}
```

---

## PEDIDOS

### Listar todos
```http
GET /pedidos
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "mesa_id": 1,
    "fecha": "2026-06-10",
    "hora": "20:00:00",
    "subtotal": "36000.00",
    "total": "36000.00",
    "estado": "pendiente",
    "created_at": "2026-11-17T10:00:00",
    "updated_at": "2026-11-17T10:00:00",
    "detalles": [
      {
        "id": 1,
        "pedido_id": 1,
        "producto_id": 1,
        "nombre_producto": "Hamburguesa Especial",
        "cantidad": 1,
        "precio_unitario": "28000.00",
        "subtotal": "28000.00"
      },
      {
        "id": 2,
        "pedido_id": 1,
        "producto_id": 2,
        "nombre_producto": "Limonada Natural",
        "cantidad": 1,
        "precio_unitario": "8000.00",
        "subtotal": "8000.00"
      }
    ]
  }
]
```

### Buscar pedidos
```http
GET /pedidos/buscar?estado=pendiente&mesa_id=1&fecha=2026-06-10
Authorization: Bearer {token}
```

**Parámetros opcionales:**
- `estado` (pendiente|en_preparacion|entregado|pagado|cancelado)
- `mesa_id`
- `fecha` (YYYY-MM-DD)

### Obtener un pedido
```http
GET /pedidos/{id}
Authorization: Bearer {token}
```

### Crear pedido
```http
POST /pedidos
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "mesa_id": 2,
  "fecha": "2026-06-15",
  "hora": "20:30:00",
  "productos": [
    {
      "producto_id": 1,
      "nombre_producto": "Hamburguesa Especial",
      "cantidad": 2,
      "precio_unitario": 28000
    },
    {
      "producto_id": 2,
      "nombre_producto": "Limonada Natural",
      "cantidad": 1,
      "precio_unitario": 8000
    }
  ]
}
```

**Validaciones:**
- `mesa_id` requerido, mesa no `disponible`
- Al menos 1 producto
- `cantidad` >= 1
- `precio_unitario` > 0
- Cálculos automáticos: `subtotal` = Σ(cantidad × precio_unitario), `total` = subtotal
- Estado inicial: `pendiente`

### Actualizar pedido
```http
PUT /pedidos/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "mesa_id": 3,
  "fecha": "2026-06-16",
  "hora": "21:00:00",
  "estado": "en_preparacion"
}
```

**Estados válidos:** `pendiente`, `en_preparacion`, `entregado`, `pagado`, `cancelado`
*No se puede modificar si está `entregado`, `pagado` o `cancelado`*

### Cambiar estado del pedido
```http
PATCH /pedidos/{id}/estado
Authorization: Bearer {token}
Content-Type: application/json
```

**Estados válidos:**
- `pendiente` → `en_preparacion` → `entregado` → `pagado`
- Cualquier estado → `cancelado`

```json
{
  "estado": "en_preparacion"
}
```

*Al cancelar: libera mesa si no hay otros pedidos activos*

### Eliminar pedido
```http
DELETE /pedidos/{id}
Authorization: Bearer {token}
```

---

## DETALLES DE PEDIDO (Productos en Pedido)

### Agregar producto al pedido
```http
POST /pedidos/{id}/productos
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "producto_id": 3,
  "nombre_producto": "Cheesecake",
  "cantidad": 1,
  "precio_unitario": 12000
}
```

**Comportamiento:**
- Si el producto ya existe en el pedido → suma cantidad
- Recalcula subtotal y total automáticamente
*No permitido si pedido en estado `entregado`, `pagado`, `cancelado`*

### Modificar cantidad de producto
```http
PUT /pedidos/{id}/productos/{detalle_id}
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "cantidad": 3
}
```

*Recalcula totales. No permitido en estados finales.*

### Quitar producto del pedido
```http
DELETE /pedidos/{id}/productos/{detalle_id}
Authorization: Bearer {token}
```

*Recalcula totales. No permitido en estados finales.*

---

## Datos de Prueba

### Pedidos
| ID | Mesa | Fecha | Hora | Subtotal | Total | Estado |
|----|------|-------|------|----------|-------|--------|
| 1 | 1 | 2026-06-10 | 20:00 | 36000 | 36000 | pendiente |

### Detalles
| ID | Pedido | Producto | Nombre | Cantidad | Precio Unit. | Subtotal |
|----|--------|----------|--------|----------|--------------|----------|
| 1 | 1 | 1 | Hamburguesa Especial | 1 | 28000 | 28000 |
| 2 | 1 | 2 | Limonada Natural | 1 | 8000 | 8000 |

---

## Base de Datos
- **Database:** `ms_pedidos_db`
- **Tablas:** `pedidos`, `detalles_pedidos`

---

## Flujo de Estados

```
PENDIENTE
    │
    ├─→ EN_PREPARACION
    │       │
    │       └─→ ENTREGADO
    │               │
    │               └─→ PAGADO
    │
    └─→ CANCELADO (desde cualquier estado)
```

---

## Ejemplos cURL

```bash
# Listar pedidos
curl -X GET http://localhost/proyecto_final/backend/ms-pedidos/public/pedidos \
  -H "Authorization: Bearer TU_TOKEN"

# Buscar pedidos pendientes
curl -X GET "http://localhost/proyecto_final/backend/ms-pedidos/public/pedidos/buscar?estado=pendiente" \
  -H "Authorization: Bearer TU_TOKEN"

# Crear pedido con productos
curl -X POST http://localhost/proyecto_final/backend/ms-pedidos/public/pedidos \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mesa_id": 2,
    "productos": [
      {"producto_id": 1, "nombre_producto": "Hamburguesa Especial", "cantidad": 2, "precio_unitario": 28000},
      {"producto_id": 3, "nombre_producto": "Cheesecake", "cantidad": 1, "precio_unitario": 12000}
    ]
  }'

# Cambiar estado a "en preparación"
curl -X PATCH http://localhost/proyecto_final/backend/ms-pedidos/public/pedidos/1/estado \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"en_preparacion"}'

# Agregar producto a pedido existente
curl -X POST http://localhost/proyecto_final/backend/ms-pedidos/public/pedidos/1/productos \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"producto_id": 2, "nombre_producto": "Limonada Natural", "cantidad": 2, "precio_unitario": 8000}'

# Modificar cantidad
curl -X PUT http://localhost/proyecto_final/backend/ms-pedidos/public/pedidos/1/productos/1 \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cantidad": 3}'

# Quitar producto
curl -X DELETE http://localhost/proyecto_final/backend/ms-pedidos/public/pedidos/1/productos/2 \
  -H "Authorization: Bearer TU_TOKEN"

# Cancelar pedido
curl -X PATCH http://localhost/proyecto_final/backend/ms-pedidos/public/pedidos/1/estado \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"estado":"cancelado"}'
```