const router = require('express').Router();

router.use('/alumnos', require('./alumnosRoutes'));
router.use('/asistencias', require('./asistenciasTeoricasRoutes'));
router.use('/bloqueos', require('./bloqueosFlotaRoutes'));
router.use('/clases', require('./clasesPracticasRoutes'));
router.use('/evaluaciones', require('./evaluacionesRoutes'));
router.use('/roles', require('./rolesRoutes'));
router.use('/sedes', require('./sedesRoutes'));
router.use('/usuarios', require('./usuariosRoutes'));
router.use('/vehiculos', require('./vehiculosRoutes'));

module.exports = router;
