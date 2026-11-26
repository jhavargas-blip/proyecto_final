// ============================================
// UI UTILITIES - Toast, Modal, Tables, Formatting
// ============================================

class UI {
    // ========== TOAST NOTIFICATIONS ==========
    static showToast(message, type = 'info', duration = 4000) {
        const container = this.getToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close" aria-label="Cerrar">&times;</button>
        `;

        toast.querySelector('.toast-close').onclick = () => this.hideToast(toast);
        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => toast.classList.add('show'));

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => this.hideToast(toast), duration);
        }

        return toast;
    }

    static getToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    static hideToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }

    static showSuccess(message, duration) {
        return this.showToast(message, 'success', duration);
    }

    static showError(message, duration) {
        return this.showToast(message, 'error', duration || 6000);
    }

    static showWarning(message, duration) {
        return this.showToast(message, 'warning', duration);
    }

    static showInfo(message, duration) {
        return this.showToast(message, 'info', duration);
    }

    // ========== MODALS ==========
    static createModal(title, content, onConfirm, confirmText = 'Confirmar', confirmClass = 'btn-primary') {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
                <div class="modal-header">
                    <h3 id="modal-title">${this.escapeHtml(title)}</h3>
                    <button class="modal-close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">Cancelar</button>
                    <button class="btn ${confirmClass} modal-confirm">${this.escapeHtml(confirmText)}</button>
                </div>
            </div>
        `;

        const close = () => {
            overlay.classList.remove('show');
            setTimeout(() => overlay.remove(), 300);
        };

        overlay.querySelector('.modal-close').onclick = close;
        overlay.querySelector('.modal-cancel').onclick = close;
        overlay.querySelector('.modal-confirm').onclick = () => {
            if (onConfirm) onConfirm();
            close();
        };
        overlay.onclick = (e) => { if (e.target === overlay) close(); };

        // Handle Escape key
        const handleEsc = (e) => { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', handleEsc); }};
        document.addEventListener('keydown', handleEsc);

        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('show'));
        return overlay;
    }

