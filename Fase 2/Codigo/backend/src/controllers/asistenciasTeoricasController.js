const { asistenciasTeoricasService } = require('../services');

const asistenciasTeoricasController = {
    // GET /api/asistencias
    async getAll(req, res) {
        try {
            const { idAlumno, idInstructor, fecha, estado } = req.query;
            const asistencias = await asistenciasTeoricasService.getAll({
                idAlumno: idAlumno ? Number(idAlumno) : undefined,
                idInstructor: idInstructor ? Number(idInstructor) : undefined,
                fecha,
                estado
            });
            res.json(asistencias);
        } catch (error) {
            console.error('Error en asistenciasTeoricasController.getAll:', error);
            res.status(500).json({ error: 'Error al obtener asistencias teóricas', detalle: error.message });
        }
    },

    // GET /api/asistencias/alumno/:idAlumno
    async getByAlumno(req, res) {
        try {
            const { idAlumno } = req.params;
            const asistencias = await asistenciasTeoricasService.getByAlumno(idAlumno);
            res.json(asistencias);
        } catch (error) {
            console.error('Error en asistenciasTeoricasController.getByAlumno:', error);
            res.status(500).json({ error: 'Error al obtener asistencias del alumno', detalle: error.message });
        }
    },

    // POST /api/asistencias
    async create(req, res) {
        try {
            const { idAlumno, idInstructor, nombreBloque, fecha, estado } = req.body;

            if (!idAlumno || !idInstructor || !nombreBloque || !fecha || !estado) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Todos los campos son obligatorios (idAlumno, idInstructor, nombreBloque, fecha, estado).'
                });
            }

            const nuevaAsistencia = await asistenciasTeoricasService.create({
                idAlumno,
                idInstructor,
                nombreBloque,
                fecha,
                estado: estado.toUpperCase()
            });

            res.status(201).json(nuevaAsistencia);
        } catch (error) {
            console.error('Error en asistenciasTeoricasController.create:', error);
            res.status(500).json({ error: 'Error al registrar asistencia teórica', detalle: error.message });
        }
    },

    // POST /api/asistencias/masiva
    async registrarMasiva(req, res) {
        try {
            const { asistencias, idInstructor, nombreBloque, fecha } = req.body;

            if (!Array.isArray(asistencias) || asistencias.length === 0 || !idInstructor || !nombreBloque || !fecha) {
                return res.status(400).json({
                    error: 'Validación',
                    mensaje: 'Debe enviar un arreglo "asistencias", además de idInstructor, nombreBloque y fecha.'
                });
            }

            const resultado = await asistenciasTeoricasService.registrarMasiva(asistencias, {
                idInstructor,
                nombreBloque,
                fecha
            });

            res.status(201).json({
                mensaje: `Se registraron exitosamente ${resultado.totalRegistrados} asistencias y se actualizaron los porcentajes de los alumnos.`
            });
        } catch (error) {
            console.error('Error en asistenciasTeoricasController.registrarMasiva:', error);
            res.status(500).json({ error: 'Error al registrar asistencia masiva', detalle: error.message });
        }
    },

    // DELETE /api/asistencias/:id
    async delete(req, res) {
        try {
            const { id } = req.params;
            const eliminado = await asistenciasTeoricasService.delete(id);
            if (!eliminado) {
                return res.status(404).json({ error: 'No encontrado', mensaje: `La asistencia con ID ${id} no existe.` });
            }
            res.json({ mensaje: `Asistencia con ID ${id} eliminada y porcentaje recalculado.` });
        } catch (error) {
            console.error('Error en asistenciasTeoricasController.delete:', error);
            res.status(500).json({ error: 'Error al eliminar asistencia', detalle: error.message });
        }
    }
};

module.exports = asistenciasTeoricasController;
