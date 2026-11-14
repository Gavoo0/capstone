const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const sedesController = require('../controllers/sedesController');

router.use('/preinscripciones', require('./preinscripcionesRoutes'));
router.use('/usuarios', require('./usuariosRoutes'));
router.use('/clases', require('./clasesPracticasRoutes'));
router.get('/sedes', sedesController.getAll);
router.use(authenticate);

router.use('/alumnos', require('./alumnosRoutes'));
router.use('/asistencias', require('./asistenciasTeoricasRoutes'));
router.use('/bloqueos', require('./bloqueosFlotaRoutes'));
router.use('/evaluaciones', require('./evaluacionesRoutes'));
router.use('/roles', require('./rolesRoutes'));
router.use('/sedes', require('./sedesRoutes'));
router.use('/vehiculos', require('./vehiculosRoutes'));

module.exports = router;
