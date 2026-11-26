# ms-productos - Microservicio de Productos y Categorías

## Base URL
```
http://localhost/proyecto_final/backend/ms-productos/public
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
  "service": "ms-productos"
}
```

---

## CATEGORÍAS

### Listar todas
```http
GET /categorias
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "nombre": "Entradas",
    "descripcion": "Productos de entrada",
    "productos_count": 0,
    "created_at": "2026-11-17T10:00:00",
    "updated_at": "2026-11-17T10:00:00"
  }
]
```

### Obtener una categoría
```http
GET /categorias/{id}
Authorization: Bearer {token}
```

### Crear categoría
```http
POST /categorias
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "nombre": "Vinos",
  "descripcion": "Vinos tintos y blancos"
}
```

**Validaciones:**
- `nombre` único, requerido

### Actualizar categoría
```http
PUT /categorias/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "nombre": "Vinos y Licores",
  "descripcion": "Vinos, licores y destilados"
}
```

### Eliminar categoría
```http
DELETE /categorias/{id}
Authorization: Bearer {token}
```

**Validación:** No se puede eliminar si tiene productos asociados

---

## PRODUCTOS

### Listar todos
```http
GET /productos
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "nombre": "Hamburguesa Especial",
    "descripcion": "Hamburguesa con queso y tocineta",
    "precio": "28000.00",
    "disponible": true,
    "categoria_id": 3,
    "categoria": {
      "id": 3,
      "nombre": "Platos fuertes"
    },
    "created_at": "2026-11-17T10:00:00",
    "updated_at": "2026-11-17T10:00:00"
  }
]
```

### Buscar productos
```http
GET /productos/buscar?categoria_id=3&disponible=true&nombre=hamburguesa
Authorization: Bearer {token}
```

**Parámetros opcionales:**
- `categoria_id` (filtrar por categoría)
- `disponible` (true|false)
- `nombre` (búsqueda parcial)

### Obtener un producto
```http
GET /productos/{id}
Authorization: Bearer {token}
```

### Crear producto
```http
POST /productos
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "nombre": "Pizza Margarita",
  "descripcion": "Pizza con tomate, mozzarella y albahaca",
  "precio": 35000,
  "categoria_id": 3,
  "disponible": true
}
```

**Validaciones:**
- `nombre` único, requerido
- `precio` > 0
- `categoria_id` existe
- `disponible` default: true

### Actualizar producto
```http
PUT /productos/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "nombre": "Pizza Pepperoni",
  "precio": 38000,
  "categoria_id": 3,
  "disponible": true
}
```

### Eliminar producto
```http
DELETE /productos/{id}
Authorization: Bearer {token}
```

---

## Datos de Prueba

### Categorías
| ID | Nombre | Descripción |
|----|--------|-------------|
| 1 | Entradas | Productos de entrada |
| 2 | Bebidas | Bebidas frías y calientes |
| 3 | Platos fuertes | Platos principales |
| 4 | Postres | Productos dulces |

### Productos
| ID | Nombre | Descripción | Precio | Disponible | Categoría |
|----|--------|-------------|--------|------------|-----------|
| 1 | Hamburguesa Especial | Hamburguesa con queso y tocineta | 28000 | Sí | Platos fuertes |
| 2 | Limonada Natural | Bebida natural de limón | 8000 | Sí | Bebidas |
| 3 | Cheesecake | Postre de queso | 12000 | Sí | Postres |

---

## Base de Datos
- **Database:** `ms_productos_db`
- **Tablas:** `categorias`, `productos`

---

## Ejemplos cURL

```bash
# Listar categorías
curl -X GET http://localhost/proyecto_final/backend/ms-productos/public/categorias \
  -H "Authorization: Bearer TU_TOKEN"

# Crear categoría
curl -X POST http://localhost/proyecto_final/backend/ms-productos/public/categorias \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Vinos","descripcion":"Vinos tintos, blancos y rosados"}'

# Listar productos
curl -X GET http://localhost/proyecto_final/backend/ms-productos/public/productos \
  -H "Authorization: Bearer TU_TOKEN"

# Buscar productos disponibles de "Platos fuertes"
curl -X GET "http://localhost/proyecto_final/backend/ms-productos/public/productos/buscar?categoria_id=3&disponible=true" \
  -H "Authorization: Bearer TU_TOKEN"

# Crear producto
curl -X POST http://localhost/proyecto_final/backend/ms-productos/public/productos \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Pasta Carbonara","descripcion":"Pasta con salsa cremosa, panceta y parmesano","precio":32000,"categoria_id":3,"disponible":true}'

# Actualizar precio
curl -X PUT http://localhost/proyecto_final/backend/ms-productos/public/productos/1 \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"precio":30000}'
```