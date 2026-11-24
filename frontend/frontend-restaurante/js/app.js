// Router SPA simple e inicialización
class App {
    constructor() {
        this.currentRoute = 'dashboard';
        // No definir routes aquí, esperar a init()
    }

    getRoutes() {
        // Definir routes dinámicamente cuando se necesiten
        return {
            'dashboard': { module: null, init: () => {} },
            'mesas': { 
                module: () => window.mesasModule, 
                init: () => window.mesasModule?.load() 
            },
            'reservas': { 
                module: () => window.reservasModule, 
                init: () => window.reservasModule?.load() 
            },
            'categorias': { 
                module: () => window.categoriasModule, 
                init: () => window.categoriasModule?.load() 
            },
            'productos': { 
                module: () => window.productosModule, 
                init: () => window.productosModule?.load() 
            },
            'pedidos': { 
                module: () => window.pedidosModule, 
                init: () => window.pedidosModule?.load() 
            }
        };
    }

    init() {
        // Detectar en qué página estamos
        const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');
        const isDashboardPage = window.location.pathname.includes('dashboard.html');

        if (isLoginPage) {
            this.initLoginPage();
        } else if (isDashboardPage) {
            this.initDashboard();
        }
    }

    initLoginPage() {
        // Login form
        const loginForm = document.getElementById('form-login');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Verificar si ya está autenticado
        this.checkAuthAndRedirect();
    }

    async checkAuthAndRedirect() {
        const isValid = await window.auth?.validateSession();
        if (isValid) {
            // Redirigir a dashboard.html
            window.location.href = 'dashboard.html';
        } else {
            window.auth?.renderLoginForm();
        }
    }

    async handleLogin() {
        const username = document.getElementById('username')?.value;
        const password = document.getElementById('password')?.value;
        const errorEl = document.getElementById('login-error');
        const btn = document.querySelector('#form-login button[type="submit"]');

        if (window.UI) window.UI.setLoading(btn, true);
        if (errorEl) errorEl.style.display = 'none';

        try {
            await window.auth?.login(username, password);
            if (window.UI) window.UI.showSuccess('Bienvenido, ' + window.auth?.getUser()?.nombre);
            // Redirigir a dashboard.html
            window.location.href = 'dashboard.html';
        } catch (e) {
            if (errorEl) {
                errorEl.textContent = e.message;
                errorEl.style.display = 'block';
            }
        } finally {
            if (window.UI) window.UI.setLoading(btn, false);
        }
    }

    initDashboard() {
        // Verificar que los módulos estén disponibles
        const requiredModules = ['mesasModule', 'reservasModule', 'categoriasModule', 'productosModule', 'pedidosModule'];
        const missing = requiredModules.filter(m => !window[m]);
        
        if (missing.length > 0) {
            console.error('Módulos faltantes:', missing);
            // Reintentar después de un breve delay
            setTimeout(() => this.initDashboard(), 100);
            return;
        }

        // Event listeners para navegación
        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.dataset.route);
            });
        });

        // Botones de crear
        document.getElementById('btn-create-mesa')?.addEventListener('click', () => window.mesasModule?.openCreateModal());
        document.getElementById('btn-create-reserva')?.addEventListener('click', () => window.reservasModule?.openCreateModal());
        document.getElementById('btn-create-categoria')?.addEventListener('click', () => window.categoriasModule?.openCreateModal());
        document.getElementById('btn-create-producto')?.addEventListener('click', () => window.productosModule?.openCreateModal());
        document.getElementById('btn-create-pedido')?.addEventListener('click', () => window.pedidosModule?.openCreateModal());

        // Logout
        document.getElementById('btn-logout')?.addEventListener('click', () => window.auth?.logout());

        // Verificar autenticación
        this.checkAuthAndLoadDashboard();
    }

    async checkAuthAndLoadDashboard() {
        const isValid = await window.auth?.validateSession();
        if (!isValid) {
            window.location.href = 'index.html';
            return;
        }
        
        window.auth?.renderDashboard();
        window.auth?.renderUserInfo();
        
        const hash = window.location.hash.slice(1) || 'dashboard';
        this.navigate(hash);
    }

    navigate(route) {
        const routes = this.getRoutes();
        if (!routes[route]) route = 'dashboard';
        
        // Verificar autenticación para rutas protegidas
        if (route !== 'dashboard' && !window.auth?.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Actualizar navegación activa
        document.querySelectorAll('[data-route]').forEach(link => {
            link.classList.toggle('active', link.dataset.route === route);
        });

        // Ocultar todas las vistas
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
        });

        // Mostrar vista solicitada
        const view = document.getElementById(`view-${route}`);
        if (view) view.style.display = 'block';

        this.currentRoute = route;
        window.location.hash = route;

        // Inicializar módulo
        const routeConfig = routes[route];
        if (routeConfig?.init) {
            routeConfig.init();
        }
    }
}

// Inicializar al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});