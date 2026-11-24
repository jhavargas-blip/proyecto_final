// Router SPA simple e inicialización
class App {
    constructor() {
        this.routes = {
            'dashboard': { module: null, init: () => {} },
            'mesas': { module: mesasModule, init: () => mesasModule.load() },
            'reservas': { module: reservasModule, init: () => reservasModule.load() },
            'categorias': { module: categoriasModule, init: () => categoriasModule.load() },
            'productos': { module: productosModule, init: () => productosModule.load() },
            'pedidos': { module: pedidosModule, init: () => pedidosModule.load() }
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

        // Botones de crear
        document.getElementById('btn-create-mesa')?.addEventListener('click', () => mesasModule.openCreateModal());
        document.getElementById('btn-create-reserva')?.addEventListener('click', () => reservasModule.openCreateModal());
        document.getElementById('btn-create-categoria')?.addEventListener('click', () => categoriasModule.openCreateModal());
        document.getElementById('btn-create-producto')?.addEventListener('click', () => productosModule.openCreateModal());
        document.getElementById('btn-create-pedido')?.addEventListener('click', () => pedidosModule.openCreateModal());

        // Logout
        document.getElementById('btn-logout')?.addEventListener('click', () => auth.logout());

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
        const isValid = await auth.validateSession();
        const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/');

        if (isLoginPage) {
            if (isValid) {
                auth.renderDashboard();
                this.navigate('dashboard');
            } else {
                auth.renderLoginForm();
            }
        } else {
            if (!isValid) {
                window.location.href = 'index.html';
            } else {
                auth.renderDashboard();
                const hash = window.location.hash.slice(1) || 'dashboard';
                this.navigate(hash);
            }
        }
    }

    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('login-error');
        const btn = document.querySelector('#form-login button[type="submit"]');

        UI.setLoading(btn, true);
        errorEl.style.display = 'none';

        try {
            await auth.login(username, password);
            UI.showSuccess('Bienvenido, ' + auth.getUser().nombre);
            auth.renderDashboard();
            this.navigate('dashboard');
        } catch (e) {
            errorEl.textContent = e.message;
            errorEl.style.display = 'block';
        } finally {
            UI.setLoading(btn, false);
        }
    }

    navigate(route) {
        if (!this.routes[route]) route = 'dashboard';
        
        // Verificar autenticación para rutas protegidas
        if (route !== 'dashboard' && !auth.isAuthenticated()) {
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
        if (this.routes[route].init) {
            this.routes[route].init();
        }
    }
}

// Inicializar al cargar DOM
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});