// Utilidades de UI: notificaciones, modales, tablas, formularios
class UI {
    static showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container') || UI.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        toast.querySelector('.toast-close').onclick = () => toast.remove();
        container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            display: flex; flex-direction: column; gap: 10px;
        `;
        document.body.appendChild(container);
        return container;
    }

    static showError(message) {
        UI.showToast(message, 'error', 5000);
    }

    static showSuccess(message) {
        UI.showToast(message, 'success');
    }

    static showWarning(message) {
        UI.showToast(message, 'warning');
    }

    static createModal(title, content, onConfirm, confirmText = 'Confirmar') {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">${content}</div>
                <div class="modal-footer">
                    <button class="btn btn-secondary modal-cancel">Cancelar</button>
                    <button class="btn btn-primary modal-confirm">${confirmText}</button>
                </div>
            </div>
        `;

        const close = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.modal-close').onclick = close;
        modal.querySelector('.modal-cancel').onclick = close;
        modal.querySelector('.modal-confirm').onclick = () => {
            if (onConfirm) onConfirm();
            close();
        };
        modal.onclick = (e) => { if (e.target === modal) close(); };

        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        return modal;
    }

    static createFormModal(title, fields, onSubmit) {
        const formHtml = fields.map(f => `
            <div class="form-group">
                <label for="${f.name}">${f.label}${f.required ? ' *' : ''}</label>
                <input type="${f.type || 'text'}" id="${f.name}" name="${f.name}" 
                    ${f.required ? 'required' : ''} ${f.placeholder ? `placeholder="${f.placeholder}"` : ''}
                    value="${f.value || ''}" ${f.readonly ? 'readonly' : ''}>
                ${f.options ? `<select id="${f.name}" name="${f.name}" ${f.required ? 'required' : ''}>
                    ${f.options.map(o => `<option value="${o.value}" ${o.selected ? 'selected' : ''}>${o.label}</option>`).join('')}
                </select>` : ''}
            </div>
        `).join('');

        return UI.createModal(title, `<form id="modal-form">${formHtml}</form>`, () => {
            const form = document.getElementById('modal-form');
            const data = {};
            new FormData(form).forEach((v, k) => data[k] = v);
            onSubmit(data);
        }, 'Guardar');
    }

    static renderTable(containerId, columns, data, actions = []) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const thead = columns.map(c => `<th>${c.label}</th>`).join('');
        const tbody = data.map(row => {
            const cells = columns.map(c => {
                let value = c.render ? c.render(row) : row[c.key];
                return `<td>${value ?? ''}</td>`;
            }).join('');
            const actionCells = actions.map(a => 
                `<td><button class="btn btn-sm ${a.class}" data-id="${row.id}" data-action="${a.action}">${a.label}</button></td>`
            ).join('');
            return `<tr>${cells}${actionCells}</tr>`;
        }).join('');

        container.innerHTML = `
            <table class="data-table">
                <thead><tr>${thead}${actions.length ? '<th>Acciones</th>' : ''}</tr></thead>
                <tbody>${tbody}</tbody>
            </table>
        `;

        actions.forEach(a => {
            container.querySelectorAll(`[data-action="${a.action}"]`).forEach(btn => {
                btn.onclick = () => a.handler(btn.dataset.id);
            });
        });
    }

    static populateSelect(selectId, options, valueKey = 'id', labelKey = 'nombre', selectedValue = null) {
        const select = document.getElementById(selectId);
        if (!select) return;
        
        const currentValue = select.value;
        select.innerHTML = '<option value="">Seleccionar...</option>' + 
            options.map(o => `<option value="${o[valueKey]}" ${o[valueKey] == selectedValue ? 'selected' : ''}>${o[labelKey]}</option>`).join('');
        select.value = currentValue;
    }

    static formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES');
    }

    static formatTime(timeStr) {
        if (!timeStr) return '';
        return timeStr.substring(0, 5);
    }

    static formatCurrency(value) {
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value);
    }

    static getEstadoBadge(estado) {
        const badges = {
            'disponible': 'badge-success',
            'reservada': 'badge-warning',
            'ocupada': 'badge-danger',
            'fuera_servicio': 'badge-secondary',
            'pendiente': 'badge-warning',
            'confirmada': 'badge-info',
            'cancelada': 'badge-secondary',
            'finalizada': 'badge-success',
            'en_preparacion': 'badge-warning',
            'entregado': 'badge-info',
            'pagado': 'badge-success'
        };
        const cls = badges[estado] || 'badge-secondary';
        return `<span class="badge ${cls}">${estado.replace('_', ' ')}</span>`;
    }

    static setLoading(btn, loading) {
        if (loading) {
            btn.disabled = true;
            btn.dataset.originalText = btn.innerHTML;
            btn.innerHTML = '<span class="spinner"></span> Cargando...';
        } else {
            btn.disabled = false;
            btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
        }
    }
}

// Estilos inline para toasts y modales
const style = document.createElement('style');
style.textContent = `
.toast { padding: 12px 20px; border-radius: 4px; display: flex; justify-content: space-between; gap: 10px; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); transform: translateX(100%); opacity: 0; transition: all 0.3s; min-width: 250px; }
.toast.show { transform: translateX(0); opacity: 1; }
.toast-success { background: #27ae60; color: white; }
.toast-error { background: #e74c3c; color: white; }
.toast-warning { background: #f39c12; color: white; }
.toast-info { background: #3498db; color: white; }
.toast-close { background: none; border: none; color: inherit; font-size: 18px; cursor: pointer; opacity: 0.7; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); 
    display: flex; align-items: center; justify-content: center; z-index: 10000; opacity: 0; visibility: hidden; transition: all 0.3s; }
.modal-overlay.show { opacity: 1; visibility: visible; }
.modal { background: white; border-radius: 8px; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; 
    transform: scale(0.9); transition: transform 0.3s; }
.modal-overlay.show .modal { transform: scale(1); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid #eee; }
.modal-close { background: none; border: none; font-size: 24px; cursor: pointer; }
.modal-body { padding: 1rem; }
.modal-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 1rem; border-top: 1px solid #eee; }
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 4px; }
.data-table { width: 100%; border-collapse: collapse; }
.data-table th, .data-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #eee; }
.data-table th { background: #f8f9fa; font-weight: 600; }
.btn { padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-size: 0.875rem; }
.btn-primary { background: #2c3e50; color: white; }
.btn-secondary { background: #95a5a6; color: white; }
.btn-danger { background: #e74c3c; color: white; }
.btn-sm { padding: 0.25rem 0.5rem; font-size: 0.75rem; }
.badge { padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
.badge-success { background: #d4edda; color: #155724; }
.badge-warning { background: #fff3cd; color: #856404; }
.badge-danger { background: #f8d7da; color: #721c24; }
.badge-info { background: #d1ecf1; color: #0c5460; }
.badge-secondary { background: #e2e3e5; color: #383d41; }
.spinner { display: inline-block; width: 12px; height: 12px; border: 2px solid #fff; border-right-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px; }
@keyframes spin { to { transform: rotate(360deg); } }
`;
document.head.appendChild(style);

window.UI = UI;