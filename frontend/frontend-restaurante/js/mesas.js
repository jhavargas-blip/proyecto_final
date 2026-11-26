// ============================================
// MESAS MODULE - CRUD + Estado
// ============================================

class MesasModule {
    constructor() {
        this.mesas = [];
        this.estados = ['disponible', 'reservada', 'ocupada', 'fuera_servicio'];
    }

    async load() {
        UI.showLoading(document.getElementById('mesas-table'), 'Cargando mesas...');
        try {
            this.mesas = await api.getMesas();
            this.render();
        } catch (e) {
            UI.showError('Error al cargar mesas: ' + e.message);
            document.getElementById('mesas-table').innerHTML = '';
        }
    }

    render() {
        const columns = [
            { key: 'numero', label: 'Número' },
            { key: 'capacidad', label: 'Capacidad', render: (r) => `${r.capacidad} personas` },
            { key: 'estado', label: 'Estado', render: (r) => UI.getEstadoBadge(r.estado) },
            { key: 'created_at', label: 'Creada', render: (r) => UI.formatRelativeTime(r.created_at) }
        ];

        const actions = [
            { label: 'Editar', class: 'btn-primary', action: 'edit', handler: (id) => this.openEditModal(id) },
            { label: 'Estado', class: 'btn-warning', action: 'state', handler: (id) => this.openStateModal(id) },
            { label: 'Eliminar', class: 'btn-danger', action: 'delete', handler: (id) => this.deleteMesa(id) }
        ];

        UI.renderTable('mesas-table', columns, this.mesas, actions);
    }

    openCreateModal() {
        const fields = [
            { name: 'numero', label: 'Número / Nombre', required: true, placeholder: 'Ej: MESA-5' },
            { name: 'capacidad', label: 'Capacidad', type: 'number', required: true, placeholder: '4', value: '4' },
            { name: 'estado', label: 'Estado inicial', type: 'select', required: true, value: 'disponible',
                options: this.estados.map(e => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1) })) }
        ];

        UI.createFormModal('Nueva Mesa', fields, async (data) => {
            data.capacidad = parseInt(data.capacidad);
            try {
                await api.createMesa(data);
                UI.showSuccess('Mesa creada correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        });
    }

    openEditModal(id) {
        const mesa = this.mesas.find(m => m.id == id);
        if (!mesa) return;

        const fields = [
            { name: 'numero', label: 'Número / Nombre', required: true, value: mesa.numero },
            { name: 'capacidad', label: 'Capacidad', type: 'number', required: true, value: mesa.capacidad },
            { name: 'estado', label: 'Estado', type: 'select', required: true, value: mesa.estado,
                options: this.estados.map(e => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1), selected: e === mesa.estado })) }
        ];

        UI.createFormModal('Editar Mesa', fields, async (data) => {
            data.capacidad = parseInt(data.capacidad);
            try {
                await api.updateMesa(id, data);
                UI.showSuccess('Mesa actualizada correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        });
    }

    openStateModal(id) {
        const mesa = this.mesas.find(m => m.id == id);
        if (!mesa) return;

        const fields = [
            { name: 'estado', label: 'Nuevo estado', type: 'select', required: true, value: mesa.estado,
                options: this.estados.map(e => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1), selected: e === mesa.estado })) }
        ];

        UI.createFormModal(`Cambiar Estado: ${mesa.numero}`, fields, async (data) => {
            try {
                await api.changeMesaState(id, data.estado);
                UI.showSuccess('Estado actualizado correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        }, 'Cambiar');
    }

    async deleteMesa(id) {
        const mesa = this.mesas.find(m => m.id == id);
        if (!mesa) return;

        UI.createModal('Eliminar Mesa', 
            `¿Estás seguro de eliminar la mesa <strong>${this.escapeHtml(mesa.numero)}</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`, 
            async () => {
                try {
                    await api.deleteMesa(id);
                    UI.showSuccess('Mesa eliminada correctamente');
                    this.load();
                } catch (e) {
                    UI.showError(e.message);
                }
            }, 'Eliminar', 'btn-danger');
    }

    escapeHtml(text) {
        return String(text).replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
    }
}

window.mesasModule = new MesasModule();