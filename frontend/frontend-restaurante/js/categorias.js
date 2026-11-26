// ============================================
// CATEGORIAS MODULE - CRUD
// ============================================

class CategoriasModule {
    constructor() {
        this.categorias = [];
    }

    async load() {
        UI.showLoading(document.getElementById('categorias-table'), 'Cargando categorías...');
        try {
            this.categorias = await api.getCategorias();
            this.render();
        } catch (e) {
            UI.showError('Error al cargar: ' + e.message);
        }
    }

    render() {
        const columns = [
            { key: 'id', label: 'ID', render: (r) => `#${r.id}` },
            { key: 'nombre', label: 'Nombre', render: (r) => `<strong>${this.escapeHtml(r.nombre)}</strong>` },
            { key: 'descripcion', label: 'Descripción', render: (r) => r.descripcion || '<span class="text-muted">—</span>' },
            { key: 'productos_count', label: 'Productos', render: (r) => r.productos_count !== undefined ? r.productos_count : '—' }
        ];

        const actions = [
            { label: 'Editar', class: 'btn-primary', action: 'edit', handler: (id) => this.openEditModal(id) },
            { label: 'Eliminar', class: 'btn-danger', action: 'delete', handler: (id) => this.deleteCategoria(id) }
        ];

        UI.renderTable('categorias-table', columns, this.categorias, actions);
    }

    openCreateModal() {
        const fields = [
            { name: 'nombre', label: 'Nombre *', required: true, placeholder: 'Ej: Entradas, Bebidas, Postres...' },
            { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Descripción opcional' }
        ];

        UI.createFormModal('Nueva Categoría', fields, async (data) => {
            try {
                await api.createCategoria(data);
                UI.showSuccess('Categoría creada correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        });
    }

    openEditModal(id) {
        const categoria = this.categorias.find(c => c.id == id);
        if (!categoria) return;

        const fields = [
            { name: 'nombre', label: 'Nombre *', required: true, value: categoria.nombre },
            { name: 'descripcion', label: 'Descripción', type: 'textarea', value: categoria.descripcion || '' }
        ];

        UI.createFormModal('Editar Categoría', fields, async (data) => {
            try {
                await api.updateCategoria(id, data);
                UI.showSuccess('Categoría actualizada correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        });
    }

    async deleteCategoria(id) {
        const categoria = this.categorias.find(c => c.id == id);
        if (!categoria) return;

        UI.createModal('Eliminar Categoría', 
            `¿Eliminar la categoría <strong>${this.escapeHtml(categoria.nombre)}</strong>?<br><small class="text-danger">No se puede eliminar si tiene productos asociados.</small>`, 
            async () => {
                try {
                    await api.deleteCategoria(id);
                    UI.showSuccess('Categoría eliminada correctamente');
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

window.categoriasModule = new CategoriasModule();