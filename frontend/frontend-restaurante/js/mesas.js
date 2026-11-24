// Módulo de gestión de mesas
class MesasModule {
    constructor() {
        this.mesas = [];
        this.estados = ['disponible', 'reservada', 'ocupada', 'fuera_servicio'];
    }

    async load() {
        try {
            this.mesas = await api.getMesas();
            this.render();
        } catch (e) {
            UI.showError('Error al cargar mesas: ' + e.message);
        }
    }

    render() {
        const columns = [
            { key: 'numero', label: 'Número' },
            { key: 'capacidad', label: 'Capacidad' },
            { key: 'estado', label: 'Estado', render: (row) => UI.getEstadoBadge(row.estado) }
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
            { name: 'numero', label: 'Número/Nombre', required: true, placeholder: 'Ej: MESA-1' },
            { name: 'capacidad', label: 'Capacidad', type: 'number', required: true, placeholder: '4' },
            { name: 'estado', label: 'Estado inicial', type: 'select', required: true, 
                options: this.estados.map(e => ({ value: e, label: e })) }
        ];

        UI.createFormModal('Crear Mesa', fields, async (data) => {
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
            { name: 'numero', label: 'Número/Nombre', required: true, value: mesa.numero },
            { name: 'capacidad', label: 'Capacidad', type: 'number', required: true, value: mesa.capacidad },
            { name: 'estado', label: 'Estado', type: 'select', required: true, value: mesa.estado,
                options: this.estados.map(e => ({ value: e, label: e, selected: e === mesa.estado })) }
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
                options: this.estados.map(e => ({ value: e, label: e, selected: e === mesa.estado })) }
        ];

        UI.createFormModal(`Cambiar estado - ${mesa.numero}`, fields, async (data) => {
            try {
                await api.changeMesaState(id, data.estado);
                UI.showSuccess('Estado actualizado correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        });
    }

    async deleteMesa(id) {
        const mesa = this.mesas.find(m => m.id == id);
        if (!mesa) return;

        UI.createModal('Eliminar Mesa', `¿Eliminar la mesa ${mesa.numero}?`, async () => {
            try {
                await api.deleteMesa(id);
                UI.showSuccess('Mesa eliminada correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        }, 'Eliminar');
    }
}

window.mesasModule = new MesasModule();