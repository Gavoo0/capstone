const { vehiculosService } = require('../services');

const vehiculosController = {
    // GET /api/vehiculos
    async getAll(req, res) {
        try {
            const { idSede, estadoOperativo, transmision } = req.query;
            const vehiculos = await vehiculosService.getAll({
                idSede: idSede ? Number(idSede) : undefined,
                estadoOperativo,
                transmision
            });
            res.json(vehiculos);
        } catch (error) {
            console.error('Error en vehiculosController.getAll:', error);
            res.status(500).json({ error: 'Error al obtener vehículos', detalle: error.message });
        }
    },

    // GET /api/vehiculos/disponibles
    async getDisponibles(req, res) {
        try {
            const { idSede, fecha, horaInicio, horaFin, transmision } = req.query;

            if (!fecha || !horaInicio || !horaFin) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Debe especificar fecha, horaInicio y horaFin para consultar disponibilidad.'
                });
            }

            const disponibles = await vehiculosService.getDisponiblesParaHorario({
                idSede: idSede ? Number(idSede) : undefined,
                fecha,
                horaInicio,
                horaFin,
                transmision
            });

            res.json(disponibles);
        } catch (error) {
            console.error('Error en vehiculosController.getDisponibles:', error);
            res.status(500).json({ error: 'Error al consultar vehículos disponibles', detalle: error.message });
        }
    },

    // GET /api/vehiculos/:id
    async getById(req, res) {
        try {
            const { id } = req.params;
            const vehiculo = await vehiculosService.getById(id);
            if (!vehiculo) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El vehículo con ID ${id} no existe.` });
            }
            res.json(vehiculo);
        } catch (error) {
            console.error('Error en vehiculosController.getById:', error);
            res.status(500).json({ error: 'Error al obtener vehículo', detalle: error.message });
        }
    },

    // GET /api/vehiculos/patente/:patente
    async getByPatente(req, res) {
        try {
            const { patente } = req.params;
            const vehiculo = await vehiculosService.getByPatente(patente);
            if (!vehiculo) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `No se encontró vehículo con patente ${patente}.` });
            }
            res.json(vehiculo);
        } catch (error) {
            console.error('Error en vehiculosController.getByPatente:', error);
            res.status(500).json({ error: 'Error al buscar vehículo por patente', detalle: error.message });
        }
    },

    // POST /api/vehiculos
    async create(req, res) {
        try {
            const { patente, modelo, transmision, idSede, estadoOperativo } = req.body;

            if (!patente || !modelo || !transmision) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Los campos patente, modelo y transmisión son obligatorios.'
                });
            }

            const nuevoVehiculo = await vehiculosService.create({
                patente,
                modelo,
                transmision,
                idSede: idSede || null,
                estadoOperativo: estadoOperativo || 'OPERATIVO'
            });

            res.status(201).json(nuevoVehiculo);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Duplicado', mensaje: 'Ya existe un vehículo registrado con esa patente.' });
            }
            console.error('Error en vehiculosController.create:', error);
            res.status(500).json({ error: 'Error al registrar vehículo', detalle: error.message });
        }
    },

    // PUT /api/vehiculos/:id
    async update(req, res) {
        try {
            const { id } = req.params;
            const { patente, modelo, transmision, idSede, estadoOperativo } = req.body;

            const vehiculoActualizado = await vehiculosService.update(id, {
                patente,
                modelo,
                transmision,
                idSede,
                estadoOperativo
            });

            if (!vehiculoActualizado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El vehículo con ID ${id} no existe.` });
            }

            res.json(vehiculoActualizado);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Duplicado', mensaje: 'La patente ingresada ya pertenece a otro vehículo.' });
            }
            console.error('Error en vehiculosController.update:', error);
            res.status(500).json({ error: 'Error al actualizar vehículo', detalle: error.message });
        }
    },

    // PATCH /api/vehiculos/:id/estado
    async updateEstado(req, res) {
        try {
            const { id } = req.params;
            const { estadoOperativo } = req.body;

            if (!estadoOperativo) {
                return res.status(400).json({ error: 'Validación', mensaje: 'Debe especificar el nuevo estadoOperativo.' });
            }

            const ok = await vehiculosService.updateEstadoOperativo(id, estadoOperativo);
            if (!ok) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El vehículo con ID ${id} no existe.` });
            }

            res.json({ mensaje: `Estado del vehículo ${id} actualizado a ${estadoOperativo}.` });
        } catch (error) {
            console.error('Error en vehiculosController.updateEstado:', error);
            res.status(500).json({ error: 'Error al cambiar estado operativo', detalle: error.message });
        }
    },

    // DELETE /api/vehiculos/:id
    async delete(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await vehiculosService.delete(id);
            if (!eliminado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `El vehículo con ID ${id} no existe.` });
            }
            res.json({ mensaje: `Vehículo con ID ${id} eliminado correctamente.` });
        } catch (error) {
            if (error.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({
                    error: 'Restricción de integridad',
                    mensaje: 'No se puede eliminar el vehículo porque tiene clases o bloqueos asociados. Sugerimos cambiar su estado a DE_BAJA.'
                });
            }
            console.error('Error en vehiculosController.delete:', error);
            res.status(500).json({ error: 'Error al eliminar vehículo', detalle: error.message });
        }
    }
};

module.exports = vehiculosController;
