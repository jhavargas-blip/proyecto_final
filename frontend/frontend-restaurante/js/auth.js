// ============================================
// AUTH MODULE - Login, logout, session management
// ============================================

class AuthModule {
    constructor() {
        this.user = null;
        this.init();
    }

    init() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('auth_user');
        
        if (token && userData) {
            try {
                this.user = JSON.parse(userData);
                api.setToken(token);
            } catch (e) {
                this.clearSession();
            }
        }
    }

    async login(identifier, password) {
        const data = await api.login(identifier, password);
        this.user = data;
        api.setToken(data.token);
        localStorage.setItem('auth_user', JSON.stringify(data));
        return data;
    }

    async logout() {
        try {
            await api.logout();
        } catch (e) {
            console.warn('Error en logout server:', e);
        }
        this.clearSession();
        window.location.href = 'index.html';
    }

    clearSession() {
        this.user = null;
        api.setToken(null);
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_token');
    }

    async validateSession() {
        if (!this.user || !localStorage.getItem('auth_token')) {
            return false;
        }
        
        try {
            const result = await api.validateToken();
            if (result.valid) {
                this.user = result.user;
                localStorage.setItem('auth_user', JSON.stringify(this.user));
                return true;
            }
        } catch (e) {
            console.warn('Token validation failed:', e);
        }
        
        await this.logout();
        return false;
    }

    isAuthenticated() {
        return !!this.user && !!localStorage.getItem('auth_token');
    }

    getUser() {
        return this.user;
    }

    hasRole(...roles) {
        return this.user && roles.includes(this.user.rol);
    }

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    // Only used on login page
    renderLoginForm() {
        const loginView = document.getElementById('login-view');
        if (loginView) loginView.style.display = 'block';
    }
}

window.auth = new AuthModule();