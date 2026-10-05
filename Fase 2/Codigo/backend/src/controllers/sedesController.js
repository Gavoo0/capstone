const { sedesService } = require('../services');

const sedesController = {
    // GET /api/sedes
    async getAll(req, res) {
        try {
            const sedes = await sedesService.getAll();
            res.json(sedes);
        } catch (error) {
            console.error('Error en sedesController.getAll:', error);
            res.status(500).json({ error: 'Error al obtener sedes', detalle: error.message });
        }
    },

    // GET /api/sedes/:id
    async getById(req, res) {
        try {
            const { id } = req.params;
            const sede = await sedesService.getById(id);
            if (!sede) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `La sede con ID ${id} no existe.` });
            }
            res.json(sede);
        } catch (error) {
            console.error('Error en sedesController.getById:', error);
            res.status(500).json({ error: 'Error al obtener sede', detalle: error.message });
        }
    },

    // POST /api/sedes
    async create(req, res) {
        try {
            const { nombre, direccion, telefono } = req.body;
            if (!nombre || !direccion) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Los campos nombre y dirección son obligatorios.'
                });
            }

            const nuevaSede = await sedesService.create({ nombre, direccion, telefono });
            res.status(201).json(nuevaSede);
        } catch (error) {
            console.error('Error en sedesController.create:', error);
            res.status(500).json({ error: 'Error al crear sede', detalle: error.message });
        }
    },

    // PUT /api/sedes/:id
    async update(req, res) {
        try {
            const { id } = req.params;
            const { nombre, direccion, telefono } = req.body;

            const sedeActualizada = await sedesService.update(id, { nombre, direccion, telefono });
            if (!sedeActualizada) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `La sede con ID ${id} no existe.` });
            }

            res.json(sedeActualizada);
        } catch (error) {
            console.error('Error en sedesController.update:', error);
            res.status(500).json({ error: 'Error al actualizar sede', detalle: error.message });
        }
    },

    // DELETE /api/sedes/:id
    async delete(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await sedesService.delete(id);
            if (!eliminado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `La sede con ID ${id} no existe.` });
            }
            res.json({ mensaje: `Sede con ID ${id} eliminada correctamente.` });
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({
                    error: 'Restricción de integridad',
                    mensaje: 'No se puede eliminar la sede porque tiene vehículos, clases o usuarios asociados.'
                });
            }
            console.error('Error en sedesController.delete:', error);
            res.status(500).json({ error: 'Error al eliminar sede', detalle: error.message });
        }
    },

    // GET /api/sedes/:id/vehiculos
    async getVehiculos(req, res) {
        try {
            const { id } = req.params;
            const vehiculos = await sedesService.getVehiculos(id);
            res.json(vehiculos);
        } catch (error) {
            console.error('Error en sedesController.getVehiculos:', error);
            res.status(500).json({ error: 'Error al obtener vehículos de la sede', detalle: error.message });
        }
    },

    // GET /api/sedes/:id/personal
    async getPersonal(req, res) {
        try {
            const { id } = req.params;
            const personal = await sedesService.getPersonal(id);
            res.json(personal);
        } catch (error) {
            console.error('Error en sedesController.getPersonal:', error);
            res.status(500).json({ error: 'Error al obtener personal de la sede', detalle: error.message });
        }
    }
};

module.exports = sedesController;
