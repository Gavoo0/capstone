const { alumnosService } = require('../services');

const alumnosController = {
    // GET /api/alumnos
    async getAll(req, res) {
        try {
            const alumnos = await alumnosService.getAll();
            res.json(alumnos);
        } catch (error) {
            console.error('Error en alumnosController.getAll:', error);
            res.status(500).json({ error: 'Error al obtener alumnos', detalle: error.message });
        }
    },

    // GET /api/alumnos/:idUsuario
    async getByUsuarioId(req, res) {
        try {
            const { idUsuario } = req.params;
            const alumno = await alumnosService.getByUsuarioId(idUsuario);
            if (!alumno) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `No existe ficha de alumno para el ID de usuario ${idUsuario}.` });
            }
            res.json(alumno);
        } catch (error) {
            console.error('Error en alumnosController.getByUsuarioId:', error);
            res.status(500).json({ error: 'Error al obtener ficha de alumno', detalle: error.message });
        }
    },

    // PUT /api/alumnos/:idUsuario/psicotecnico
    async updatePsicotecnico(req, res) {
        try {
            const { idUsuario } = req.params;
            const { estadoPsicotecnico, fechaEvaluacion, observacion } = req.body;

            if (!estadoPsicotecnico || !fechaEvaluacion) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Debe ingresar estadoPsicotecnico (APROBADO/RECHAZADO/PENDIENTE) y fechaEvaluacion.'
                });
            }

            const alumnoActualizado = await alumnosService.updatePsicotecnico(idUsuario, {
                estadoPsicotecnico: estadoPsicotecnico.toUpperCase(),
                fechaEvaluacion,
                observacion
            });

            if (!alumnoActualizado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `No existe alumno con ID ${idUsuario}.` });
            }

            res.json(alumnoActualizado);
        } catch (error) {
            console.error('Error en alumnosController.updatePsicotecnico:', error);
            res.status(500).json({ error: 'Error al actualizar examen psicotécnico', detalle: error.message });
        }
    },

    // PUT /api/alumnos/:idUsuario/asistencia-teorica
    async updateAsistenciaTeorica(req, res) {
        try {
            const { idUsuario } = req.params;
            const { porcentaje } = req.body;

            if (porcentaje === undefined || isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'El porcentaje de asistencia debe ser un número entre 0 y 100.'
                });
            }

            const alumnoActualizado = await alumnosService.updateAsistenciaTeorica(idUsuario, porcentaje);
            if (!alumnoActualizado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `No existe alumno con ID ${idUsuario}.` });
            }

            res.json(alumnoActualizado);
        } catch (error) {
            console.error('Error en alumnosController.updateAsistenciaTeorica:', error);
            res.status(500).json({ error: 'Error al actualizar asistencia teórica', detalle: error.message });
        }
    },

    // GET /api/alumnos/:idUsuario/habilitado
    async checkHabilitado(req, res) {
        try {
            const { idUsuario } = req.params;
            const resultado = await alumnosService.isHabilitadoParaPractica(idUsuario);
            res.json(resultado);
        } catch (error) {
            console.error('Error en alumnosController.checkHabilitado:', error);
            res.status(500).json({ error: 'Error al verificar habilitación del alumno', detalle: error.message });
        }
    },

    // GET /api/alumnos/:idUsuario/progreso
    async getProgreso(req, res) {
        try {
            const { idUsuario } = req.params;
            const progreso = await alumnosService.getProgresoGeneral(idUsuario);
            if (!progreso) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `No existe alumno con ID ${idUsuario}.` });
            }
            res.json(progreso);
        } catch (error) {
            console.error('Error en alumnosController.getProgreso:', error);
            res.status(500).json({ error: 'Error al consultar progreso del alumno', detalle: error.message });
        }
    }
};

module.exports = alumnosController;
