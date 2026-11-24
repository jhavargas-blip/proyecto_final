// Módulo de autenticación
class AuthModule {
    constructor() {
        this.user = null;
        this.init();
    }

    init() {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('auth_user');
        
        if (token && userData) {
            this.user = JSON.parse(userData);
            api.setToken(token);
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
        this.user = null;
        api.setToken(null);
        localStorage.removeItem('auth_user');
        window.location.href = 'index.html';
    }

    async validateSession() {
        if (!this.user) return false;
        
        try {
            const result = await api.validateToken();
            if (result.valid) {
                this.user = result.user;
                localStorage.setItem('auth_user', JSON.stringify(this.user));
                return true;
            }
        } catch (e) {
            console.warn('Token inválido:', e);
        }
        
        await this.logout();
        return false;
    }

    isAuthenticated() {
        return !!this.user;
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

    renderUserInfo() {
        const container = document.getElementById('user-info');
        const navAuth = document.getElementById('nav-auth');
        
        if (this.user && container && navAuth) {
            container.textContent = `${this.user.nombre} (${this.user.rol})`;
            navAuth.style.display = 'flex';
        }
    }
}

window.auth = new AuthModule();