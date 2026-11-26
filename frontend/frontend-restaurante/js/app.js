// ============================================
// APP - Router SPA + Inicialización
// ============================================

class App {
    constructor() {
        this.currentRoute = 'dashboard';
        this.init();
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

        // Demo credentials click-to-fill
        document.querySelectorAll('.demo-credentials code').forEach(code => {
            code.style.cursor = 'pointer';
            code.onclick = () => {
                const text = code.textContent;
                if (text.includes('@')) {
                    document.getElementById('username').value = text;
                } else {
                    document.getElementById('password').value = text;
                }
            };
        });

        // Verificar si ya está autenticado
        this.checkAuthAndRedirect();
    }

    async checkAuthAndRedirect() {
        const isValid = await window.auth?.validateSession();
        if (isValid) {
            window.location.href = 'dashboard.html';
        } else {
            window.auth?.renderLoginForm?.();
        }
    }

    async handleLogin() {
        const username = document.getElementById('username')?.value?.trim();
        const password = document.getElementById('password')?.value;
        const errorEl = document.getElementById('login-error');
        const btn = document.querySelector('#form-login button[type="submit"]');

        if (!username || !password) {
            if (errorEl) {
                errorEl.textContent = 'Por favor ingrese usuario y contraseña';
                errorEl.style.display = 'block';
            }
            return;
        }

        UI.setLoading(btn, true);
        if (errorEl) errorEl.style.display = 'none';

        try {
            await window.auth?.login(username, password);
            UI.showSuccess('Bienvenido, ' + window.auth?.getUser()?.nombre);
            window.location.href = 'dashboard.html';
        } catch (e) {
            if (errorEl) {
                errorEl.textContent = e.message;
                errorEl.style.display = 'block';
            }
        } finally {
            UI.setLoading(btn, false);
        }
    }

    initDashboard() {
        // Mobile menu toggle
        this.initMobileMenu();

        // Navigation
        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(link.dataset.route);
            });
        });

        // Create buttons
        const createButtons = {
            'btn-create-mesa': () => window.mesasModule?.openCreateModal(),
            'btn-create-reserva': () => window.reservasModule?.openCreateModal(),
            'btn-create-categoria': () => window.categoriasModule?.openCreateModal(),
            'btn-create-producto': () => window.productosModule?.openCreateModal(),
            'btn-create-pedido': () => window.pedidosModule?.openCreateModal()
        };

        Object.entries(createButtons).forEach(([id, handler]) => {
            document.getElementById(id)?.addEventListener('click', handler);
        });

        // Logout
        document.getElementById('btn-logout')?.addEventListener('click', () => window.auth?.logout());

        // Check auth and load
        this.checkAuthAndLoadDashboard();
    }

    initMobileMenu() {
        // Create mobile menu button if not exists
        if (!document.getElementById('mobile-menu-btn')) {
            const header = document.querySelector('header');
            if (header) {
                const btn = document.createElement('button');
                btn.id = 'mobile-menu-btn';
                btn.className = 'btn btn-secondary btn-sm mobile-menu-btn';
                btn.innerHTML = '☰';
                btn.style.display = 'none';
                btn.onclick = () => this.toggleMobileMenu();
                header.querySelector('nav')?.prepend(btn);
            }
        }
    }

    toggleMobileMenu() {
        const sidebar = document.querySelector('.sidebar');
        const overlay = document.querySelector('.sidebar-overlay');
        
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
        
        if (!overlay) {
            const newOverlay = document.createElement('div');
            newOverlay.className = 'sidebar-overlay';
            newOverlay.onclick = () => this.toggleMobileMenu();
            document.body.appendChild(newOverlay);
        } else {
            overlay.classList.toggle('show');
        }
    }

    async checkAuthAndLoadDashboard() {
        const isValid = await window.auth?.validateSession();
        if (!isValid) {
            window.location.href = 'index.html';
            return;
        }
        
        window.auth?.renderDashboard?.();
        window.auth?.renderUserInfo?.();
        
        const hash = window.location.hash.slice(1) || 'dashboard';
        this.navigate(hash);
    }

    navigate(route) {
        const validRoutes = ['dashboard', 'mesas', 'reservas', 'categorias', 'productos', 'pedidos'];
        if (!validRoutes.includes(route)) route = 'dashboard';
        
        if (route !== 'dashboard' && !window.auth?.isAuthenticated()) {
            window.location.href = 'index.html';
            return;
        }

        // Update active nav
        document.querySelectorAll('[data-route]').forEach(link => {
            link.classList.toggle('active', link.dataset.route === route);
        });

        // Show/hide views
        document.querySelectorAll('.view').forEach(view => {
            view.style.display = 'none';
            view.classList.remove('active');
        });

        const view = document.getElementById(`view-${route}`);
        if (view) {
            view.style.display = 'block';
            view.classList.add('active');
        }

        this.currentRoute = route;
        window.location.hash = route;

        // Close mobile menu
        document.querySelector('.sidebar')?.classList.remove('open');
        document.querySelector('.sidebar-overlay')?.classList.remove('show');

        // Initialize module
        const modules = {
            dashboard: () => {},
            mesas: () => window.mesasModule?.load(),
            reservas: () => window.reservasModule?.load(),
            categorias: () => window.categoriasModule?.load(),
            productos: () => window.productosModule?.load(),
            pedidos: () => window.pedidosModule?.load()
        };

        if (modules[route]) {
            modules[route]();
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});

// Handle hash changes
window.addEventListener('hashchange', () => {
    if (window.app && window.location.pathname.includes('dashboard.html')) {
        const hash = window.location.hash.slice(1);
        if (hash) window.app.navigate(hash);
    }
});