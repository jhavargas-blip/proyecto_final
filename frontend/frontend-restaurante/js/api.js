// Cliente API centralizado para todos los microservicios
const API_BASE = {
    auth: 'http://localhost/backend/ms-auth/public',
    reservas: 'http://localhost/backend/ms-reservas/public',
    productos: 'http://localhost/backend/ms-productos/public',
    pedidos: 'http://localhost/backend/ms-pedidos/public'
};

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(service, endpoint, options = {}) {
        const url = `${API_BASE[service]}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json().catch(() => ({}));

            if (response.status === 401) {
                this.setToken(null);
                window.location.href = 'index.html';
                throw new Error('Sesión expirada');
            }

            if (!response.ok) {
                throw new Error(data.error || `Error ${response.status}`);
            }

            return data;
        } catch (error) {
            if (error.message === 'Sesión expirada') throw error;
            console.error(`API Error [${service}${endpoint}]:`, error);
            throw error;
        }
    }

    // Auth
    login(identifier, password) {
        return this.request('auth', '/login', {
            method: 'POST',
            body: { identifier, password }
        });
    }

    logout() {
        return this.request('auth', '/logout', { method: 'POST' });
    }

    validateToken() {
        return this.request('auth', '/validate');
    }

    getMe() {
        return this.request('auth', '/me');
    }

    // Mesas
    getMesas() {
        return this.request('reservas', '/mesas');
    }

    getMesa(id) {
        return this.request('reservas', `/mesas/${id}`);
    }

    createMesa(data) {
        return this.request('reservas', '/mesas', {
            method: 'POST',
            body: data
        });
    }

    updateMesa(id, data) {
        return this.request('reservas', `/mesas/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    changeMesaState(id, estado) {
        return this.request('reservas', `/mesas/${id}/estado`, {
            method: 'PATCH',
            body: { estado }
        });
    }

    deleteMesa(id) {
        return this.request('reservas', `/mesas/${id}`, {
            method: 'DELETE'
        });
    }

    // Reservas
    getReservas() {
        return this.request('reservas', '/reservas');
    }

    searchReservas(filters) {
        const params = new URLSearchParams(filters).toString();
        return this.request('reservas', `/reservas/buscar?${params}`);
    }

    getReserva(id) {
        return this.request('reservas', `/reservas/${id}`);
    }

    createReserva(data) {
        return this.request('reservas', '/reservas', {
            method: 'POST',
            body: data
        });
    }

    updateReserva(id, data) {
        return this.request('reservas', `/reservas/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    cancelReserva(id) {
        return this.request('reservas', `/reservas/${id}/cancelar`, {
            method: 'PATCH'
        });
    }

    deleteReserva(id) {
        return this.request('reservas', `/reservas/${id}`, {
            method: 'DELETE'
        });
    }

    // Categorías
    getCategorias() {
        return this.request('productos', '/categorias');
    }

    getCategoria(id) {
        return this.request('productos', `/categorias/${id}`);
    }

    createCategoria(data) {
        return this.request('productos', '/categorias', {
            method: 'POST',
            body: data
        });
    }

    updateCategoria(id, data) {
        return this.request('productos', `/categorias/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    deleteCategoria(id) {
        return this.request('productos', `/categorias/${id}`, {
            method: 'DELETE'
        });
    }

    // Productos
    getProductos() {
        return this.request('productos', '/productos');
    }

    searchProductos(filters) {
        const params = new URLSearchParams(filters).toString();
        return this.request('productos', `/productos/buscar?${params}`);
    }

    getProducto(id) {
        return this.request('productos', `/productos/${id}`);
    }

    createProducto(data) {
        return this.request('productos', '/productos', {
            method: 'POST',
            body: data
        });
    }

    updateProducto(id, data) {
        return this.request('productos', `/productos/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    deleteProducto(id) {
        return this.request('productos', `/productos/${id}`, {
            method: 'DELETE'
        });
    }

    // Pedidos
    getPedidos() {
        return this.request('pedidos', '/pedidos');
    }

    searchPedidos(filters) {
        const params = new URLSearchParams(filters).toString();
        return this.request('pedidos', `/pedidos/buscar?${params}`);
    }

    getPedido(id) {
        return this.request('pedidos', `/pedidos/${id}`);
    }

    createPedido(data) {
        return this.request('pedidos', '/pedidos', {
            method: 'POST',
            body: data
        });
    }

    updatePedido(id, data) {
        return this.request('pedidos', `/pedidos/${id}`, {
            method: 'PUT',
            body: data
        });
    }

    changePedidoState(id, estado) {
        return this.request('pedidos', `/pedidos/${id}/estado`, {
            method: 'PATCH',
            body: { estado }
        });
    }

    addProductoToPedido(pedidoId, data) {
        return this.request('pedidos', `/pedidos/${pedidoId}/productos`, {
            method: 'POST',
            body: data
        });
    }

    updatePedidoDetalle(pedidoId, detalleId, data) {
        return this.request('pedidos', `/pedidos/${pedidoId}/productos/${detalleId}`, {
            method: 'PUT',
            body: data
        });
    }

    removeProductoFromPedido(pedidoId, detalleId) {
        return this.request('pedidos', `/pedidos/${pedidoId}/productos/${detalleId}`, {
            method: 'DELETE'
        });
    }

    deletePedido(id) {
        return this.request('pedidos', `/pedidos/${id}`, {
            method: 'DELETE'
        });
    }
}

window.api = new ApiClient();