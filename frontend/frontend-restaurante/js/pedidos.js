// Módulo de gestión de pedidos
class PedidosModule {
    constructor() {
        this.pedidos = [];
        this.mesas = [];
        this.productos = [];
        this.estados = ['pendiente', 'en_preparacion', 'entregado', 'pagado', 'cancelado'];
        this.currentPedidoId = null;
    }

    async load() {
        try {
            [this.pedidos, this.mesas, this.productos] = await Promise.all([
                api.getPedidos(),
                api.getMesas(),
                api.getProductos()
            ]);
            this.render();
        } catch (e) {
            UI.showError('Error al cargar pedidos: ' + e.message);
        }
    }

    async search(filters) {
        try {
            this.pedidos = await api.searchPedidos(filters);
            this.render();
        } catch (e) {
            UI.showError('Error al buscar: ' + e.message);
        }
    }

    render() {
        const columns = [
            { key: 'id', label: 'ID' },
            { key: 'mesa_id', label: 'Mesa', render: (r) => `Mesa ${r.mesa_id}` },
            { key: 'fecha', label: 'Fecha', render: (r) => UI.formatDate(r.fecha) },
            { key: 'hora', label: 'Hora', render: (r) => UI.formatTime(r.hora) },
            { key: 'total', label: 'Total', render: (r) => UI.formatCurrency(r.total) },
            { key: 'estado', label: 'Estado', render: (r) => UI.getEstadoBadge(r.estado) },
            { key: 'detalles', label: 'Productos', render: (r) => 
                r.detalles?.map(d => `${d.nombre_producto} x${d.cantidad}`).join(', ') || '-' }
        ];

        const actions = [
            { label: 'Ver/Editar', class: 'btn-primary', action: 'view', handler: (id) => this.openDetailModal(id) },
            { label: 'Estado', class: 'btn-warning', action: 'state', handler: (id) => this.openStateModal(id) },
            { label: 'Eliminar', class: 'btn-danger', action: 'delete', handler: (id) => this.deletePedido(id) }
        ];

        UI.renderTable('pedidos-table', columns, this.pedidos, actions);
        this.renderSearchForm();
    }

    renderSearchForm() {
        const container = document.getElementById('pedidos-search');
        if (!container) return;

        container.innerHTML = `
            <div class="search-form">
                <select id="search-estado">
                    <option value="">Todos los estados</option>
                    ${this.estados.map(e => `<option value="${e}">${e}</option>`).join('')}
                </select>
                <select id="search-mesa">
                    <option value="">Todas las mesas</option>
                    ${this.mesas.map(m => `<option value="${m.id}">${m.numero}</option>`).join('')}
                </select>
                <input type="date" id="search-fecha" placeholder="Fecha">
                <button class="btn btn-primary" id="btn-search">Buscar</button>
                <button class="btn btn-secondary" id="btn-clear-search">Limpiar</button>
            </div>
        `;

        document.getElementById('btn-search').onclick = () => this.doSearch();
        document.getElementById('btn-clear-search').onclick = () => {
            document.getElementById('search-estado').value = '';
            document.getElementById('search-mesa').value = '';
            document.getElementById('search-fecha').value = '';
            this.load();
        };
    }

    doSearch() {
        const filters = {};
        const estado = document.getElementById('search-estado').value;
        const mesa_id = document.getElementById('search-mesa').value;
        const fecha = document.getElementById('search-fecha').value;
        
        if (estado) filters.estado = estado;
        if (mesa_id) filters.mesa_id = parseInt(mesa_id);
        if (fecha) filters.fecha = fecha;
        
        this.search(filters);
    }

    async openCreateModal() {
        const mesasOcupadas = this.mesas.filter(m => m.estado !== 'disponible');
        const productosDisponibles = this.productos.filter(p => p.disponible);

        const fields = [
            { name: 'mesa_id', label: 'Mesa', type: 'select', required: true,
                options: mesasOcupadas.map(m => ({ value: m.id, label: `${m.numero} (${m.estado})` })) },
            { name: 'fecha', label: 'Fecha', type: 'date', required: true, value: new Date().toISOString().split('T')[0] },
            { name: 'hora', label: 'Hora', type: 'time', required: true, value: new Date().toTimeString().substring(0,5) }
        ];

        UI.createFormModal('Crear Pedido - Paso 1: Mesa', fields, async (data) => {
            data.mesa_id = parseInt(data.mesa_id);
            this.currentPedidoId = null;
            await this.openProductosModal(data);
        });
    }

