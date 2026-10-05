const { clasesPracticasService } = require('../services');

const clasesPracticasController = {
    // GET /api/clases
    async getAll(req, res) {
        try {
            const { idSede, idAlumno, idInstructor, idVehiculo, fecha, fechaDesde, fechaHasta, estado } = req.query;
            const clases = await clasesPracticasService.getAll({
                idSede: idSede ? Number(idSede) : undefined,
                idAlumno: idAlumno ? Number(idAlumno) : undefined,
                idInstructor: idInstructor ? Number(idInstructor) : undefined,
                idVehiculo: idVehiculo ? Number(idVehiculo) : undefined,
                fecha,
                fechaDesde,
                fechaHasta,
                estado
            });
            res.json(clases);
        } catch (error) {
            console.error('Error en clasesPracticasController.getAll:', error);
            res.status(500).json({ error: 'Error al obtener clases prácticas', detalle: error.message });
        }
    },

    // GET /api/clases/:id
    async getById(req, res) {
        try {
            const { id } = req.params;
            const clase = await clasesPracticasService.getById(id);
            if (!clase) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `La clase práctica con ID ${id} no existe.` });
            }
            res.json(clase);
        } catch (error) {
            console.error('Error en clasesPracticasController.getById:', error);
            res.status(500).json({ error: 'Error al obtener clase práctica', detalle: error.message });
        }
    },

    // GET /api/clases/autogestion/:token
    async getByToken(req, res) {
        try {
            const { token } = req.params;
            const clase = await clasesPracticasService.getByToken(token);
            if (!clase) {
                return res.status(404).json({
                    error: 'Token no válido',
                    mensaje: 'No se encontró ninguna clase asociada a este enlace de autogestión.'
                });
            }
            res.json(clase);
        } catch (error) {
            console.error('Error en clasesPracticasController.getByToken:', error);
            res.status(500).json({ error: 'Error al consultar autogestión de clase', detalle: error.message });
        }
    },

    // POST /api/clases
    async agendar(req, res) {
        try {
            const { idAlumno, idInstructor, idVehiculo, idSede, fecha, horaInicio, horaFin, observaciones, omitirValidacionAlumno } = req.body;

            if (!idAlumno || !idInstructor || !idVehiculo || !idSede || !fecha || !horaInicio || !horaFin) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Todos los campos de agendamiento son obligatorios (idAlumno, idInstructor, idVehiculo, idSede, fecha, horaInicio, horaFin).'
                });
            }

            const nuevaClase = await clasesPracticasService.agendarClase({
                idAlumno,
                idInstructor,
                idVehiculo,
                idSede,
                fecha,
                horaInicio,
                horaFin,
                observaciones,
                omitirValidacionAlumno: Boolean(omitirValidacionAlumno)
            });

            res.status(201).json(nuevaClase);
        } catch (error) {
            // Manejo de códigos HTTP personalizados desde las reglas de negocio del servicio
            if (error.status) {
                return res.status(error.status).json({
                    error: error.status === 409 ? 'Conflicto de horario' : 'Regla de negocio no cumplida',
                    mensaje: error.message
                });
            }
            console.error('Error en clasesPracticasController.agendar:', error);
            res.status(500).json({ error: 'Error al agendar clase práctica', detalle: error.message });
        }
    },

    // PATCH /api/clases/:id/estado
    async cambiarEstado(req, res) {
        try {
            const { id } = req.params;
            const { estado, observaciones } = req.body;

            if (!estado) {
                return res.status(400).json({ error: 'Validación', mensaje: 'Debe especificar el nuevo estado.' });
            }

            const claseActualizada = await clasesPracticasService.cambiarEstado(id, estado, observaciones);
            if (!claseActualizada) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `La clase con ID ${id} no existe.` });
            }

            res.json(claseActualizada);
        } catch (error) {
            console.error('Error en clasesPracticasController.cambiarEstado:', error);
            res.status(500).json({ error: 'Error al cambiar estado de clase', detalle: error.message });
        }
    },

    // PATCH /api/clases/:id/cancelar
    async cancelar(req, res) {
        try {
            const { id } = req.params;
            const { motivo } = req.body;

            const claseCancelada = await clasesPracticasService.cancelarClase(id, motivo);
            if (!claseCancelada) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `La clase con ID ${id} no existe.` });
            }

            res.json({ mensaje: 'Clase cancelada exitosamente.', clase: claseCancelada });
        } catch (error) {
            console.error('Error en clasesPracticasController.cancelar:', error);
            res.status(500).json({ error: 'Error al cancelar clase', detalle: error.message });
        }
    },

    // PATCH /api/clases/:id/reprogramar
    async reprogramar(req, res) {
        try {
            const { id } = req.params;
            const { nuevaFecha, nuevaHoraInicio, nuevaHoraFin, nuevoIdInstructor, nuevoIdVehiculo } = req.body;

            const claseReprogramada = await clasesPracticasService.reprogramarClase(id, {
                nuevaFecha,
                nuevaHoraInicio,
                nuevaHoraFin,
                nuevoIdInstructor,
                nuevoIdVehiculo
            });

            res.json({ mensaje: 'Clase reprogramada exitosamente.', clase: claseReprogramada });
        } catch (error) {
            if (error.status) {
                return res.status(error.status).json({
                    error: 'Conflicto de horario',
                    mensaje: error.message
                });
            }
            console.error('Error en clasesPracticasController.reprogramar:', error);
            res.status(500).json({ error: 'Error al reprogramar clase', detalle: error.message });
        }
    }
};

module.exports = clasesPracticasController;
