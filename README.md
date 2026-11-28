# Restaurante XYZ - Sistema Web de Reservas y Pedidos

## Arquitectura
```
proyecto_final/
├── backend/                    # 4 Microservicios independientes
│   ├── ms-auth/               # Autenticación (login, token, sesión)
│   ├── ms-reservas/           # Mesas + Reservas
│   ├── ms-productos/          # Categorías + Productos
│   └── ms-pedidos/            # Pedidos + Detalles
└── frontend/
    └── frontend-restaurante/  # SPA Vanilla JS
```

## Tecnologías
- **Backend:** PHP 8+, Slim Framework 4, Eloquent ORM, MySQL
- **Frontend:** HTML5, CSS3, JavaScript Vanilla (ES6+)
- **Auth:** Token simple en BD (sin JWT)
- **Comunicación:** REST API + fetch()

## Requisitos
- XAMPP (Apache + MySQL)
- PHP 8.1+
- Composer 2+

## Instalación Rápida

```bash
# 1. Iniciar MySQL y Apache en XAMPP Control Panel

# 2. Crear bases de datos
cd C:\xampp\htdocs\proyecto_final
cmd /c run_sql.bat

# 3. Instalar dependencias (4 microservicios)
cd backend\ms-auth && composer install
cd ..\ms-reservas && composer install
cd ..\ms-productos && composer install
cd ..\ms-pedidos && composer install

# 4. Configurar Apache (httpd.conf)
# LoadModule rewrite_module modules/mod_rewrite.so
# AllowOverride All
# Reiniciar Apache
```

## URLs
| Servicio | URL |
|----------|-----|
| Login | `http://localhost/proyecto_final/frontend/frontend-restaurante/index.html` |
| Dashboard | `http://localhost/proyecto_final/frontend/frontend-restaurante/dashboard.html` |
| ms-auth | `http://localhost/proyecto_final/backend/ms-auth/public` |
| ms-reservas | `http://localhost/proyecto_final/backend/ms-reservas/public` |
| ms-productos | `http://localhost/proyecto_final/backend/ms-productos/public` |
| ms-pedidos | `http://localhost/proyecto_final/backend/ms-pedidos/public` |

## Credenciales Demo
| Usuario | Contraseña | Rol |
|---------|------------|-----|
| `admin` | `admin123` | administrador |
| `empleado` | `empleado123` | empleado |

## Endpoints Principales
```
ms-auth:       POST /login, POST /logout, GET /validate, GET /me
ms-reservas:   CRUD /mesas, CRUD /reservas, PATCH /mesas/{id}/estado, PATCH /reservas/{id}/cancelar
ms-productos:  CRUD /categorias, CRUD /productos, GET /productos/buscar
ms-pedidos:    CRUD /pedidos, POST /pedidos/{id}/productos, PATCH /pedidos/{id}/estado
```

## Documentación Detallada
- `backend/ms-auth/README.md`
- `backend/ms-reservas/README.md`
- `backend/ms-productos/README.md`
- `backend/ms-pedidos/README.md`

## Estructura de BD (4 bases)
- `ms_auth_db` → usuarios
- `ms_reservas_db` → mesas, reservas
- `ms_productos_db` → categorias, productos
- `ms_pedidos_db` → pedidos, detalles_pedidos

## Health Checks
```bash
curl http://localhost/proyecto_final/backend/ms-auth/public/health
curl http://localhost/proyecto_final/backend/ms-reservas/public/health
curl http://localhost/proyecto_final/backend/ms-productos/public/health
curl http://localhost/proyecto_final/backend/ms-pedidos/public/health
```

## Licencia
Proyecto educativo - Examen Práctico Desarrollo Web