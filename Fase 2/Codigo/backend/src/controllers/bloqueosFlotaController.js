const { bloqueosFlotaService } = require('../services');

const bloqueosFlotaController = {
    // GET /api/bloqueos
    async getAll(req, res) {
        try {
            const { idVehiculo, idInstructor, fecha, fechaDesde, fechaHasta } = req.query;
            const bloqueos = await bloqueosFlotaService.getAll({
                idVehiculo: idVehiculo ? Number(idVehiculo) : undefined,
                idInstructor: idInstructor ? Number(idInstructor) : undefined,
                fecha,
                fechaDesde,
                fechaHasta
            });
            res.json(bloqueos);
        } catch (error) {
            console.error('Error en bloqueosFlotaController.getAll:', error);
            res.status(500).json({ error: 'Error al obtener bloqueos de flota', detalle: error.message });
        }
    },

    // GET /api/bloqueos/:id
    async getById(req, res) {
        try {
            const { id } = req.params;
            const bloqueo = await bloqueosFlotaService.getById(id);
            if (!bloqueo) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El bloqueo con ID ${id} no existe.` });
            }
            res.json(bloqueo);
        } catch (error) {
            console.error('Error en bloqueosFlotaController.getById:', error);
            res.status(500).json({ error: 'Error al obtener bloqueo', detalle: error.message });
        }
    },

    // POST /api/bloqueos
    async create(req, res) {
        try {
            const { idVehiculo, idInstructor, fecha, horaInicio, horaFin, motivo } = req.body;

            if (!idVehiculo || !fecha || !horaInicio || !horaFin || !motivo) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Los campos idVehiculo, fecha, horaInicio, horaFin y motivo son obligatorios.'
                });
            }

            const nuevoBloqueo = await bloqueosFlotaService.create({
                idVehiculo,
                idInstructor: idInstructor || null,
                fecha,
                horaInicio,
                horaFin,
                motivo
            });

            res.status(201).json(nuevoBloqueo);
        } catch (error) {
            if (error.conflictos) {
                return res.status(409).json({
                    error: 'Conflicto de agenda',
                    mensaje: error.message,
                    clasesAfectadas: error.conflictos
                });
            }
            console.error('Error en bloqueosFlotaController.create:', error);
            res.status(500).json({ error: 'Error al crear bloqueo', detalle: error.message });
        }
    },

    // PUT /api/bloqueos/:id
    async update(req, res) {
        try {
            const { id } = req.params;
            const { idVehiculo, idInstructor, fecha, horaInicio, horaFin, motivo } = req.body;

            const bloqueoActualizado = await bloqueosFlotaService.update(id, {
                idVehiculo,
                idInstructor,
                fecha,
                horaInicio,
                horaFin,
                motivo
            });

            if (!bloqueoActualizado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El bloqueo con ID ${id} no existe.` });
            }

            res.json(bloqueoActualizado);
        } catch (error) {
            console.error('Error en bloqueosFlotaController.update:', error);
            res.status(500).json({ error: 'Error al actualizar bloqueo', detalle: error.message });
        }
    },

    // DELETE /api/bloqueos/:id
    async delete(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await bloqueosFlotaService.delete(id);
            if (!eliminado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El bloqueo con ID ${id} no existe.` });
            }
            res.json({ mensaje: `Bloqueo con ID ${id} levantado correctamente.` });
        } catch (error) {
            console.error('Error en bloqueosFlotaController.delete:', error);
            res.status(500).json({ error: 'Error al eliminar bloqueo', detalle: error.message });
        }
    }
};

module.exports = bloqueosFlotaController;
