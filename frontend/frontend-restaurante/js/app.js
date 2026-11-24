// Router SPA simple e inicialización
class App {
    constructor() {
        // Usar window. para acceder a variables globales definidas en otros scripts
        this.routes = {
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
        this.currentRoute = 'dashboard';
        this.init();
    }

    init() {
        // Event listeners para navegación
        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.dataset.route);
            });
        });

        // Botones de crear - usar optional chaining
        document.getElementById('btn-create-mesa')?.addEventListener('click', () => window.mesasModule?.openCreateModal());
        document.getElementById('btn-create-reserva')?.addEventListener('click', () => window.reservasModule?.openCreateModal());
        document.getElementById('btn-create-categoria')?.addEventListener('click', () => window.categoriasModule?.openCreateModal());
        document.getElementById('btn-create-producto')?.addEventListener('click', () => window.productosModule?.openCreateModal());
        document.getElementById('btn-create-pedido')?.addEventListener('click', () => window.pedidosModule?.openCreateModal());

        // Logout
        document.getElementById('btn-logout')?.addEventListener('click', () => window.auth?.logout());

        // Login form
        const loginForm = document.getElementById('form-login');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Verificar autenticación al cargar
        this.checkAuth();
    }

    async checkAuth() {
        const isValid = await window.auth?.validateSession();
        const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');

        if (isLoginPage) {
            if (isValid) {
                window.auth?.renderDashboard();
                this.navigate('dashboard');
            } else {
                window.auth?.renderLoginForm();
            }
        } else {
            if (!isValid) {
                window.location.href = 'index.html';
            } else {
                window.auth?.renderDashboard();
                const hash = window.location.hash.slice(1) || 'dashboard';
                this.navigate(hash);
            }
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
            window.auth?.renderDashboard();
            this.navigate('dashboard');
        } catch (e) {
            if (errorEl) {
                errorEl.textContent = e.message;
                errorEl.style.display = 'block';
            }
        } finally {
            if (window.UI) window.UI.setLoading(btn, false);
        }
    }

    navigate(route) {
        if (!this.routes[route]) route = 'dashboard';
        
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
        const routeConfig = this.routes[route];
        if (routeConfig?.init) {
            routeConfig.init();
        }
    }
}

// Inicializar al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});