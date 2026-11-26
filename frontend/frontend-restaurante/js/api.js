// ============================================
// API CLIENT - Centralized fetch wrapper
// ============================================

const API_BASE = {
    auth: 'http://localhost/proyecto_final/backend/ms-auth/public',
    reservas: 'http://localhost/proyecto_final/backend/ms-reservas/public',
    productos: 'http://localhost/proyecto_final/backend/ms-productos/public',
    pedidos: 'http://localhost/proyecto_final/backend/ms-pedidos/public'
};

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.defaultTimeout = 10000; // 10s
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
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(service, endpoint, options = {}) {
        const url = `${API_BASE[service]}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);

        const config = {
            headers: this.getHeaders(),
            signal: controller.signal,
            ...options
        };

        if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            clearTimeout(timeoutId);

            // Handle 204 No Content
            if (response.status === 204) {
                return null;
            }

            const contentType = response.headers.get('content-type');
            const isJson = contentType && contentType.includes('application/json');
            const data = isJson ? await response.json() : await response.text();

            if (response.status === 401) {
                this.handleUnauthorized();
                throw new Error('Sesión expirada. Por favor, inicia sesión de nuevo.');
            }

            if (!response.ok) {
                const message = isJson && data.error ? data.error : `Error ${response.status}: ${response.statusText}`;
                throw new Error(message);
            }

            return data;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Tiempo de espera agotado. Verifica tu conexión.');
            }
            
            if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
                throw new Error('No se puede conectar al servidor. Verifica que los microservicios estén corriendo.');
            }
            
            throw error;
        }
    }

    handleUnauthorized() {
        this.setToken(null);
        localStorage.removeItem('auth_user');
        // Only redirect if not on login page
        if (!window.location.pathname.includes('index.html')) {
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 100);
        }
    }

    // ========== AUTH ==========
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

    // ========== MESAS ==========
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

    // ========== RESERVAS ==========
    getReservas() {
        return this.request('reservas', '/reservas');
    }

    searchReservas(filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== undefined && v !== '' && v !== null) params.append(k, v);
        });
        return this.request('reservas', `/reservas/buscar?${params.toString()}`);
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

    // ========== CATEGORÍAS ==========
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

    // ========== PRODUCTOS ==========
    getProductos() {
        return this.request('productos', '/productos');
    }

    searchProductos(filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== undefined && v !== '' && v !== null) params.append(k, v);
        });
        return this.request('productos', `/productos/buscar?${params.toString()}`);
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

    // ========== PEDIDOS ==========
    getPedidos() {
        return this.request('pedidos', '/pedidos');
    }

    searchPedidos(filters) {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => {
            if (v !== undefined && v !== '' && v !== null) params.append(k, v);
        });
        return this.request('pedidos', `/pedidos/buscar?${params.toString()}`);
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