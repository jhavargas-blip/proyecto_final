// Módulo de gestión de categorías
class CategoriasModule {
    constructor() {
        this.categorias = [];
    }

    async load() {
        try {
            this.categorias = await api.getCategorias();
            this.render();
        } catch (e) {
            UI.showError('Error al cargar categorías: ' + e.message);
        }
    }

    render() {
        const columns = [
            { key: 'nombre', label: 'Nombre' },
            { key: 'descripcion', label: 'Descripción', render: (r) => r.descripcion || '-' },
            { key: 'productos_count', label: 'Productos', render: (r) => r.productos_count || 0 }
        ];

        const actions = [
            { label: 'Editar', class: 'btn-primary', action: 'edit', handler: (id) => this.openEditModal(id) },
            { label: 'Eliminar', class: 'btn-danger', action: 'delete', handler: (id) => this.deleteCategoria(id) }
        ];

        UI.renderTable('categorias-table', columns, this.categorias, actions);
    }

    openCreateModal() {
        const fields = [
            { name: 'nombre', label: 'Nombre', required: true, placeholder: 'Ej: Entradas' },
            { name: 'descripcion', label: 'Descripción', type: 'textarea', placeholder: 'Descripción opcional' }
        ];

        UI.createFormModal('Crear Categoría', fields, async (data) => {
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
            { name: 'nombre', label: 'Nombre', required: true, value: categoria.nombre },
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

        UI.createModal('Eliminar Categoría', `¿Eliminar la categoría "${categoria.nombre}"?`, async () => {
            try {
                await api.deleteCategoria(id);
                UI.showSuccess('Categoría eliminada correctamente');
                this.load();
            } catch (e) {
                UI.showError(e.message);
            }
        }, 'Eliminar');
    }
}

window.categoriasModule = new CategoriasModule();