    async openProductosModal(pedidoData) {
        const productosDisponibles = this.productos.filter(p => p.disponible);

        const content = `
            <div>
                <h4>Productos del pedido</h4>
                <div id="pedido-detalles-list" class="pedido-detalles"></div>
                <hr>
                <div class="producto-selector">
                    <select id="add-producto-select">
                        <option value="">Seleccionar producto</option>
                        ${productosDisponibles.map(p => 
                            `<option value="${p.id}" data-precio="${p.precio}" data-nombre="${p.nombre}">${p.nombre} - ${UI.formatCurrency(p.precio)}</option>`
                        ).join('')}
                    </select>
                    <input type="number" id="add-cantidad" value="1" min="1" style="width: 80px;">
                    <button class="btn btn-primary btn-sm" id="btn-add-producto">Agregar</button>
                </div>
                <div class="pedido-totales" style="margin-top: 1rem; text-align: right;">
                    <strong>Subtotal: </strong><span id="pedido-subtotal">$0</span><br>
                    <strong>Total: </strong><span id="pedido-total">$0</span>
                </div>
            </div>
        `;

        const modal = UI.createModal('Crear Pedido - Paso 2: Productos', content, async () => {
            const detalles = Array.from(document.querySelectorAll('#pedido-detalles-list .detalle-item'))
                .map(el => ({
                    producto_id: parseInt(el.dataset.productoId),
                    nombre_producto: el.dataset.nombre,
                    cantidad: parseInt(el.querySelector('.detalle-cantidad').value),
                    precio_unitario: parseFloat(el.dataset.precio)
                }));

            if (detalles.length === 0) {
                UI.showWarning('Debe agregar al menos un producto');
                return false;
            }

            try {
                const data = { ...pedidoData, productos: detalles };
                await api.createPedido(data);
                UI.showSuccess('Pedido creado correctamente');
                this.load();
                return true;
            } catch (e) {
                UI.showError(e.message);
                return false;
            }
        }, 'Crear Pedido');

        // Eventos del modal
        setTimeout(() => {
            const select = document.getElementById('add-producto-select');
            const cantidad = document.getElementById('add-cantidad');
            const btnAdd = document.getElementById('btn-add-producto');

            btnAdd.onclick = () => {
                const option = select.options[select.selectedIndex];
                if (!option.value) return;

                this.addDetalleToList(option.value, option.dataset.nombre, parseFloat(option.dataset.precio), parseInt(cantidad.value));
                this.updateTotales();
                cantidad.value = 1;
            };
        }, 100);
    }

    addDetalleToList(productoId, nombre, precio, cantidad) {
        const container = document.getElementById('pedido-detalles-list');
        const existing = container.querySelector(`[data-producto-id="${productoId}"]`);
        
        if (existing) {
            const input = existing.querySelector('.detalle-cantidad');
            input.value = parseInt(input.value) + cantidad;
        } else {
            const div = document.createElement('div');
            div.className = 'detalle-item';
            div.dataset.productoId = productoId;
            div.dataset.nombre = nombre;
            div.dataset.precio = precio;
            div.innerHTML = `
                <span>${nombre} - ${UI.formatCurrency(precio)}</span>
                <input type="number" class="detalle-cantidad" value="${cantidad}" min="1" style="width: 60px;">
                <span>${UI.formatCurrency(precio * cantidad)}</span>
                <button class="btn btn-danger btn-sm" onclick="this.closest('.detalle-item').remove(); pedidosModule.updateTotales()">✕</button>
            `;
            container.appendChild(div);
        }
        this.updateTotales();
    }

    updateTotales() {
        const items = document.querySelectorAll('#pedido-detalles-list .detalle-item');
        let subtotal = 0;
        items.forEach(item => {
            const cantidad = parseInt(item.querySelector('.detalle-cantidad').value);
            const precio = parseFloat(item.dataset.precio);
            subtotal += cantidad * precio;
            item.querySelector('span:nth-child(3)').textContent = UI.formatCurrency(cantidad * precio);
        });
        document.getElementById('pedido-subtotal').textContent = UI.formatCurrency(subtotal);
        document.getElementById('pedido-total').textContent = UI.formatCurrency(subtotal);
    }

