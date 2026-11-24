// Módulo de gestión de productos
class ProductosModule {
    constructor() {
        this.productos = [];
        this.categorias = [];
    }

    async load() {
        try {
            [this.productos, this.categorias] = await Promise.all([
                api.getProductos(),
                api.getCategorias()
            ]);
            this.render();
        } catch (e) {
            UI.showError('Error al cargar productos: ' + e.message);
        }
    }

    async search(filters) {
        try {
            this.productos = await api.searchProductos(filters);
            this.render();
        } catch (e) {
            UI.showError('Error al buscar: ' + e.message);
        }
    }

    render() {
        const columns = [
            { key: 'nombre', label: 'Nombre' },
            { key: 'categoria', label: 'Categoría', render: (r) => r.categoria?.nombre || 'N/A' },
            { key: 'precio', label: 'Precio', render: (r) => UI.formatCurrency(r.precio) },
            { key: 'disponible', label: 'Disponible', render: (r) => r.disponible ? '✓ Sí' : '✗ No' }
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
                <input type="text" id="search-nombre" placeholder="Nombre del producto">
                <select id="search-categoria">
                    <option value="">Todas las categorías</option>
                    ${this.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('')}
                </select>
                <select id="search-disponible">
                    <option value="">Todos</option>
                    <option value="true">Disponibles</option>
                    <option value="false">No disponibles</option>
                </select>
                <button class="btn btn-primary" id="btn-search">Buscar</button>
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

    async openCreateModal() {
        const fields = [
            { name: 'nombre', label: 'Nombre', required: true, placeholder: 'Ej: Hamburguesa Especial' },
            { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Descripción opcional' },
            { name: 'precio', label: 'Precio', type: 'number', step: '0.01', required: true, placeholder: '28000' },
            { name: 'categoria_id', label: 'Categoría', type: 'select', required: true,
                options: this.categorias.map(c => ({ value: c.id, label: c.nombre })) },
            { name: 'disponible', label: 'Disponible', type: 'checkbox', value: 'true' }
        ];

        UI.createFormModal('Crear Producto', fields, async (data) => {
            data.precio = parseFloat(data.precio);
            data.categoria_id = parseInt(data.categoria_id);
            data.disponible = data.disponible === 'on' || data.disponible === 'true';
            try {
                await api.createProducto(data);
                UI.showSuccess('Producto creado correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        });
    }

    async openEditModal(id) {
        const producto = this.productos.find(p => p.id == id);
        if (!producto) return;

        const fields = [
            { name: 'nombre', label: 'Nombre', required: true, value: producto.nombre },
            { name: 'descripcion', label: 'Descripción', type: 'textarea', value: producto.descripcion || '' },
            { name: 'precio', label: 'Precio', type: 'number', step: '0.01', required: true, value: producto.precio },
            { name: 'categoria_id', label: 'Categoría', type: 'select', required: true, value: producto.categoria_id,
                options: this.categorias.map(c => ({ value: c.id, label: c.nombre, selected: c.id == producto.categoria_id })) },
            { name: 'disponible', label: 'Disponible', type: 'checkbox', value: producto.disponible ? 'true' : '' }
        ];

        UI.createFormModal('Editar Producto', fields, async (data) => {
            data.precio = parseFloat(data.precio);
            data.categoria_id = parseInt(data.categoria_id);
            data.disponible = data.disponible === 'on' || data.disponible === 'true';
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

        UI.createModal('Eliminar Producto', `¿Eliminar el producto "${producto.nombre}"?`, async () => {
            try {
                await api.deleteProducto(id);
                UI.showSuccess('Producto eliminado correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        }, 'Eliminar');
    }
}

window.productosModule = new ProductosModule();