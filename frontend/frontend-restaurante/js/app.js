// App main entry point
console.log('Restaurante XYZ - Frontend cargado');

// Configuración de APIs por microservicio
const API_CONFIG = {
    auth: 'http://localhost/backend/ms-auth/public',
    reservas: 'http://localhost/backend/ms-reservas/public',
    productos: 'http://localhost/backend/ms-productos/public',
    pedidos: 'http://localhost/backend/ms-pedidos/public'
};

// Helper para peticiones autenticadas
async function apiRequest(service, endpoint, options = {}) {
    const token = localStorage.getItem('auth_token');
    const url = `${API_CONFIG[service]}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            window.location.reload();
        }
        throw new Error(data.error || `Error ${response.status}`);
    }

    return data;
}

// Exportar para uso en otros módulos
window.apiRequest = apiRequest;
window.API_CONFIG = API_CONFIG;