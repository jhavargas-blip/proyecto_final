// Módulo de gestión de reservas
class ReservasModule {
    constructor() {
        this.reservas = [];
        this.mesas = [];
        this.estados = ['pendiente', 'confirmada', 'cancelada', 'finalizada'];
    }

    async load() {
        try {
            [this.reservas, this.mesas] = await Promise.all([
                api.getReservas(),
                api.getMesas()
            ]);
            this.render();
        } catch (e) {
            UI.showError('Error al cargar reservas: ' + e.message);
        }
    }

    async search(filters) {
        try {
            this.reservas = await api.searchReservas(filters);
            this.render();
        } catch (e) {
            UI.showError('Error al buscar: ' + e.message);
        }
    }

    render() {
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'nombre_cliente', label: 'Cliente' },
            { key: 'telefono_cliente', label: 'Teléfono' },
            { key: 'cantidad_personas', label: 'Personas' },
            { key: 'fecha', label: 'Fecha', render: (r) => UI.formatDate(r.fecha) },
            { key: 'hora', label: 'Hora', render: (r) => UI.formatTime(r.hora) },
            { key: 'mesa', label: 'Mesa', render: (r) => r.mesa ? r.mesa.numero : 'N/A' },
            { key: 'estado', label: 'Estado', render: (r) => UI.getEstadoBadge(r.estado) }
        ];

        const actions = [
            { label: 'Editar', class: 'btn-primary', action: 'edit', handler: (id) => this.openEditModal(id) },
            { label: 'Cancelar', class: 'btn-warning', action: 'cancel', handler: (id) => this.cancelReserva(id) },
            { label: 'Eliminar', class: 'btn-danger', action: 'delete', handler: (id) => this.deleteReserva(id) }
        ];

        UI.renderTable('reservas-table', columns, this.reservas, actions);
        this.renderSearchForm();
    }

    renderSearchForm() {
        const container = document.getElementById('reservas-search');
        if (!container) return;

        container.innerHTML = `
            <div class="search-form">
                <input type="date" id="search-fecha" placeholder="Fecha">
                <input type="text" id="search-cliente" placeholder="Cliente">
                <select id="search-estado">
                    <option value="">Todos los estados</option>
                    ${this.estados.map(e => `<option value="${e}">${e}</option>`).join('')}
                </select>
                <button class="btn btn-primary" id="btn-search">Buscar</button>
                <button class="btn btn-secondary" id="btn-clear-search">Limpiar</button>
            </div>
        `;

        document.getElementById('btn-search').onclick = () => this.doSearch();
        document.getElementById('btn-clear-search').onclick = () => {
            document.getElementById('search-fecha').value = '';
            document.getElementById('search-cliente').value = '';
            document.getElementById('search-estado').value = '';
            this.load();
        };
    }

    doSearch() {
        const filters = {};
        const fecha = document.getElementById('search-fecha').value;
        const cliente = document.getElementById('search-cliente').value;
        const estado = document.getElementById('search-estado').value;
        
        if (fecha) filters.fecha = fecha;
        if (cliente) filters.nombre_cliente = cliente;
        if (estado) filters.estado = estado;
        
        this.search(filters);
    }

    async openCreateModal() {
        const mesasDisponibles = this.mesas.filter(m => m.estado !== 'fuera_servicio');
        
        const fields = [
            { name: 'nombre_cliente', label: 'Nombre del cliente', required: true },
            { name: 'telefono_cliente', label: 'Teléfono', required: true },
            { name: 'cantidad_personas', label: 'Cantidad de personas', type: 'number', required: true, value: 1 },
            { name: 'fecha', label: 'Fecha', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
            { name: 'hora', label: 'Hora', type: 'time', required: true, value: '19:00' },
            { name: 'mesa_id', label: 'Mesa', type: 'select', required: true,
                options: mesasDisponibles.map(m => ({ value: m.id, label: `${m.numero} (cap: ${m.capacidad})` })) },
            { name: 'observaciones', label: 'Observaciones', type: 'textarea' }
        ];

        UI.createFormModal('Crear Reserva', fields, async (data) => {
            data.cantidad_personas = parseInt(data.cantidad_personas);
            data.mesa_id = parseInt(data.mesa_id);
            try {
                await api.createReserva(data);
                UI.showSuccess('Reserva creada correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        });
    }

    async openEditModal(id) {
        const reserva = this.reservas.find(r => r.id == id);
        if (!reserva) return;

        const mesasDisponibles = this.mesas.filter(m => m.estado !== 'fuera_servicio' || m.id == reserva.mesa_id);
        
        const fields = [
            { name: 'nombre_cliente', label: 'Nombre del cliente', required: true, value: reserva.nombre_cliente },
            { name: 'telefono_cliente', label: 'Teléfono', required: true, value: reserva.telefono_cliente },
            { name: 'cantidad_personas', label: 'Cantidad de personas', type: 'number', required: true, value: reserva.cantidad_personas },
            { name: 'fecha', label: 'Fecha', type: 'date', required: true, value: reserva.fecha },
            { name: 'hora', label: 'Hora', type: 'time', required: true, value: UI.formatTime(reserva.hora) },
            { name: 'mesa_id', label: 'Mesa', type: 'select', required: true, value: reserva.mesa_id,
                options: mesasDisponibles.map(m => ({ value: m.id, label: `${m.numero} (cap: ${m.capacidad})`, selected: m.id == reserva.mesa_id })) },
            { name: 'observaciones', label: 'Observaciones', type: 'textarea', value: reserva.observaciones || '' },
            { name: 'estado', label: 'Estado', type: 'select', required: true, value: reserva.estado,
                options: this.estados.map(e => ({ value: e, label: e, selected: e === reserva.estado })) }
        ];

        UI.createFormModal('Editar Reserva', fields, async (data) => {
            data.cantidad_personas = parseInt(data.cantidad_personas);
            data.mesa_id = parseInt(data.mesa_id);
            try {
                await api.updateReserva(id, data);
                UI.showSuccess('Reserva actualizada correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        });
    }

    async cancelReserva(id) {
        UI.createModal('Cancelar Reserva', '¿Cancelar esta reserva?', async () => {
            try {
                await api.cancelReserva(id);
                UI.showSuccess('Reserva cancelada correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        }, 'Cancelar');
    }

    async deleteReserva(id) {
        UI.createModal('Eliminar Reserva', '¿Eliminar definitivamente esta reserva?', async () => {
            try {
                await api.deleteReserva(id);
                UI.showSuccess('Reserva eliminada correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        }, 'Eliminar');
    }
}

window.reservasModule = new ReservasModule();