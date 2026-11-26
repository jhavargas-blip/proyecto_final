// ============================================
// PRODUCTOS MODULE - CRUD + Búsqueda
// ============================================

class ProductosModule {
    constructor() {
        this.productos = [];
        this.categorias = [];
    }

    async load() {
        UI.showLoading(document.getElementById('productos-table'), 'Cargando productos...');
        try {
            [this.productos, this.categorias] = await Promise.all([
                api.getProductos(),
                api.getCategorias()
            ]);
            this.render();
        } catch (e) {
            UI.showError('Error al cargar: ' + e.message);
        }
    }

    async search(filters) {
        UI.showLoading(document.getElementById('productos-table'), 'Buscando...');
        try {
            this.productos = await api.searchProductos(filters);
            this.render();
        } catch (e) {
            UI.showError('Error al buscar: ' + e.message);
        }
    }

    render() {
        const columns = [
            { key: 'id', label: 'ID', render: (r) => `#${r.id}` },
            { key: 'nombre', label: 'Producto', render: (r) => `<strong>${this.escapeHtml(r.nombre)}</strong>` },
            { key: 'categoria', label: 'Categoría', render: (r) => r.categoria ? `<span class="badge badge-info">${this.escapeHtml(r.categoria.nombre)}</span>` : '—' },
            { key: 'precio', label: 'Precio', render: (r) => `<span class="currency">${UI.formatCurrency(r.precio)}</span>` },
            { key: 'disponible', label: 'Disponible', render: (r) => r.disponible 
                ? '<span class="badge badge-success">Sí</span>' 
                : '<span class="badge badge-secondary">No</span>' }
        ];

        const actions = [
            { label: 'Editar', class: 'btn-primary', action: 'edit', handler: (id) => this.openEditModal(id) },
            { label: 'Eliminar', class: 'btn-danger', action: 'delete', handler: (id) => this.deleteProducto(id) }
        ];

        UI.renderTable('productos-table', columns, this.productos, actions);
        this.renderSearchForm();
    }

    renderSearchForm() {
        const container = document.getElementById('productos-search');
        if (!container) return;

        container.innerHTML = `
            <div class="search-form">
                <input type="text" id="search-nombre" placeholder="Nombre del producto" title="Buscar por nombre">
                <select id="search-categoria" title="Filtrar por categoría">
                    <option value="">Todas las categorías</option>
                    ${this.categorias.map(c => `<option value="${c.id}">${this.escapeHtml(c.nombre)}</option>`).join('')}
                </select>
                <select id="search-disponible" title="Filtrar por disponibilidad">
                    <option value="">Todos</option>
                    <option value="true">Disponibles</option>
                    <option value="false">No disponibles</option>
                </select>
                <button class="btn btn-primary" id="btn-search">🔍 Buscar</button>
                <button class="btn btn-secondary" id="btn-clear-search">Limpiar</button>
            </div>
        `;

        document.getElementById('btn-search').onclick = () => this.doSearch();
        document.getElementById('btn-clear-search').onclick = () => {
            document.getElementById('search-nombre').value = '';
            document.getElementById('search-categoria').value = '';
            document.getElementById('search-disponible').value = '';
            this.load();
        };
    }

    doSearch() {
        const filters = {};
        const nombre = document.getElementById('search-nombre').value;
        const categoria_id = document.getElementById('search-categoria').value;
        const disponible = document.getElementById('search-disponible').value;
        
        if (nombre) filters.nombre = nombre;
        if (categoria_id) filters.categoria_id = parseInt(categoria_id);
        if (disponible !== '') filters.disponible = disponible === 'true';
        
        this.search(filters);
    }

    openCreateModal() {
        if (this.categorias.length === 0) {
            UI.showError('No hay categorías disponibles. Crea una categoría primero.');
            return;
        }

        const fields = [
            { name: 'nombre', label: 'Nombre *', required: true, placeholder: 'Ej: Pizza Margarita' },
            { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Ingredientes, detalles...' },
            { name: 'precio', label: 'Precio *', type: 'number', step: '100', required: true, placeholder: '25000', value: '0' },
            { name: 'categoria_id', label: 'Categoría *', type: 'select', required: true,
                options: this.categorias.map(c => ({ value: c.id, label: c.nombre })) },
            { name: 'disponible', label: 'Disponible', type: 'checkbox', value: true }
        ];

        UI.createFormModal('Nuevo Producto', fields, async (data) => {
            data.precio = parseFloat(data.precio);
            data.categoria_id = parseInt(data.categoria_id);
            data.disponible = data.disponible === 'on' || data.disponible === true;
            try {
                await api.createProducto(data);
                UI.showSuccess('Producto creado correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        });
    }

    openEditModal(id) {
        const producto = this.productos.find(p => p.id == id);
        if (!producto) return;

        const fields = [
            { name: 'nombre', label: 'Nombre *', required: true, value: producto.nombre },
            { name: 'descripcion', label: 'Descripción', type: 'textarea', value: producto.descripcion || '' },
            { name: 'precio', label: 'Precio *', type: 'number', step: '100', required: true, value: producto.precio },
            { name: 'categoria_id', label: 'Categoría *', type: 'select', required: true, value: producto.categoria_id,
                options: this.categorias.map(c => ({ value: c.id, label: c.nombre, selected: c.id == producto.categoria_id })) },
            { name: 'disponible', label: 'Disponible', type: 'checkbox', value: producto.disponible }
        ];

        UI.createFormModal('Editar Producto', fields, async (data) => {
            data.precio = parseFloat(data.precio);
            data.categoria_id = parseInt(data.categoria_id);
            data.disponible = data.disponible === 'on' || data.disponible === true;
            try {
                await api.updateProducto(id, data);
                UI.showSuccess('Producto actualizado correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        });
    }

    async deleteProducto(id) {
        const producto = this.productos.find(p => p.id == id);
        if (!producto) return;

        UI.createModal('Eliminar Producto', 
            `¿Eliminar el producto <strong>${this.escapeHtml(producto.nombre)}</strong>?<br><small class="text-danger">Esta acción no se puede deshacer.</small>`, 
            async () => {
                try {
                    await api.deleteProducto(id);
                    UI.showSuccess('Producto eliminado correctamente');
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

window.productosModule = new ProductosModule();