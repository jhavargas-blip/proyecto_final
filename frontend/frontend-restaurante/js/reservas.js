// ============================================
// RESERVAS MODULE - CRUD + Búsqueda + Cancelar
// ============================================

class ReservasModule {
    constructor() {
        this.reservas = [];
        this.mesas = [];
        this.estados = ['pendiente', 'confirmada', 'cancelada', 'finalizada'];
    }

    async load() {
        UI.showLoading(document.getElementById('reservas-table'), 'Cargando reservas...');
        try {
            [this.reservas, this.mesas] = await Promise.all([
                api.getReservas(),
                api.getMesas()
            ]);
            this.render();
        } catch (e) {
            UI.showError('Error al cargar: ' + e.message);
        }
    }

    async search(filters) {
        UI.showLoading(document.getElementById('reservas-table'), 'Buscando...');
        try {
            this.reservas = await api.searchReservas(filters);
            this.render();
        } catch (e) {
            UI.showError('Error al buscar: ' + e.message);
        }
    }

    render() {
        const columns = [
            { key: 'id', label: 'ID', render: (r) => `#${r.id}` },
            { key: 'nombre_cliente', label: 'Cliente' },
            { key: 'telefono_cliente', label: 'Teléfono' },
            { key: 'cantidad_personas', label: 'Personas', render: (r) => `${r.cantidad_personas} 👥` },
            { key: 'fecha', label: 'Fecha', render: (r) => UI.formatDate(r.fecha) },
            { key: 'hora', label: 'Hora', render: (r) => UI.formatTime(r.hora) },
            { key: 'mesa', label: 'Mesa', render: (r) => r.mesa ? `<strong>${r.mesa.numero}</strong> (${r.mesa.capacidad} pers.)` : '—' },
            { key: 'estado', label: 'Estado', render: (r) => UI.getEstadoBadge(r.estado) },
            { key: 'created_at', label: 'Registrada', render: (r) => UI.formatRelativeTime(r.created_at) }
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
                <input type="date" id="search-fecha" title="Filtrar por fecha">
                <input type="text" id="search-cliente" placeholder="Nombre cliente" title="Buscar por nombre">
                <select id="search-estado" title="Filtrar por estado">
                    <option value="">Todos los estados</option>
                    ${this.estados.map(e => `<option value="${e}">${e.charAt(0).toUpperCase() + e.slice(1)}</option>`).join('')}
                </select>
                <button class="btn btn-primary" id="btn-search" title="Buscar">🔍 Buscar</button>
                <button class="btn btn-secondary" id="btn-clear-search" title="Limpiar filtros">Limpiar</button>
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

    openCreateModal() {
        const mesasDisponibles = this.mesas.filter(m => m.estado !== 'fuera_servicio');
        
        if (mesasDisponibles.length === 0) {
            UI.showWarning('No hay mesas disponibles para reservar');
            return;
        }

        const hoy = new Date().toISOString().split('T')[0];

        const fields = [
            { name: 'nombre_cliente', label: 'Nombre del cliente *', required: true, placeholder: 'Juan Pérez' },
            { name: 'telefono_cliente', label: 'Teléfono *', required: true, placeholder: '300 123 4567' },
            { name: 'cantidad_personas', label: 'Cantidad de personas *', type: 'number', required: true, value: '2', placeholder: '2' },
            { name: 'fecha', label: 'Fecha *', type: 'date', required: true, value: hoy },
            { name: 'hora', label: 'Hora *', type: 'time', required: true, value: '19:00' },
            { name: 'mesa_id', label: 'Mesa *', type: 'select', required: true,
                options: mesasDisponibles.map(m => ({ value: m.id, label: `${m.numero} (Cap: ${m.capacidad})` })) },
            { name: 'observaciones', label: 'Observaciones', type: 'textarea', placeholder: 'Alergias, ocasión especial, etc.' }
        ];

        UI.createFormModal('Nueva Reserva', fields, async (data) => {
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

    openEditModal(id) {
        const reserva = this.reservas.find(r => r.id == id);
        if (!reserva) return;

        const mesasDisponibles = this.mesas.filter(m => m.estado !== 'fuera_servicio' || m.id == reserva.mesa_id);
        
        const fields = [
            { name: 'nombre_cliente', label: 'Nombre del cliente *', required: true, value: reserva.nombre_cliente },
            { name: 'telefono_cliente', label: 'Teléfono *', required: true, value: reserva.telefono_cliente },
            { name: 'cantidad_personas', label: 'Cantidad de personas *', type: 'number', required: true, value: reserva.cantidad_personas },
            { name: 'fecha', label: 'Fecha *', type: 'date', required: true, value: reserva.fecha },
            { name: 'hora', label: 'Hora *', type: 'time', required: true, value: UI.formatTime(reserva.hora) },
            { name: 'mesa_id', label: 'Mesa *', type: 'select', required: true, value: reserva.mesa_id,
                options: mesasDisponibles.map(m => ({ value: m.id, label: `${m.numero} (Cap: ${m.capacidad})`, selected: m.id == reserva.mesa_id })) },
            { name: 'observaciones', label: 'Observaciones', type: 'textarea', value: reserva.observaciones || '' },
            { name: 'estado', label: 'Estado *', type: 'select', required: true, value: reserva.estado,
                options: this.estados.map(e => ({ value: e, label: e.charAt(0).toUpperCase() + e.slice(1), selected: e === reserva.estado })) }
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
        const reserva = this.reservas.find(r => r.id == id);
        if (!reserva) return;

        if (reserva.estado === 'cancelada') {
            UI.showWarning('Esta reserva ya está cancelada');
            return;
        }
        if (reserva.estado === 'finalizada') {
            UI.showError('No se puede cancelar una reserva finalizada');
            return;
        }

        UI.createModal('Cancelar Reserva', 
            `¿Cancelar la reserva de <strong>${this.escapeHtml(reserva.nombre_cliente)}</strong>?<br><small>La mesa quedará disponible si no hay otras reservas.</small>`, 
            async () => {
                try {
                    await api.cancelReserva(id);
                    UI.showSuccess('Reserva cancelada correctamente');
                    this.load();
                } catch (e) {
                    UI.showError(e.message);
                }
            }, 'Cancelar Reserva', 'btn-warning');
    }

    async deleteReserva(id) {
        UI.createModal('Eliminar Reserva', 
            '¿Eliminar definitivamente esta reserva?<br><small class="text-danger">Esta acción no se puede deshacer.</small>', 
            async () => {
                try {
                    await api.deleteReserva(id);
                    UI.showSuccess('Reserva eliminada');
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

window.reservasModule = new ReservasModule();