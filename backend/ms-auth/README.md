# ms-auth - Microservicio de Autenticación

## Base URL
```
http://localhost/proyecto_final/backend/ms-auth/public
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
  "service": "ms-auth"
}
```

---

### Login
```http
POST /login
Content-Type: application/json
```

**Request:**
```json
{
  "identifier": "admin",
  "password": "admin123"
}
```
*identifier puede ser `usuario` o `correo`*

**Response:** `200 OK`
```json
{
  "id": 1,
  "nombre": "Administrador General",
  "correo": "admin@restaurante.com",
  "usuario": "admin",
  "rol": "administrador",
  "token": "abc123xyz..."
}
```

**Error:** `401 Unauthorized`
```json
{
  "error": "Credenciales inválidas"
}
```

---

### Logout
```http
POST /logout
Authorization: Bearer {token}
Content-Type: application/json
```

**Response:** `200 OK`
```json
{
  "message": "Sesión cerrada correctamente"
}
```

---

### Validar Token
```http
GET /validate
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "valid": true,
  "user": {
    "id": 1,
    "nombre": "Administrador General",
    "correo": "admin@restaurante.com",
    "usuario": "admin",
    "rol": "administrador"
  }
}
```

**Error:** `401 Unauthorized`
```json
{
  "valid": false,
  "error": "Token inválido o expirado"
}
```

---

### Obtener Usuario Actual
```http
GET /me
Authorization: Bearer {token}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": 1,
    "nombre": "Administrador General",
    "correo": "admin@restaurante.com",
    "usuario": "admin",
    "rol": "administrador"
  }
}
```

---

### CRUD Usuarios (Admin)

#### Listar todos
```http
GET /usuarios
Authorization: Bearer {token}
```

#### Crear usuario
```http
POST /usuarios
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "nombre": "Nuevo Usuario",
  "correo": "nuevo@restaurante.com",
  "usuario": "nuevo",
  "contrasena": "password123",
  "rol": "empleado",
  "estado": "activo"
}
```

#### Actualizar usuario
```http
PUT /usuarios/{id}
Authorization: Bearer {token}
Content-Type: application/json
```

```json
{
  "nombre": "Nombre Actualizado",
  "rol": "administrador"
}
```

#### Eliminar usuario
```http
DELETE /usuarios/{id}
Authorization: Bearer {token}
```

---

## Usuarios de Prueba
| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | administrador |
| `empleado` | `empleado123` | empleado |

---

## Base de Datos
- **Database:** `ms_auth_db`
- **Tabla:** `usuarios`

---

## Ejemplos cURL

```bash
# Login
curl -X POST http://localhost/proyecto_final/backend/ms-auth/public/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123"}'

# Validar token
curl -X GET http://localhost/proyecto_final/backend/ms-auth/public/validate \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Health check
curl http://localhost/proyecto_final/backend/ms-auth/public/health
```