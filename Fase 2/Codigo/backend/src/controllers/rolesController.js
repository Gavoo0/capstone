const { rolesService } = require('../services');

const rolesController = {
    // GET /api/roles
    async getAll(req, res) {
        try {
            const roles = await rolesService.getAll();
            res.json(roles);
        } catch (error) {
            console.error('Error en rolesController.getAll:', error);
            res.status(500).json({ error: 'Error al obtener roles', detalle: error.message });
        }
    },

    // GET /api/roles/:id
    async getById(req, res) {
        try {
            const { id } = req.params;
            const rol = await rolesService.getById(id);
            if (!rol) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El rol con ID ${id} no existe.` });
            }
            res.json(rol);
        } catch (error) {
            console.error('Error en rolesController.getById:', error);
            res.status(500).json({ error: 'Error al obtener rol', detalle: error.message });
        }
    },

    // POST /api/roles
    async create(req, res) {
        try {
            const { nombreRol } = req.body;
            if (!nombreRol || !nombreRol.trim()) {
                return res.status(400).json({ error: 'Validación', mensaje: 'El campo nombreRol es obligatorio.' });
            }

            const nuevoRol = await rolesService.create(nombreRol.trim());
            res.status(201).json(nuevoRol);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Duplicado', mensaje: 'El nombre de rol ya se encuentra registrado.' });
            }
            console.error('Error en rolesController.create:', error);
            res.status(500).json({ error: 'Error al crear rol', detalle: error.message });
        }
    },

    // PUT /api/roles/:id
    async update(req, res) {
        try {
            const { id } = req.params;
            const { nombreRol } = req.body;

            if (!nombreRol || !nombreRol.trim()) {
                return res.status(400).json({ error: 'Validación', mensaje: 'El campo nombreRol es obligatorio.' });
            }

            const rolActualizado = await rolesService.update(id, nombreRol.trim());
            if (!rolActualizado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El rol con ID ${id} no existe.` });
            }

            res.json(rolActualizado);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Duplicado', mensaje: 'El nombre de rol ya está en uso.' });
            }
            console.error('Error en rolesController.update:', error);
            res.status(500).json({ error: 'Error al actualizar rol', detalle: error.message });
        }
    },

    // DELETE /api/roles/:id
    async delete(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await rolesService.delete(id);
            if (!eliminado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El rol con ID ${id} no existe.` });
            }
            res.json({ mensaje: `Rol con ID ${id} eliminado correctamente.` });
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({ error: 'Restricción', mensaje: 'No se puede eliminar el rol porque tiene usuarios asignados.' });
            }
            console.error('Error en rolesController.delete:', error);
            res.status(500).json({ error: 'Error al eliminar rol', detalle: error.message });
        }
    }
};

module.exports = rolesController;
