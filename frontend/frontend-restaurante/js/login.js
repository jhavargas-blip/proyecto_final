// Login functionality
const API_AUTH = 'http://localhost/backend/ms-auth/public'; // Ajustar según configuración

document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');
    const loginError = document.getElementById('login-error');
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const navAuth = document.getElementById('nav-auth');
    const userInfo = document.getElementById('user-info');
    const btnLogout = document.getElementById('btn-logout');

    // Verificar si hay token guardado
    const token = localStorage.getItem('auth_token');
    if (token) {
        validateToken(token);
    }

    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.style.display = 'none';
        loginError.textContent = '';

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_AUTH}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier: username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en credenciales');
            }

            // Guardar token y datos del usuario
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_user', JSON.stringify(data));
            showDashboard(data);

        } catch (error) {
            loginError.textContent = error.message;
            loginError.style.display = 'block';
        }
    });

    btnLogout.addEventListener('click', async () => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                await fetch(`${API_AUTH}/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } catch (e) {
                console.warn('Error al cerrar sesión en servidor:', e);
            }
        }
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        showLogin();
    });

    async function validateToken(token) {
        try {
            const response = await fetch(`${API_AUTH}/validate`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (data.valid) {
                showDashboard(data.user);
            } else {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                showLogin();
            }
        } catch (e) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            showLogin();
        }
    }

    function showDashboard(user) {
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        navAuth.style.display = 'flex';
        userInfo.textContent = `${user.nombre} (${user.rol})`;
    }

    function showLogin() {
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';
        navAuth.style.display = 'none';
        formLogin.reset();
    }
});