    static createFormModal(title, fields, onSubmit, submitText = 'Guardar') {
        const formHtml = fields.map(f => this.renderFormField(f)).join('');
        
        return this.createModal(title, `<form id="modal-form" novalidate>${formHtml}</form>`, () => {
            const form = document.getElementById('modal-form');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }
            const data = {};
            new FormData(form).forEach((v, k) => data[k] = v);
            onSubmit(data);
        }, submitText);
    }

    static renderFormField(field) {
        const id = `modal-${field.name}`;
        const required = field.required ? 'required' : '';
        const readonly = field.readonly ? 'readonly' : '';
        const placeholder = field.placeholder ? `placeholder="${this.escapeHtml(field.placeholder)}"` : '';
        const value = field.value !== undefined ? `value="${this.escapeHtml(field.value)}"` : '';
        const label = `<label for="${id}">${this.escapeHtml(field.label)}${field.required ? ' <span class="text-danger">*</span>' : ''}</label>`;

        let input;
        if (field.type === 'select' && field.options) {
            const options = field.options.map(o => 
                `<option value="${this.escapeHtml(o.value)}" ${o.selected ? 'selected' : ''}>${this.escapeHtml(o.label)}</option>`
            ).join('');
            input = `<select id="${id}" name="${field.name}" ${required} ${readonly}>${options}</select>`;
        } else if (field.type === 'textarea') {
            input = `<textarea id="${id}" name="${field.name}" ${required} ${readonly} ${placeholder} rows="${field.rows || 3}">${this.escapeHtml(field.value || '')}</textarea>`;
        } else if (field.type === 'checkbox') {
            return `
                <div class="form-group checkbox">
                    <input type="checkbox" id="${id}" name="${field.name}" ${field.value ? 'checked' : ''} ${readonly}>
                    <label for="${id}">${this.escapeHtml(field.label)}</label>
                </div>
            `;
        } else {
            input = `<input type="${field.type || 'text'}" id="${id}" name="${field.name}" ${required} ${readonly} ${placeholder} ${value}>`;
        }

        return `<div class="form-group">${label}${input}</div>`;
    }

    // ========== TABLES ==========
    static renderTable(containerId, columns, data, actions = []) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📭</div>
                    <h3>No hay datos</h3>
                    <p>No se encontraron registros</p>
                </div>
            `;
            return;
        }

        const thead = columns.map(c => `<th>${this.escapeHtml(c.label)}</th>`).join('');
        const actionTh = actions.length ? '<th>Acciones</th>' : '';

        const tbody = data.map(row => {
            const cells = columns.map(c => {
                let value = c.render ? c.render(row) : row[c.key];
                return `<td>${value !== null && value !== undefined ? this.escapeHtml(value) : '<span class="text-muted">—</span>'}</td>`;
            }).join('');
            const actionCells = actions.map(a => 
                `<td><button class="btn btn-sm ${a.class || 'btn-secondary'}" data-id="${row.id}" data-action="${a.action}" title="${a.label}">${a.label}</button></td>`
            ).join('');
            return `<tr>${cells}${actionCells}</tr>`;
        }).join('');

        container.innerHTML = `
            <div class="data-table-container">
                <table class="data-table">
                    <thead><tr>${thead}${actionTh}</tr></thead>
                    <tbody>${tbody}</tbody>
                </table>
            </div>
        `;

        // Bind action handlers
        actions.forEach(a => {
            container.querySelectorAll(`[data-action="${a.action}"]`).forEach(btn => {
                btn.onclick = () => a.handler(btn.dataset.id);
            });
        });
    }

    // ========== SELECT HELPERS ==========
    static populateSelect(selectId, options, valueKey = 'id', labelKey = 'nombre', selectedValue = null, placeholder = 'Seleccionar...') {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = `<option value="">${this.escapeHtml(placeholder)}</option>` + 
            options.map(o => {
                const val = o[valueKey];
                const lbl = o[labelKey];
                const selected = val == selectedValue ? 'selected' : '';
                return `<option value="${this.escapeHtml(val)}" ${selected}>${this.escapeHtml(lbl)}</option>`;
            }).join('');
        select.value = currentValue;
    }

    // ========== FORMATTING ==========
    static formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr + 'T00:00:00');
            return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch { return dateStr; }
    }

    static formatDateTime(dateStr, timeStr) {
        if (!dateStr) return '—';
        try {
            const d = new Date(dateStr + 'T' + (timeStr || '00:00:00'));
            return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + 
                   d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        } catch { return dateStr + ' ' + (timeStr || ''); }
    }

    static formatTime(timeStr) {
        if (!timeStr) return '—';
        return timeStr.substring(0, 5);
    }

    static formatCurrency(value) {
        if (value === null || value === undefined || value === '') return '—';
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return '—';
        return new Intl.NumberFormat('es-CO', { 
            style: 'currency', 
            currency: 'COP', 
            minimumFractionDigits: 0,
            maximumFractionDigits: 0 
        }).format(num);
    }

    static formatNumber(num) {
        if (num === null || num === undefined) return '—';
        return new Intl.NumberFormat('es-CO').format(num);
    }

    static getEstadoBadge(estado) {
        if (!estado) return '<span class="badge badge-secondary">—</span>';
        
        const badges = {
            'disponible': 'success',
            'reservada': 'warning',
            'ocupada': 'danger',
            'fuera_servicio': 'secondary',
            'pendiente': 'warning',
            'confirmada': 'info',
            'cancelada': 'secondary',
            'finalizada': 'success',
            'en_preparacion': 'warning',
            'entregado': 'info',
            'pagado': 'success'
        };
        
        const cls = badges[estado] || 'secondary';
        const label = estado.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `<span class="badge badge-${cls}">${this.escapeHtml(label)}</span>`;
    }

    // ========== LOADING STATES ==========
    static setLoading(btn, loading) {
        if (!btn) return;
        if (loading) {
            btn.disabled = true;
            btn.dataset.originalHtml = btn.innerHTML;
            btn.innerHTML = '<span class="spinner"></span> Cargando...';
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalHtml || btn.innerHTML;
        }
    }

    static showLoading(container, message = 'Cargando...') {
        if (!container) return;
        container.innerHTML = `
            <div class="loading">
                <div class="spinner" style="width: 40px; height: 40px; border-width: 3px;"></div>
                <span>${this.escapeHtml(message)}</span>
            </div>
        `;
    }

    // ========== UTILITIES ==========
    static escapeHtml(text) {
        if (text === null || text === undefined) return '';
        return String(text)
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '"')
            .replace(/'/g, '&#039;');
    }

    static debounce(fn, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => fn(...args), delay);
        };
    }

    static formatRelativeTime(dateStr) {
        if (!dateStr) return '—';
        const date = new Date(dateStr);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes} min`;
        if (hours < 24) return `Hace ${hours} h`;
        if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`;
        return this.formatDate(dateStr);
    }
}

// Inject base styles for toast/modal
const style = document.createElement('style');
style.textContent = `
/* Toast animations */
.toast { 
    transform: translateX(120%); 
    opacity: 0; 
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s; 
}
.toast.show { 
    transform: translateX(0); 
    opacity: 1; 
}

/* Modal animations */
.modal-overlay { 
    opacity: 0; 
    visibility: hidden; 
    transition: opacity 0.2s, visibility 0.2s; 
}
.modal-overlay.show { 
    opacity: 1; 
    visibility: visible; 
}
.modal { 
    transform: scale(0.95); 
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
}
.modal-overlay.show .modal { 
    transform: scale(1); 
}

/* Loading spinner */
.spinner { 
    border: 2px solid transparent; 
    border-top-color: currentColor; 
    border-radius: 50%; 
    animation: spin 0.8s linear infinite; 
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Form validation styles */
.form-group input:invalid:not(:placeholder-shown),
.form-group select:invalid:not(:placeholder-shown),
.form-group textarea:invalid:not(:placeholder-shown) {
    border-color: #e74c3c;
}
.form-group input:valid:not(:placeholder-shown),
.form-group select:valid:not(:placeholder-shown) {
    border-color: #27ae60;
}

/* Focus visible for accessibility */
.btn:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible,
a:focus-visible {
    outline: 2px solid #3498db;
    outline-offset: 2px;
}

/* Text utilities */
.text-muted { color: #95a5a6; }
.text-danger { color: #e74c3c; }
.text-success { color: #27ae60; }
.text-primary { color: #2c3e50; }

/* Animations */
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.fade-in { animation: fadeIn 0.3s ease; }
`;
document.head.appendChild(style);

window.UI = UI;