    async openDetailModal(id) {
        const pedido = this.pedidos.find(p => p.id == id);
        if (!pedido) return;

        this.currentPedidoId = id;
        const mesasOcupadas = this.mesas.filter(m => m.estado !== 'disponible' || m.id == pedido.mesa_id);
        const productosDisponibles = this.productos.filter(p => p.disponible);

        const content = `
            <div>
                <div class="form-group">
                    <label>Mesa</label>
                    <select id="edit-mesa_id">
                        ${mesasOcupadas.map(m => `<option value="${m.id}" ${m.id == pedido.mesa_id ? 'selected' : ''}>${m.numero} (${m.estado})</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Fecha</label>
                    <input type="date" id="edit-fecha" value="${pedido.fecha}">
                </div>
                <div class="form-group">
                    <label>Hora</label>
                    <input type="time" id="edit-hora" value="${UI.formatTime(pedido.hora)}">
                </div>
                <div class="form-group">
                    <label>Estado</label>
                    <select id="edit-estado">
                        ${this.estados.map(e => `<option value="${e}" ${e === pedido.estado ? 'selected' : ''}>${e}</option>`).join('')}
                    </select>
                </div>
                <hr>
                <h4>Productos</h4>
                <div id="edit-detalles-list" class="pedido-detalles"></div>
                <hr>
                <div class="producto-selector">
                    <select id="edit-add-producto-select">
                        <option value="">Agregar producto</option>
                        ${productosDisponibles.map(p => 
                            `<option value="${p.id}" data-precio="${p.precio}" data-nombre="${p.nombre}">${p.nombre} - ${UI.formatCurrency(p.precio)}</option>`
                        ).join('')}
                    </select>
                    <input type="number" id="edit-add-cantidad" value="1" min="1" style="width: 80px;">
                    <button class="btn btn-primary btn-sm" id="edit-btn-add-producto">Agregar</button>
                </div>
                <div class="pedido-totales" style="margin-top: 1rem; text-align: right;">
                    <strong>Subtotal: </strong><span id="edit-pedido-subtotal">$0</span><br>
                    <strong>Total: </strong><span id="edit-pedido-total">$0</span>
                </div>
            </div>
        `;

        const modal = UI.createModal(`Editar Pedido #${id}`, content, async () => {
            const data = {
                mesa_id: parseInt(document.getElementById('edit-mesa_id').value),
                fecha: document.getElementById('edit-fecha').value,
                hora: document.getElementById('edit-hora').value,
                estado: document.getElementById('edit-estado').value
            };

            try {
                await api.updatePedido(id, data);
                UI.showSuccess('Pedido actualizado correctamente');
                this.load();
                return true;
            } catch (e) {
                UI.showError(e.message);
                return false;
            }
        }, 'Guardar Cambios');

        // Renderizar detalles existentes
        setTimeout(() => {
            const container = document.getElementById('edit-detalles-list');
            if (pedido.detalles) {
                pedido.detalles.forEach(d => this.renderEditDetalle(d));
            }
            this.updateEditTotales();

            // Eventos
            document.getElementById('edit-btn-add-producto').onclick = () => {
                const select = document.getElementById('edit-add-producto-select');
                const option = select.options[select.selectedIndex];
                if (!option.value) return;
                this.addEditDetalle(option.value, option.dataset.nombre, parseFloat(option.dataset.precio), 
                    parseInt(document.getElementById('edit-add-cantidad').value));
                this.updateEditTotales();
                document.getElementById('edit-add-cantidad').value = 1;
            };
        }, 100);
    }

    renderEditDetalle(detalle) {
        const container = document.getElementById('edit-detalles-list');
        const div = document.createElement('div');
        div.className = 'detalle-item';
        div.dataset.detalleId = detalle.id;
        div.dataset.productoId = detalle.producto_id;
        div.dataset.nombre = detalle.nombre_producto;
        div.dataset.precio = detalle.precio_unitario;
        div.innerHTML = `
            <span>${detalle.nombre_producto} - ${UI.formatCurrency(detalle.precio_unitario)}</span>
            <input type="number" class="detalle-cantidad" value="${detalle.cantidad}" min="1" style="width: 60px;" 
                onchange="pedidosModule.updateDetalle(${this.currentPedidoId}, ${detalle.id}, this.value)">
            <span>${UI.formatCurrency(detalle.cantidad * detalle.precio_unitario)}</span>
            <button class="btn btn-danger btn-sm" onclick="pedidosModule.removeDetalle(${this.currentPedidoId}, ${detalle.id})">✕</button>
        `;
        container.appendChild(div);
    }

    async updateDetalle(pedidoId, detalleId, cantidad) {
        cantidad = parseInt(cantidad);
        if (cantidad < 1) return;
        
        try {
            await api.updatePedidoDetalle(pedidoId, detalleId, { cantidad });
            UI.showSuccess('Cantidad actualizada');
            this.load();
        } catch (e) {
            UI.showError(e.message);
            this.load();
        }
    }

    async removeDetalle(pedidoId, detalleId) {
        try {
            await api.removeProductoFromPedido(pedidoId, detalleId);
            UI.showSuccess('Producto eliminado del pedido');
            this.load();
        } catch (e) {
            UI.showError(e.message);
            this.load();
        }
    }

    updateEditTotales() {
        const items = document.querySelectorAll('#edit-detalles-list .detalle-item');
        let subtotal = 0;
        items.forEach(item => {
            const cantidad = parseInt(item.querySelector('.detalle-cantidad').value);
            const precio = parseFloat(item.dataset.precio);
            subtotal += cantidad * precio;
            item.querySelector('span:nth-child(3)').textContent = UI.formatCurrency(cantidad * precio);
        });
        document.getElementById('edit-pedido-subtotal').textContent = UI.formatCurrency(subtotal);
        document.getElementById('edit-pedido-total').textContent = UI.formatCurrency(subtotal);
    }

    addEditDetalle(productoId, nombre, precio, cantidad) {
        const container = document.getElementById('edit-detalles-list');
        const existing = container.querySelector(`[data-producto-id="${productoId}"]`);
        
        if (existing) {
            const input = existing.querySelector('.detalle-cantidad');
            input.value = parseInt(input.value) + cantidad;
            this.updateEditDetalleFromInput(existing);
        } else {
            const div = document.createElement('div');
            div.className = 'detalle-item';
            div.dataset.productoId = productoId;
            div.dataset.nombre = nombre;
            div.dataset.precio = precio;
            div.innerHTML = `
                <span>${nombre} - ${UI.formatCurrency(precio)}</span>
                <input type="number" class="detalle-cantidad" value="${cantidad}" min="1" style="width: 60px;">
                <span>${UI.formatCurrency(precio * cantidad)}</span>
                <button class="btn btn-danger btn-sm" onclick="this.closest('.detalle-item').remove(); pedidosModule.updateEditTotales()">✕</button>
            `;
            container.appendChild(div);
        }
        this.updateEditTotales();
    }

    updateEditDetalleFromInput(item) {
        const cantidad = parseInt(item.querySelector('.detalle-cantidad').value);
        const precio = parseFloat(item.dataset.precio);
        item.querySelector('span:nth-child(3)').textContent = UI.formatCurrency(cantidad * precio);
    }

    async openStateModal(id) {
        const pedido = this.pedidos.find(p => p.id == id);
        if (!pedido) return;

        const fields = [
            { name: 'estado', label: 'Nuevo estado', type: 'select', required: true, value: pedido.estado,
                options: this.estados.map(e => ({ value: e, label: e, selected: e === pedido.estado })) }
        ];

        UI.createFormModal(`Cambiar estado - Pedido #${id}`, fields, async (data) => {
            try {
                await api.changePedidoState(id, data.estado);
                UI.showSuccess('Estado actualizado correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        });
    }

    async deletePedido(id) {
        UI.createModal('Eliminar Pedido', `¿Eliminar definitivamente el pedido #${id}?`, async () => {
            try {
                await api.deletePedido(id);
                UI.showSuccess('Pedido eliminado correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        }, 'Eliminar');
    }
}

window.pedidosModule = new PedidosModule();