const { evaluacionesService } = require('../services');

const evaluacionesController = {
    // GET /api/evaluaciones
    async getAll(req, res) {
        try {
            const { idAlumno, idInstructor, tipoEvaluacion, fechaDesde, fechaHasta } = req.query;
            const evaluaciones = await evaluacionesService.getAll({
                idAlumno: idAlumno ? Number(idAlumno) : undefined,
                idInstructor: idInstructor ? Number(idInstructor) : undefined,
                tipoEvaluacion,
                fechaDesde,
                fechaHasta
            });
            res.json(evaluaciones);
        } catch (error) {
            console.error('Error en evaluacionesController.getAll:', error);
            res.status(500).json({ error: 'Error al obtener evaluaciones', detalle: error.message });
        }
    },

    // GET /api/evaluaciones/:id
    async getById(req, res) {
        try {
            const { id } = req.params;
            const evaluacion = await evaluacionesService.getById(id);
            if (!evaluacion) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `La evaluación con ID ${id} no existe.` });
            }
            res.json(evaluacion);
        } catch (error) {
            console.error('Error en evaluacionesController.getById:', error);
            res.status(500).json({ error: 'Error al obtener evaluación', detalle: error.message });
        }
    },

    // GET /api/evaluaciones/alumno/:idAlumno
    async getByAlumno(req, res) {
        try {
            const { idAlumno } = req.params;
            const evaluaciones = await evaluacionesService.getByAlumno(idAlumno);
            res.json(evaluaciones);
        } catch (error) {
            console.error('Error en evaluacionesController.getByAlumno:', error);
            res.status(500).json({ error: 'Error al obtener evaluaciones del alumno', detalle: error.message });
        }
    },

    // GET /api/evaluaciones/alumno/:idAlumno/informe
    async getInformeRendimiento(req, res) {
        try {
            const { idAlumno } = req.params;
            const informe = await evaluacionesService.getInformeRendimiento(idAlumno);
            res.json(informe);
        } catch (error) {
            console.error('Error en evaluacionesController.getInformeRendimiento:', error);
            res.status(500).json({ error: 'Error al obtener informe de rendimiento', detalle: error.message });
        }
    },

    // POST /api/evaluaciones
    async create(req, res) {
        try {
            const { idAlumno, idInstructor, tipoEvaluacion, nota, fecha, observaciones } = req.body;

            if (!idAlumno || !idInstructor || !tipoEvaluacion || nota === undefined || !fecha) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Todos los campos son obligatorios (idAlumno, idInstructor, tipoEvaluacion, nota, fecha).'
                });
            }

            const nuevaEvaluacion = await evaluacionesService.create({
                idAlumno,
                idInstructor,
                tipoEvaluacion,
                nota,
                fecha,
                observaciones
            });

            res.status(201).json(nuevaEvaluacion);
        } catch (error) {
            if (error.message.includes('nota debe ser un valor')) {
                return res.status(400).json({ error: 'Validación de nota', mensaje: error.message });
            }
            console.error('Error en evaluacionesController.create:', error);
            res.status(500).json({ error: 'Error al registrar evaluación', detalle: error.message });
        }
    },

    // PUT /api/evaluaciones/:id
    async update(req, res) {
        try {
            const { id } = req.params;
            const { tipoEvaluacion, nota, fecha, observaciones } = req.body;

            const evaluacionActualizada = await evaluacionesService.update(id, {
                tipoEvaluacion,
                nota,
                fecha,
                observaciones
            });

            if (!evaluacionActualizada) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `La evaluación con ID ${id} no existe.` });
            }

            res.json(evaluacionActualizada);
        } catch (error) {
            if (error.message.includes('nota debe ser un valor')) {
                return res.status(400).json({ error: 'Validación de nota', mensaje: error.message });
            }
            console.error('Error en evaluacionesController.update:', error);
            res.status(500).json({ error: 'Error al actualizar evaluación', detalle: error.message });
        }
    },

    // DELETE /api/evaluaciones/:id
    async delete(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await evaluacionesService.delete(id);
            if (!eliminado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `La evaluación con ID ${id} no existe.` });
            }
            res.json({ mensaje: `Evaluación con ID ${id} eliminada correctamente.` });
        } catch (error) {
            console.error('Error en evaluacionesController.delete:', error);
            res.status(500).json({ error: 'Error al eliminar evaluación', detalle: error.message });
        }
    }
};

module.exports = evaluacionesController;
